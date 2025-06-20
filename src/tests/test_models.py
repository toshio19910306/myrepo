import pytest
from datetime import date, datetime
from decimal import Decimal
from models import User, Employee, Project, WorkRecord, BatchHistory, BatchStatus

def test_user_model(app):
    with app.app_context():
        user = User(
            id='TEST002',
            name='テストユーザー2',
            email='test2@example.com',
            roles='viewer'
        )
        
        assert user.has_role('viewer') == True
        assert user.has_role('admin') == False
        assert user.has_role('operator') == False

def test_employee_model(app):
    with app.app_context():
        employee = Employee(
            employee_id='EMP002',
            employee_name='佐藤花子',
            department='営業部',
            position='マネージャー',
            email='sato@example.com',
            hire_date=date(2020, 4, 1),
            is_active=True
        )
        
        assert employee.employee_name == '佐藤花子'
        assert employee.department == '営業部'
        assert employee.is_active == True

def test_project_model(app):
    with app.app_context():
        project = Project(
            project_id='PRJ002',
            project_name='新規プロジェクト',
            description='新規開発プロジェクト',
            start_date=date(2024, 1, 1),
            end_date=date(2024, 12, 31),
            budget=Decimal('10000000.00'),
            is_active=True
        )
        
        assert project.project_name == '新規プロジェクト'
        assert project.budget == Decimal('10000000.00')
        assert project.is_active == True

def test_work_record_model(app):
    with app.app_context():
        work_record = WorkRecord(
            work_date=date(2024, 1, 15),
            employee_id='EMP001',
            project_id='PRJ001',
            work_content='テスト作業',
            work_hours=Decimal('8.0'),
            hourly_rate=Decimal('5000.00'),
            total_cost=Decimal('40000.00'),
            order_amount=Decimal('45000.00'),
            remarks='テスト用レコード'
        )
        
        assert work_record.work_hours == Decimal('8.0')
        assert work_record.total_cost == Decimal('40000.00')

def test_batch_history_model(app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            status=BatchStatus.SUCCESS,
            total_records=100,
            success_records=95,
            error_records=5,
            processing_time=120.5
        )
        
        assert batch.progress_percentage == 100.0
        assert batch.success_rate == 95.0
        assert batch.status == BatchStatus.SUCCESS

def test_batch_history_progress_calculation(app):
    with app.app_context():
        batch = BatchHistory(
            file_name='test.csv',
            total_records=1000,
            success_records=800,
            error_records=100
        )
        
        assert batch.progress_percentage == 90.0
        assert batch.success_rate == 80.0
        
        batch_empty = BatchHistory(
            file_name='empty.csv',
            total_records=0,
            success_records=0,
            error_records=0
        )
        
        assert batch_empty.progress_percentage == 0
        assert batch_empty.success_rate == 0
