import pytest
from models import db, BatchHistory, BatchStatus
from datetime import datetime, timedelta

def test_dashboard_unauthorized(client):
    response = client.get('/dashboard')
    assert response.status_code == 302

def test_dashboard_authorized(auth_client):
    response = auth_client.get('/dashboard')
    assert response.status_code == 200
    assert 'ダッシュボード' in response.get_data(as_text=True)

def test_dashboard_stats_api(auth_client, app):
    with app.app_context():
        batch1 = BatchHistory(
            file_name='test1.csv',
            status=BatchStatus.SUCCESS,
            total_records=100,
            success_records=100,
            processing_time=60.0,
            created_at=datetime.utcnow()
        )
        batch2 = BatchHistory(
            file_name='test2.csv',
            status=BatchStatus.ERROR,
            total_records=50,
            error_records=50,
            processing_time=30.0,
            created_at=datetime.utcnow()
        )
        db.session.add_all([batch1, batch2])
        db.session.commit()
    
    response = auth_client.get('/api/dashboard/stats?period=7d')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert data['data']['summary']['total_batches'] == 2
    assert data['data']['summary']['successful_batches'] == 1
    assert data['data']['summary']['failed_batches'] == 1

def test_dashboard_stats_30d_period(auth_client, app):
    with app.app_context():
        old_batch = BatchHistory(
            file_name='old.csv',
            status=BatchStatus.SUCCESS,
            total_records=100,
            created_at=datetime.utcnow() - timedelta(days=45)
        )
        recent_batch = BatchHistory(
            file_name='recent.csv',
            status=BatchStatus.SUCCESS,
            total_records=100,
            created_at=datetime.utcnow() - timedelta(days=15)
        )
        db.session.add_all([old_batch, recent_batch])
        db.session.commit()
    
    response = auth_client.get('/api/dashboard/stats?period=30d')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert data['data']['summary']['total_batches'] == 1

def test_dashboard_with_recent_batches(auth_client, app):
    with app.app_context():
        for i in range(15):
            batch = BatchHistory(
                file_name=f'batch_{i}.csv',
                status=BatchStatus.SUCCESS,
                total_records=100,
                processing_time=60.0
            )
            db.session.add(batch)
        db.session.commit()
    
    response = auth_client.get('/dashboard')
    assert response.status_code == 200
    content = response.get_data(as_text=True)
    assert 'batch_0.csv' in content or 'batch_14.csv' in content

def test_dashboard_empty_state(auth_client):
    response = auth_client.get('/dashboard')
    assert response.status_code == 200
    content = response.get_data(as_text=True)
    assert 'ダッシュボード' in content
