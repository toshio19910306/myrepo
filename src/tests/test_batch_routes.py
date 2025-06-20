import pytest
import os
import tempfile
from werkzeug.datastructures import FileStorage
from models import db, BatchHistory, BatchStatus

def test_batch_status_unauthorized(client):
    response = client.get('/batch/')
    assert response.status_code == 302

def test_batch_status_authorized(auth_client):
    response = auth_client.get('/batch/')
    assert response.status_code == 200
    assert 'バッチ処理状況' in response.get_data(as_text=True)

def test_batch_history_unauthorized(client):
    response = client.get('/batch/history')
    assert response.status_code == 302

def test_batch_history_authorized(auth_client):
    response = auth_client.get('/batch/history')
    assert response.status_code == 200
    assert '処理履歴' in response.get_data(as_text=True)

def test_batch_history_with_data(auth_client, app):
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
    
    response = auth_client.get('/batch/history')
    assert response.status_code == 200
    content = response.get_data(as_text=True)
    assert 'test.csv' in content

def test_batch_history_with_filters(auth_client, app):
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
    
    response = auth_client.get('/batch/history?status=SUCCESS')
    assert response.status_code == 200
    content = response.get_data(as_text=True)
    assert 'success.csv' in content

def test_upload_file_unauthorized(client):
    response = client.post('/batch/upload')
    assert response.status_code == 302

def test_upload_file_no_file(auth_client):
    response = auth_client.post('/batch/upload', data={})
    assert response.status_code == 302

def test_upload_file_empty_filename(auth_client):
    data = {'file': (FileStorage(), '')}
    response = auth_client.post('/batch/upload', data=data)
    assert response.status_code == 302

def test_upload_file_invalid_extension(auth_client):
    data = {'file': (FileStorage(filename='test.txt'), 'test.txt')}
    response = auth_client.post('/batch/upload', data=data)
    assert response.status_code == 302

def test_execute_batch_unauthorized(client):
    response = client.post('/batch/execute')
    assert response.status_code == 302

def test_execute_batch_no_filename(auth_client):
    response = auth_client.post('/batch/execute', data={})
    assert response.status_code == 302

def test_execute_batch_api_format(auth_client):
    response = auth_client.post('/batch/execute',
                               json={'file_name': 'test.csv'},
                               content_type='application/json')
    assert response.status_code == 500

def test_batch_status_with_running_batches(auth_client, app):
    with app.app_context():
        batch = BatchHistory(
            file_name='running.csv',
            status=BatchStatus.RUNNING,
            total_records=1000,
            success_records=500,
            error_records=0
        )
        db.session.add(batch)
        db.session.commit()
    
    response = auth_client.get('/batch/')
    assert response.status_code == 200
    content = response.get_data(as_text=True)
    assert 'running.csv' in content
    assert '実行中' in content

def test_allowed_file_function():
    from routes.batch import allowed_file
    
    assert allowed_file('test.csv') == True
    assert allowed_file('test.CSV') == True
    assert allowed_file('test.txt') == False
    assert allowed_file('test') == False
    assert allowed_file('test.csv.txt') == False
