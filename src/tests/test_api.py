import pytest
import json
from models import db, BatchHistory, BatchStatus

def test_health_check(client):
    response = client.get('/api/v1/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert 'status' in data['data']

def test_execute_batch_unauthorized(client):
    response = client.post('/api/v1/batch/execute',
                          json={'file_name': 'test.csv'},
                          content_type='application/json')
    assert response.status_code == 302

def test_execute_batch_insufficient_permissions(auth_client, app):
    with app.app_context():
        from models import User
        user = User.query.filter_by(email='yamada@example.com').first()
        user.roles = 'viewer'
        db.session.commit()
    
    response = auth_client.post('/api/v1/batch/execute',
                               json={'file_name': 'test.csv'},
                               content_type='application/json')
    assert response.status_code == 403
    data = response.get_json()
    assert data['error']['code'] == 'INSUFFICIENT_PERMISSIONS'

def test_execute_batch_missing_filename(auth_client):
    response = auth_client.post('/api/v1/batch/execute',
                               json={},
                               content_type='application/json')
    assert response.status_code == 422
    data = response.get_json()
    assert data['error']['code'] == 'VALIDATION_ERROR'

def test_get_batch_status(auth_client, app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            status=BatchStatus.SUCCESS,
            total_records=100,
            success_records=95,
            error_records=5
        )
        db.session.add(batch)
        db.session.commit()
        batch_id = batch.id
    
    response = auth_client.get(f'/api/v1/batch/{batch_id}/status')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert data['data']['batch_id'] == batch_id
    assert data['data']['status'] == 'SUCCESS'

def test_get_batch_status_not_found(auth_client):
    response = auth_client.get('/api/v1/batch/99999/status')
    assert response.status_code == 404

def test_stop_batch_not_running(auth_client, app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            status=BatchStatus.SUCCESS
        )
        db.session.add(batch)
        db.session.commit()
        batch_id = batch.id
    
    response = auth_client.post(f'/api/v1/batch/{batch_id}/stop')
    assert response.status_code == 400
    data = response.get_json()
    assert data['error']['code'] == 'INVALID_STATUS'

def test_get_batch_history(auth_client, app):
    with app.app_context():
        for i in range(5):
            batch = BatchHistory(
                file_name=f'test_{i}.csv',
                status=BatchStatus.SUCCESS,
                total_records=100
            )
            db.session.add(batch)
        db.session.commit()
    
    response = auth_client.get('/api/v1/history')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert len(data['data']['items']) == 5

def test_get_batch_history_with_filters(auth_client, app):
    with app.app_context():
        batch1 = BatchHistory(
            file_name='success.csv',
            status=BatchStatus.SUCCESS
        )
        batch2 = BatchHistory(
            file_name='error.csv',
            status=BatchStatus.ERROR
        )
        db.session.add_all([batch1, batch2])
        db.session.commit()
    
    response = auth_client.get('/api/v1/history?status=SUCCESS')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['data']['items']) == 1
    assert data['data']['items'][0]['file_name'] == 'success.csv'

def test_get_batch_history_pagination(auth_client, app):
    with app.app_context():
        for i in range(25):
            batch = BatchHistory(
                file_name=f'test_{i}.csv',
                status=BatchStatus.SUCCESS
            )
            db.session.add(batch)
        db.session.commit()
    
    response = auth_client.get('/api/v1/history?page=1&limit=10')
    assert response.status_code == 200
    data = response.get_json()
    assert len(data['data']['items']) == 10
    assert data['data']['pagination']['total_pages'] == 3
