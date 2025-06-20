import pytest
import os
import tempfile
from decimal import Decimal
from datetime import date
from services.batch_service import BatchService
from models import db, BatchHistory, WorkRecord, Employee, Project, BatchStatus

def test_batch_service_initialization():
    service = BatchService()
    assert service.max_file_size == 100 * 1024 * 1024
    assert service.batch_size == 1000

def test_validate_file_not_found():
    service = BatchService()
    with pytest.raises(FileNotFoundError):
        service._validate_file('/nonexistent/file.csv')

def test_validate_file_too_large(app, sample_csv_file):
    with app.app_context():
        service = BatchService()
        service.max_file_size = 10
        
        with pytest.raises(ValueError, match="ファイルサイズが上限を超過"):
            service._validate_file(sample_csv_file)

def test_read_csv_file(app, sample_csv_file):
    with app.app_context():
        service = BatchService()
        df = service._read_csv_file(sample_csv_file)
        
        assert len(df) == 2
        assert 'work_date' in df.columns
        assert 'employee_id' in df.columns
        assert df.iloc[0]['employee_id'] == 'EMP001'

def test_ensure_employee_exists(app):
    with app.app_context():
        service = BatchService()
        
        data = {
            'employee_id': 'EMP999',
            'employee_name': '新規社員'
        }
        
        service._ensure_employee_exists(data)
        db.session.commit()
        
        employee = Employee.query.filter_by(employee_id='EMP999').first()
        assert employee is not None
        assert employee.employee_name == '新規社員'

def test_ensure_project_exists(app):
    with app.app_context():
        service = BatchService()
        
        data = {
            'project_id': 'PRJ999',
            'project_name': '新規プロジェクト'
        }
        
        service._ensure_project_exists(data)
        db.session.commit()
        
        project = Project.query.filter_by(project_id='PRJ999').first()
        assert project is not None
        assert project.project_name == '新規プロジェクト'

def test_start_batch(app, sample_csv_file):
    with app.app_context():
        service = BatchService()
        
        os.makedirs('uploads', exist_ok=True)
        import shutil
        shutil.copy(sample_csv_file, 'uploads/test.csv')
        
        batch_id = service.start_batch('test.csv', 'TEST001')
        
        batch = BatchHistory.query.get(batch_id)
        assert batch is not None
        assert batch.file_name == 'test.csv'
        assert batch.started_by == 'TEST001'

def test_fail_batch(app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            status=BatchStatus.RUNNING
        )
        db.session.add(batch)
        db.session.commit()
        
        service = BatchService()
        service._fail_batch(batch.id, 'テストエラー')
        
        updated_batch = BatchHistory.query.get(batch.id)
        assert updated_batch.status == BatchStatus.ERROR
        assert updated_batch.error_message == 'テストエラー'

def test_stop_batch(app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            status=BatchStatus.RUNNING
        )
        db.session.add(batch)
        db.session.commit()
        
        service = BatchService()
        service.stop_batch(batch.id)
        
        updated_batch = BatchHistory.query.get(batch.id)
        assert updated_batch.status == BatchStatus.STOPPED
