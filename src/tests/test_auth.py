import pytest
from flask import url_for

def test_login_page(client):
    response = client.get('/auth/login')
    assert response.status_code == 200
    assert 'Azure ADでログインしてください' in response.get_data(as_text=True)

def test_login_success(client):
    response = client.post('/auth/login', data={
        'azure_token': 'mock_token'
    })
    assert response.status_code == 302

def test_login_invalid_token(client):
    response = client.post('/auth/login', data={
        'azure_token': 'invalid_token'
    })
    assert response.status_code == 200
    assert '無効なトークンです' in response.get_data(as_text=True)

def test_login_missing_token(client):
    response = client.post('/auth/login', data={})
    assert response.status_code == 200
    assert 'Azure ADトークンが必要です' in response.get_data(as_text=True)

def test_login_api_success(client):
    response = client.post('/auth/login', 
                          json={'azure_token': 'mock_token'},
                          content_type='application/json')
    assert response.status_code == 200
    data = response.get_json()
    assert data['success'] == True
    assert 'user' in data['data']

def test_login_api_invalid_token(client):
    response = client.post('/auth/login', 
                          json={'azure_token': 'invalid_token'},
                          content_type='application/json')
    assert response.status_code == 401
    data = response.get_json()
    assert data['success'] == False
    assert data['error']['code'] == 'INVALID_TOKEN'

def test_logout(auth_client):
    response = auth_client.post('/auth/logout')
    assert response.status_code == 302

def test_protected_route_redirect(client):
    response = client.get('/dashboard')
    assert response.status_code == 302
    assert '/auth/login' in response.location

def test_authenticated_access(auth_client):
    response = auth_client.get('/dashboard')
    assert response.status_code == 200
