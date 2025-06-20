import pytest
import os
import tempfile
from app import create_app
from models import db, User, Employee, Project, WorkRecord, BatchHistory

@pytest.fixture
def app():
    app = create_app(testing=True)
    
    with app.app_context():
        db.create_all()
        
        test_user = User(
            id='TEST001',
            name='テストユーザー',
            email='test@example.com',
            roles='admin,operator'
        )
        db.session.add(test_user)
        
        test_employee = Employee(
            employee_id='EMP001',
            employee_name='山田太郎',
            department='開発部',
            position='エンジニア',
            email='yamada@example.com'
        )
        db.session.add(test_employee)
        
        test_project = Project(
            project_id='PRJ001',
            project_name='テストプロジェクト',
            description='テスト用プロジェクト'
        )
        db.session.add(test_project)
        
        db.session.commit()
        
        yield app
        
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

@pytest.fixture
def auth_client(client):
    client.post('/auth/login', data={'azure_token': 'mock_token'})
    return client

@pytest.fixture
def sample_csv_file():
    csv_content = """作業日,社員ID,社員名,プロジェクトID,プロジェクト名,作業内容,工数,単価,費用,発注金額,備考
2024-01-01,EMP001,山田太郎,PRJ001,テストプロジェクト,設計作業,8.0,5000,40000,45000,テスト用データ
2024-01-02,EMP001,山田太郎,PRJ001,テストプロジェクト,実装作業,7.5,5000,37500,42000,テスト用データ"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
        f.write(csv_content)
        f.flush()
        yield f.name
    
    os.unlink(f.name)
