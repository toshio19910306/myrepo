# API設計書

## 概要
CSVからSQL Serverへのデータ変換バッチシステムのREST API設計を定義します。

## API基本仕様

### ベースURL
- **開発環境**: `http://localhost:5000/api/v1`
- **本番環境**: `https://csv-batch-app-{random}.azurewebsites.net/api/v1`

### 認証方式
- **認証**: Azure AD Bearer Token
- **認可**: ロールベースアクセス制御（RBAC）

### レスポンス形式
- **Content-Type**: `application/json`
- **文字エンコーディング**: UTF-8

### 共通レスポンス構造
```json
{
  "success": true,
  "data": {},
  "message": "処理が正常に完了しました",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "request_id": "req_abc123"
}
```

### エラーレスポンス構造
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが不正です",
    "details": [
      {
        "field": "work_date",
        "message": "日付形式が正しくありません"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:45.123Z",
  "request_id": "req_abc123"
}
```

## エンドポイント一覧

### 1. 認証・認可

#### 1.1 ログイン
```
POST /auth/login
```

**リクエスト**
```json
{
  "azure_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "EMP001",
      "name": "山田太郎",
      "email": "yamada@example.com",
      "roles": ["admin", "operator"]
    },
    "session_id": "sess_abc123",
    "expires_at": "2024-01-15T18:30:45.123Z"
  }
}
```

#### 1.2 ログアウト
```
POST /auth/logout
```

### 2. バッチ処理

#### 2.1 バッチ処理実行
```
POST /batch/execute
```

**リクエスト**
```json
{
  "file_name": "work_records_20240115.csv",
  "options": {
    "validate_only": false,
    "skip_duplicates": true,
    "notification_email": "admin@example.com"
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "batch_id": 12345,
    "status": "RUNNING",
    "file_name": "work_records_20240115.csv",
    "started_at": "2024-01-15T10:30:45.123Z",
    "estimated_completion": "2024-01-15T10:40:45.123Z"
  }
}
```

#### 2.2 バッチ処理状況取得
```
GET /batch/{batch_id}/status
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "batch_id": 12345,
    "status": "RUNNING",
    "progress": {
      "total_records": 10000,
      "processed_records": 5000,
      "success_records": 4950,
      "error_records": 50,
      "progress_percentage": 50.0
    },
    "started_at": "2024-01-15T10:30:45.123Z",
    "estimated_completion": "2024-01-15T10:35:45.123Z",
    "current_phase": "データ挿入中"
  }
}
```

#### 2.3 バッチ処理停止
```
POST /batch/{batch_id}/stop
```

### 3. 処理履歴

#### 3.1 処理履歴一覧取得
```
GET /history?page=1&limit=20&status=SUCCESS&date_from=2024-01-01&date_to=2024-01-31
```

**クエリパラメータ**
| パラメータ | 型 | 必須 | 説明 |
|------------|----|----- |------|
| page | integer | △ | ページ番号（デフォルト: 1） |
| limit | integer | △ | 1ページあたりの件数（デフォルト: 20、最大: 100） |
| status | string | △ | 処理状況フィルタ（SUCCESS, ERROR, RUNNING） |
| date_from | string | △ | 開始日（YYYY-MM-DD） |
| date_to | string | △ | 終了日（YYYY-MM-DD） |

**レスポンス**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "batch_id": 12345,
        "file_name": "work_records_20240115.csv",
        "status": "SUCCESS",
        "started_at": "2024-01-15T10:30:45.123Z",
        "completed_at": "2024-01-15T10:35:45.123Z",
        "total_records": 10000,
        "success_records": 9950,
        "error_records": 50,
        "processing_time": 300
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total_items": 150,
      "total_pages": 8,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 4. ダッシュボード

#### 4.1 ダッシュボード統計取得
```
GET /dashboard/stats?period=7d
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_batches": 50,
      "successful_batches": 45,
      "failed_batches": 5,
      "total_records_processed": 500000,
      "success_rate": 90.0,
      "average_processing_time": 285
    },
    "daily_stats": [
      {
        "date": "2024-01-15",
        "batch_count": 8,
        "success_count": 7,
        "error_count": 1,
        "total_records": 80000,
        "average_time": 290
      }
    ]
  }
}
```

### 5. ファイル管理

#### 5.1 CSVファイル一覧取得
```
GET /files?status=pending&limit=50
```

#### 5.2 CSVファイルアップロード
```
POST /files/upload
Content-Type: multipart/form-data
```

### 6. 設定管理

#### 6.1 システム設定取得
```
GET /settings
```

#### 6.2 システム設定更新
```
PUT /settings
```

### 7. ログ・監視

#### 7.1 エラーログ取得
```
GET /logs/errors?level=ERROR&limit=100
```

#### 7.2 システムヘルスチェック
```
GET /health
```

## HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 正常処理完了 |
| 201 | Created | リソース作成成功 |
| 400 | Bad Request | リクエスト形式エラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 認可エラー |
| 404 | Not Found | リソース未存在 |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバー内部エラー |

## Flask実装例

```python
from flask import Flask, request, jsonify
from functools import wraps
import structlog

app = Flask(__name__)
logger = structlog.get_logger()

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token or not validate_token(token):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'AUTHENTICATION_FAILED',
                    'message': '認証が必要です'
                }
            }), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/api/v1/batch/execute', methods=['POST'])
@require_auth
def execute_batch():
    try:
        data = request.get_json()
        
        if not data.get('file_name'):
            return jsonify({
                'success': False,
                'error': {
                    'code': 'VALIDATION_ERROR',
                    'message': 'ファイル名が必要です'
                }
            }), 422
        
        batch_id = batch_service.execute(data['file_name'])
        
        logger.info("バッチ処理開始", batch_id=batch_id)
        
        return jsonify({
            'success': True,
            'data': {
                'batch_id': batch_id,
                'status': 'RUNNING'
            }
        }), 201
        
    except Exception as e:
        logger.error("バッチ処理実行エラー", error=str(e))
        return jsonify({
            'success': False,
            'error': {
                'code': 'INTERNAL_ERROR',
                'message': 'サーバー内部エラーが発生しました'
            }
        }), 500
```
