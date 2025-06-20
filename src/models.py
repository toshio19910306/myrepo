from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from enum import Enum
from sqlalchemy import Numeric
import uuid

db = SQLAlchemy()

class BatchStatus(Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    ERROR = "ERROR"
    STOPPED = "STOPPED"

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    roles = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def has_role(self, role):
        if not self.roles:
            return False
        return role in self.roles.split(',')

class Employee(db.Model):
    __tablename__ = 'employees'
    
    employee_id = db.Column(db.String(10), primary_key=True)
    employee_name = db.Column(db.String(50), nullable=False)
    department = db.Column(db.String(50))
    position = db.Column(db.String(50))
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    hire_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    work_records = db.relationship('WorkRecord', backref='employee', lazy=True)

class Project(db.Model):
    __tablename__ = 'projects'
    
    project_id = db.Column(db.String(20), primary_key=True)
    project_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date)
    end_date = db.Column(db.Date)
    budget = db.Column(Numeric(15, 2))
    manager_id = db.Column(db.String(10), db.ForeignKey('employees.employee_id'))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    work_records = db.relationship('WorkRecord', backref='project', lazy=True)

class WorkRecord(db.Model):
    __tablename__ = 'work_records'
    
    id = db.Column(db.Integer, primary_key=True)
    work_date = db.Column(db.Date, nullable=False)
    employee_id = db.Column(db.String(10), db.ForeignKey('employees.employee_id'), nullable=False)
    project_id = db.Column(db.String(20), db.ForeignKey('projects.project_id'), nullable=False)
    work_content = db.Column(db.String(200), nullable=False)
    work_hours = db.Column(Numeric(5, 2), nullable=False)
    hourly_rate = db.Column(Numeric(10, 2), nullable=False)
    total_cost = db.Column(Numeric(15, 2), nullable=False)
    order_amount = db.Column(Numeric(15, 2))
    remarks = db.Column(db.String(500))
    batch_id = db.Column(db.Integer, db.ForeignKey('batch_history.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_work_date', 'work_date'),
        db.Index('idx_employee_date', 'employee_id', 'work_date'),
        db.Index('idx_project_date', 'project_id', 'work_date'),
    )

class BatchHistory(db.Model):
    __tablename__ = 'batch_history'
    
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)
    status = db.Column(db.Enum(BatchStatus), nullable=False, default=BatchStatus.PENDING)
    total_records = db.Column(db.Integer, default=0)
    success_records = db.Column(db.Integer, default=0)
    error_records = db.Column(db.Integer, default=0)
    processing_time = db.Column(db.Float)
    error_message = db.Column(db.Text)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    started_by = db.Column(db.String(50), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    work_records = db.relationship('WorkRecord', backref='batch', lazy=True)
    
    @property
    def progress_percentage(self):
        if self.total_records == 0:
            return 0
        return round((self.success_records + self.error_records) / self.total_records * 100, 2)
    
    @property
    def success_rate(self):
        if self.total_records == 0:
            return 0
        return round(self.success_records / self.total_records * 100, 2)
