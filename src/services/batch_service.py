import pandas as pd
from models import BatchHistory, WorkRecord, Employee, Project, db, BatchStatus
from marshmallow import Schema, fields, ValidationError
import structlog
import time
import os
from datetime import datetime
from threading import Thread

logger = structlog.get_logger()

class WorkRecordSchema(Schema):
    work_date = fields.Date(required=True)
    employee_id = fields.Str(required=True, validate=lambda x: len(x) <= 10)
    employee_name = fields.Str(required=True, validate=lambda x: len(x) <= 50)
    project_id = fields.Str(required=True, validate=lambda x: len(x) <= 20)
    project_name = fields.Str(required=True, validate=lambda x: len(x) <= 100)
    work_content = fields.Str(required=True, validate=lambda x: len(x) <= 200)
    work_hours = fields.Decimal(required=True, validate=lambda x: 0 <= x <= 999.99)
    hourly_rate = fields.Decimal(required=True, validate=lambda x: x >= 0)
    total_cost = fields.Decimal(required=True, validate=lambda x: x >= 0)
    order_amount = fields.Decimal(allow_none=True, validate=lambda x: x is None or x >= 0)
    remarks = fields.Str(allow_none=True, validate=lambda x: x is None or len(x) <= 500)

class BatchService:
    def __init__(self):
        self.validator = WorkRecordSchema()
        self.max_file_size = 100 * 1024 * 1024
        self.batch_size = 1000
    
    def start_batch(self, file_name, user_id):
        batch = BatchHistory(
            file_name=file_name,
            status=BatchStatus.PENDING,
            started_by=user_id,
            started_at=datetime.utcnow()
        )
        db.session.add(batch)
        db.session.commit()
        
        thread = Thread(target=self._execute_batch_async, args=(batch.id, file_name))
        thread.daemon = True
        thread.start()
        
        return batch.id
    
    def _execute_batch_async(self, batch_id, file_name):
        try:
            self.execute_batch(batch_id, file_name)
        except Exception as e:
            logger.error("非同期バッチ処理エラー", batch_id=batch_id, error=str(e))
            self._fail_batch(batch_id, str(e))
    
    def execute_batch(self, batch_id, file_name):
        batch = BatchHistory.query.get(batch_id)
        if not batch:
            raise ValueError(f"バッチID {batch_id} が見つかりません")
        
        try:
            batch.status = BatchStatus.RUNNING
            db.session.commit()
            
            logger.info("バッチ処理開始", batch_id=batch_id, file_name=file_name)
            
            file_path = self._get_file_path(file_name)
            self._validate_file(file_path)
            
            df = self._read_csv_file(file_path)
            batch.total_records = len(df)
            db.session.commit()
            
            result = self._process_data(batch_id, df)
            
            batch.success_records = result['success_records']
            batch.error_records = result['error_records']
            batch.processing_time = result['processing_time']
            batch.status = BatchStatus.SUCCESS if result['error_records'] == 0 else BatchStatus.SUCCESS
            batch.completed_at = datetime.utcnow()
            
            db.session.commit()
            
            logger.info("バッチ処理完了", batch_id=batch_id, result=result)
            
        except Exception as e:
            logger.error("バッチ処理エラー", batch_id=batch_id, error=str(e))
            self._fail_batch(batch_id, str(e))
            raise
    
    def _get_file_path(self, file_name):
        upload_folder = os.path.join(os.getcwd(), 'uploads')
        return os.path.join(upload_folder, file_name)
    
    def _validate_file(self, file_path):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"ファイルが見つかりません: {file_path}")
        
        file_size = os.path.getsize(file_path)
        if file_size > self.max_file_size:
            raise ValueError(f"ファイルサイズが上限を超過: {file_size} bytes")
        
        try:
            pd.read_csv(file_path, nrows=1, encoding='utf-8')
        except Exception as e:
            raise ValueError(f"CSV形式エラー: {str(e)}")
    
    def _read_csv_file(self, file_path):
        column_mapping = {
            '作業日': 'work_date',
            '社員ID': 'employee_id', 
            '社員名': 'employee_name',
            'プロジェクトID': 'project_id',
            'プロジェクト名': 'project_name',
            '作業内容': 'work_content',
            '工数': 'work_hours',
            '単価': 'hourly_rate',
            '費用': 'total_cost',
            '発注金額': 'order_amount',
            '備考': 'remarks'
        }
        
        df = pd.read_csv(file_path, encoding='utf-8')
        df = df.rename(columns=column_mapping)
        
        df['work_date'] = pd.to_datetime(df['work_date'])
        df['work_hours'] = pd.to_numeric(df['work_hours'], errors='coerce')
        df['hourly_rate'] = pd.to_numeric(df['hourly_rate'], errors='coerce')
        df['total_cost'] = pd.to_numeric(df['total_cost'], errors='coerce')
        df['order_amount'] = pd.to_numeric(df['order_amount'], errors='coerce')
        
        return df
    
    def _process_data(self, batch_id, df):
        success_records = 0
        error_records = 0
        start_time = time.time()
        
        for index, row in df.iterrows():
            try:
                validated_data = self.validator.load(row.to_dict())
                
                self._ensure_employee_exists(validated_data)
                self._ensure_project_exists(validated_data)
                
                work_record = WorkRecord(
                    work_date=validated_data['work_date'],
                    employee_id=validated_data['employee_id'],
                    project_id=validated_data['project_id'],
                    work_content=validated_data['work_content'],
                    work_hours=validated_data['work_hours'],
                    hourly_rate=validated_data['hourly_rate'],
                    total_cost=validated_data['total_cost'],
                    order_amount=validated_data.get('order_amount'),
                    remarks=validated_data.get('remarks'),
                    batch_id=batch_id
                )
                
                db.session.add(work_record)
                success_records += 1
                
                if (index + 1) % self.batch_size == 0:
                    db.session.commit()
                    logger.info("処理進捗", batch_id=batch_id, processed=index + 1, total=len(df))
                
            except ValidationError as e:
                error_records += 1
                logger.warning("バリデーションエラー", 
                             batch_id=batch_id, 
                             row=index + 1, 
                             error=str(e))
                
            except Exception as e:
                error_records += 1
                logger.error("処理エラー", 
                           batch_id=batch_id, 
                           row=index + 1, 
                           error=str(e))
        
        db.session.commit()
        processing_time = time.time() - start_time
        
        return {
            'success_records': success_records,
            'error_records': error_records,
            'processing_time': processing_time
        }
    
    def _ensure_employee_exists(self, data):
        employee = Employee.query.filter_by(employee_id=data['employee_id']).first()
        if not employee:
            employee = Employee(
                employee_id=data['employee_id'],
                employee_name=data['employee_name'],
                is_active=True
            )
            db.session.add(employee)
    
    def _ensure_project_exists(self, data):
        project = Project.query.filter_by(project_id=data['project_id']).first()
        if not project:
            project = Project(
                project_id=data['project_id'],
                project_name=data['project_name'],
                is_active=True
            )
            db.session.add(project)
    
    def _fail_batch(self, batch_id, error_message):
        batch = BatchHistory.query.get(batch_id)
        if batch:
            batch.status = BatchStatus.ERROR
            batch.error_message = error_message
            batch.completed_at = datetime.utcnow()
            db.session.commit()
    
    def stop_batch(self, batch_id):
        batch = BatchHistory.query.get(batch_id)
        if batch and batch.status == BatchStatus.RUNNING:
            batch.status = BatchStatus.STOPPED
            batch.completed_at = datetime.utcnow()
            db.session.commit()
            logger.info("バッチ処理停止", batch_id=batch_id)
    
    def execute_daily_batch(self):
        upload_folder = os.path.join(os.getcwd(), 'uploads')
        if not os.path.exists(upload_folder):
            logger.info("アップロードフォルダが存在しません", folder=upload_folder)
            return
        
        csv_files = [f for f in os.listdir(upload_folder) if f.endswith('.csv')]
        
        for file_name in csv_files:
            try:
                batch_id = self.start_batch(file_name, 'system')
                logger.info("日次バッチ処理開始", batch_id=batch_id, file_name=file_name)
            except Exception as e:
                logger.error("日次バッチ処理エラー", file_name=file_name, error=str(e))
