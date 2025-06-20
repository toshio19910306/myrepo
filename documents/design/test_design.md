# テスト設計書

## 概要
CSVからSQL Serverへのデータ変換バッチシステムのテスト戦略と実装方針を定義します。

## テスト戦略

### テスト種別と実施順序
1. **単体テスト** (pytest)
2. **結合テスト** (pytest + テストDB)
3. **E2Eテスト** (Playwright)
4. **負荷テスト** (Locust)

### カバレッジ目標
- **単体テスト**: 70%以上
- **結合テスト**: 70%以上
- **E2Eテスト**: 主要業務フローの100%

## 単体テスト設計

### テスト対象コンポーネント
| コンポーネント | テスト観点 | テストケース数 |
|---------------|------------|---------------|
| CSVファイル読み込み | ファイル形式、エンコーディング | 15 |
| データバリデーション | 必須項目、データ型、範囲 | 25 |
| データベース操作 | CRUD操作、トランザクション | 20 |
| バッチ処理 | 正常処理、エラーハンドリング | 30 |
| 認証・認可 | ログイン、権限チェック | 15 |
| API エンドポイント | リクエスト/レスポンス | 35 |

### pytest設定
```python
# conftest.py
import pytest
import tempfile
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import create_app
from models import Base

@pytest.fixture(scope="session")
def test_app():
    """テスト用Flaskアプリケーション"""
    app = create_app(testing=True)
    with app.app_context():
        yield app

@pytest.fixture(scope="session")
def test_db():
    """テスト用データベース"""
    engine = create_engine('sqlite:///:memory:')
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

@pytest.fixture
def sample_csv_file():
    """テスト用CSVファイル"""
    csv_content = """作業日,社員ID,社員名,プロジェクトID,プロジェクト名,作業内容,工数,単価,費用,発注金額,備考
2024-01-15,EMP001,山田太郎,PRJ001,システム開発,要件定義,8.00,5000,40000,,
2024-01-15,EMP002,佐藤花子,PRJ002,保守運用,障害対応,4.50,4000,18000,10000,緊急対応"""
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
        f.write(csv_content)
        f.flush()
        yield f.name
    
    os.unlink(f.name)
```

### 単体テストケース例
```python
# test_csv_processor.py
import pytest
from services.csv_processor import CSVProcessor
from marshmallow import ValidationError

class TestCSVProcessor:
    def test_valid_csv_processing(self, sample_csv_file, test_db):
        """正常なCSVファイルの処理"""
        processor = CSVProcessor(test_db)
        result = processor.process_file(sample_csv_file)
        
        assert result.success_records == 2
        assert result.error_records == 0
        assert len(result.error_messages) == 0
    
    def test_invalid_date_format(self, test_db):
        """不正な日付形式のテスト"""
        invalid_data = {
            'work_date': '2024/01/15',
            'employee_id': 'EMP001',
            'employee_name': '山田太郎',
            'project_id': 'PRJ001',
            'project_name': 'テストプロジェクト',
            'work_content': 'テスト作業',
            'work_hours': 8.0,
            'hourly_rate': 5000,
            'total_cost': 40000
        }
        
        processor = CSVProcessor(test_db)
        with pytest.raises(ValidationError):
            processor.validate_record(invalid_data)
    
    def test_missing_required_field(self, test_db):
        """必須項目不足のテスト"""
        invalid_data = {
            'work_date': '2024-01-15',
            'employee_id': '',
            'employee_name': '山田太郎',
            'project_id': 'PRJ001',
            'work_hours': 8.0,
            'hourly_rate': 5000,
            'total_cost': 40000
        }
        
        processor = CSVProcessor(test_db)
        with pytest.raises(ValidationError) as exc_info:
            processor.validate_record(invalid_data)
        
        assert 'employee_id' in str(exc_info.value)
    
    def test_file_size_limit(self, test_db):
        """ファイルサイズ制限のテスト"""
        processor = CSVProcessor(test_db)
        
        with pytest.raises(ValueError) as exc_info:
            processor._validate_file_size('/path/to/large/file.csv', 101 * 1024 * 1024)
        
        assert 'ファイルサイズが上限を超過' in str(exc_info.value)
```

## 結合テスト設計

### テスト成績書テンプレート

| No. | テストケース | テスト観点 | テスト手順 | テスト期待値 | 実施結果 | 実施日 |
|-----|-------------|------------|------------|-------------|----------|--------|
| IT001 | CSVファイルアップロード〜データベース挿入 | ファイル処理の統合 | 1. CSVファイルをアップロード<br>2. バッチ処理実行<br>3. データベース確認 | 全レコードが正常に挿入される | | |
| IT002 | 認証〜バッチ実行権限チェック | 認証認可の統合 | 1. Azure ADでログイン<br>2. バッチ実行権限確認<br>3. バッチ処理実行 | 権限に応じて実行可否が制御される | | |
| IT003 | エラーファイル処理〜通知 | エラーハンドリングの統合 | 1. 不正なCSVファイルをアップロード<br>2. バッチ処理実行<br>3. エラー通知確認 | エラー通知メールが送信される | | |

### 結合テストケース実装
```python
# test_integration.py
import pytest
from flask import url_for
from services.batch_service import BatchService
from services.notification_service import NotificationService

class TestBatchIntegration:
    def test_csv_upload_to_database_integration(self, test_app, test_db, sample_csv_file):
        """CSVアップロードからデータベース挿入までの統合テスト"""
        with test_app.test_client() as client:
            with open(sample_csv_file, 'rb') as f:
                response = client.post('/api/v1/files/upload', 
                                     data={'file': f},
                                     content_type='multipart/form-data')
            
            assert response.status_code == 201
            
            batch_response = client.post('/api/v1/batch/execute',
                                       json={'file_name': 'test.csv'})
            
            assert batch_response.status_code == 201
            batch_id = batch_response.json['data']['batch_id']
            
            import time
            time.sleep(5)
            
            status_response = client.get(f'/api/v1/batch/{batch_id}/status')
            assert status_response.json['data']['status'] == 'SUCCESS'
            
            from models import WorkRecord
            records = test_db.query(WorkRecord).all()
            assert len(records) == 2
    
    def test_authentication_authorization_integration(self, test_app):
        """認証認可の統合テスト"""
        with test_app.test_client() as client:
            response = client.post('/api/v1/batch/execute')
            assert response.status_code == 401
            
            login_response = client.post('/api/v1/auth/login',
                                       json={'azure_token': 'mock_token'})
            assert login_response.status_code == 200
            
            headers = {'Authorization': 'Bearer mock_token'}
            batch_response = client.post('/api/v1/batch/execute',
                                       json={'file_name': 'test.csv'},
                                       headers=headers)
            assert batch_response.status_code == 201
```

## E2Eテスト設計

### テスト成績書テンプレート

| No. | テストケース | テスト観点 | テスト手順 | テスト期待値 | 実施結果 | 実施日 |
|-----|-------------|------------|------------|-------------|----------|--------|
| E2E001 | ログイン〜バッチ実行〜結果確認 | 主要業務フローの完全性 | 1. ブラウザでログイン<br>2. CSVファイルアップロード<br>3. バッチ実行<br>4. 処理状況監視<br>5. 結果確認 | 全工程が正常に完了する | | |
| E2E002 | エラー発生時の画面表示 | エラー時のユーザビリティ | 1. 不正なCSVファイルをアップロード<br>2. エラー画面の表示確認<br>3. エラー詳細の確認 | 適切なエラーメッセージが表示される | | |

### Playwright E2Eテスト
```python
# test_e2e.py
import pytest
from playwright.sync_api import Page, expect

class TestE2EWorkflow:
    def test_complete_batch_workflow(self, page: Page):
        """完全なバッチ処理ワークフローのE2Eテスト"""
        page.goto("http://localhost:5000/login")
        page.click("button:has-text('Azure AD Login')")
        
        expect(page.locator("h1")).to_contain_text("ダッシュボード")
        
        page.click("nav >> text=バッチ処理")
        page.set_input_files("input[type=file]", "test_data/sample.csv")
        page.click("button:has-text('アップロード')")
        
        expect(page.locator(".success-message")).to_be_visible()
        
        page.click("button:has-text('バッチ実行')")
        
        expect(page.locator(".progress-bar")).to_be_visible()
        
        page.wait_for_selector(".status:has-text('SUCCESS')", timeout=30000)
        
        page.click("nav >> text=処理履歴")
        expect(page.locator("table tbody tr").first).to_contain_text("SUCCESS")
    
    def test_error_handling_display(self, page: Page):
        """エラーハンドリング表示のE2Eテスト"""
        page.goto("http://localhost:5000/batch")
        
        page.set_input_files("input[type=file]", "test_data/invalid.txt")
        page.click("button:has-text('アップロード')")
        
        expect(page.locator(".error-message")).to_contain_text("不正なファイル形式")
        expect(page.locator(".error-details")).to_be_visible()
```

## 負荷テスト設計

### テスト成績書テンプレート

| No. | テストケース | テスト観点 | テスト手順 | テスト期待値 | 実施結果 | 実施日 |
|-----|-------------|------------|------------|-------------|----------|--------|
| LT001 | 同時ユーザー50人でのアクセス | 同時接続性能 | 1. 50ユーザーで同時ログイン<br>2. ダッシュボード表示<br>3. レスポンス時間測定 | 平均レスポンス時間5秒以内 | | |
| LT002 | 1万件データの処理性能 | バッチ処理性能 | 1. 1万件CSVファイル準備<br>2. バッチ処理実行<br>3. 処理時間測定 | 10分以内で処理完了 | | |

### Locust負荷テスト
```python
# locustfile.py
from locust import HttpUser, task, between
import json

class BatchSystemUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """テスト開始時の初期化"""
        response = self.client.post("/api/v1/auth/login", 
                                  json={"azure_token": "test_token"})
        if response.status_code == 200:
            self.token = response.json()["data"]["session_id"]
        else:
            self.token = None
    
    @task(3)
    def view_dashboard(self):
        """ダッシュボード表示"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/api/v1/dashboard/stats", headers=headers)
    
    @task(2)
    def view_history(self):
        """処理履歴表示"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.get("/api/v1/history", headers=headers)
    
    @task(1)
    def execute_batch(self):
        """バッチ処理実行"""
        headers = {"Authorization": f"Bearer {self.token}"}
        self.client.post("/api/v1/batch/execute",
                        json={"file_name": "test_load.csv"},
                        headers=headers)
    
    @task(1)
    def health_check(self):
        """ヘルスチェック"""
        self.client.get("/api/v1/health")

class BatchProcessingUser(HttpUser):
    wait_time = between(5, 10)
    
    @task
    def large_file_processing(self):
        """大容量ファイル処理の負荷テスト"""
        headers = {"Authorization": "Bearer test_token"}
        
        response = self.client.post("/api/v1/batch/execute",
                                  json={
                                      "file_name": "large_test_10000.csv",
                                      "options": {"skip_duplicates": True}
                                  },
                                  headers=headers)
        
        if response.status_code == 201:
            batch_id = response.json()["data"]["batch_id"]
            
            import time
            for _ in range(60):
                status_response = self.client.get(f"/api/v1/batch/{batch_id}/status",
                                                headers=headers)
                if status_response.status_code == 200:
                    status = status_response.json()["data"]["status"]
                    if status in ["SUCCESS", "ERROR"]:
                        break
                time.sleep(10)
```

## テスト実行環境

### CI/CD統合
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run unit tests
        run: |
          pytest tests/unit/ --cov=src --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v1

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      - name: Run integration tests
        run: pytest tests/integration/

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Playwright
        run: |
          pip install playwright
          playwright install
      
      - name: Run E2E tests
        run: pytest tests/e2e/

  load-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v2
      - name: Install Locust
        run: pip install locust
      
      - name: Run load tests
        run: |
          locust --headless --users 50 --spawn-rate 5 \
                 --run-time 300s --host http://localhost:5000
```

## テストデータ管理

### テストデータ生成
```python
# test_data_generator.py
import pandas as pd
from datetime import datetime, timedelta
import random

class TestDataGenerator:
    def __init__(self):
        self.employees = [
            ('EMP001', '山田太郎'),
            ('EMP002', '佐藤花子'),
            ('EMP003', '田中次郎'),
            ('EMP004', '鈴木三郎'),
            ('EMP005', '高橋四郎')
        ]
        
        self.projects = [
            ('PRJ001', 'システム開発'),
            ('PRJ002', '保守運用'),
            ('PRJ003', 'インフラ構築'),
            ('PRJ004', 'テスト実施')
        ]
        
        self.work_contents = [
            '要件定義', '基本設計', '詳細設計', '実装',
            'テスト', '障害対応', '保守作業', 'ドキュメント作成'
        ]
    
    def generate_csv_data(self, record_count: int = 10000) -> pd.DataFrame:
        """テスト用CSVデータの生成"""
        data = []
        base_date = datetime(2024, 1, 1)
        
        for i in range(record_count):
            work_date = base_date + timedelta(days=random.randint(0, 365))
            employee = random.choice(self.employees)
            project = random.choice(self.projects)
            work_content = random.choice(self.work_contents)
            work_hours = round(random.uniform(1.0, 8.0), 2)
            hourly_rate = random.choice([3000, 4000, 5000, 6000])
            total_cost = work_hours * hourly_rate
            order_amount = total_cost if random.random() > 0.3 else None
            
            data.append({
                'work_date': work_date.strftime('%Y-%m-%d'),
                'employee_id': employee[0],
                'employee_name': employee[1],
                'project_id': project[0],
                'project_name': project[1],
                'work_content': work_content,
                'work_hours': work_hours,
                'hourly_rate': hourly_rate,
                'total_cost': total_cost,
                'order_amount': order_amount,
                'remarks': f'テストデータ{i+1}' if random.random() > 0.7 else None
            })
        
        return pd.DataFrame(data)
    
    def generate_invalid_csv_data(self) -> pd.DataFrame:
        """バリデーションエラー用のテストデータ"""
        data = [
            {
                'work_date': '2024/01/15',
                'employee_id': 'EMP001',
                'employee_name': '山田太郎',
                'project_id': 'PRJ001',
                'project_name': 'テストプロジェクト',
                'work_content': 'テスト作業',
                'work_hours': 8.0,
                'hourly_rate': 5000,
                'total_cost': 40000,
                'order_amount': None,
                'remarks': None
            },
            {
                'work_date': '2024-01-16',
                'employee_id': '',
                'employee_name': '佐藤花子',
                'project_id': 'PRJ002',
                'project_name': 'テストプロジェクト2',
                'work_content': 'テスト作業2',
                'work_hours': 4.0,
                'hourly_rate': 4000,
                'total_cost': 16000,
                'order_amount': None,
                'remarks': None
            },
            {
                'work_date': '2024-01-17',
                'employee_id': 'EMP003',
                'employee_name': '田中次郎',
                'project_id': 'PRJ003',
                'project_name': 'テストプロジェクト3',
                'work_content': 'テスト作業3',
                'work_hours': -2.0,
                'hourly_rate': 3000,
                'total_cost': -6000,
                'order_amount': None,
                'remarks': None
            }
        ]
        
        return pd.DataFrame(data)

if __name__ == '__main__':
    generator = TestDataGenerator()
    
    normal_data = generator.generate_csv_data(10000)
    normal_data.to_csv('test_data/normal_10000.csv', index=False, encoding='utf-8')
    
    invalid_data = generator.generate_invalid_csv_data()
    invalid_data.to_csv('test_data/invalid.csv', index=False, encoding='utf-8')
```

## テスト環境設定

### Docker Compose設定
```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-db:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      SA_PASSWORD: TestPassword123!
      ACCEPT_EULA: Y
    ports:
      - "1433:1433"
    volumes:
      - test_db_data:/var/opt/mssql
  
  test-redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  test-app:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      FLASK_ENV: testing
      DATABASE_URL: mssql+pyodbc://sa:TestPassword123!@test-db:1433/testdb?driver=ODBC+Driver+17+for+SQL+Server
      REDIS_URL: redis://test-redis:6379/0
    depends_on:
      - test-db
      - test-redis
    ports:
      - "5000:5000"
    volumes:
      - ./test_data:/app/test_data

volumes:
  test_db_data:
```

### pytest設定ファイル
```ini
# pytest.ini
[tool:pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    --verbose
    --tb=short
    --strict-markers
    --disable-warnings
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=70

markers =
    unit: 単体テスト
    integration: 結合テスト
    e2e: E2Eテスト
    load: 負荷テスト
    slow: 実行時間の長いテスト
```
