# ログ設計書

## 概要
システムの運用監視、障害調査、パフォーマンス分析のためのログ設計を定義します。

## ログレベル定義

### ログレベル一覧
| レベル | 用途 | 出力条件 | 保存期間 |
|--------|------|----------|----------|
| CRITICAL | システム停止レベルの重大エラー | 常時 | 1年 |
| ERROR | 処理失敗、例外発生 | 常時 | 90日 |
| WARNING | 警告、注意が必要な状況 | 常時 | 30日 |
| INFO | 一般的な情報、処理開始/終了 | 常時 | 30日 |
| DEBUG | デバッグ情報、詳細な処理内容 | 開発環境のみ | 7日 |

### ログレベル使用例

#### CRITICAL
- データベース接続完全失敗
- Azure サービス接続不可
- システム全体の停止

#### ERROR
- CSVファイル処理失敗
- データベース挿入エラー
- 認証失敗
- 予期しない例外発生

#### WARNING
- CSVファイル形式不正（一部レコード）
- データベース接続遅延
- ディスク容量不足警告
- 設定値不正

#### INFO
- バッチ処理開始/終了
- ユーザーログイン/ログアウト
- ファイルアップロード完了
- 設定変更

#### DEBUG
- SQL実行内容
- API呼び出し詳細
- データ変換処理詳細
- パフォーマンス計測

## ログフォーマット定義

### 構造化ログ形式（JSON）
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "batch_service",
  "message": "CSV処理開始",
  "context": {
    "batch_id": 12345,
    "file_name": "work_records_20240115.csv",
    "user_id": "EMP001",
    "session_id": "sess_abc123"
  },
  "extra": {
    "file_size": 1048576,
    "record_count": 10000
  },
  "trace_id": "trace_xyz789",
  "span_id": "span_def456"
}
```

### フィールド定義
| フィールド | 型 | 必須 | 説明 |
|------------|----|----- |------|
| timestamp | string | ○ | ISO 8601形式のタイムスタンプ（UTC） |
| level | string | ○ | ログレベル |
| logger | string | ○ | ログ出力元モジュール名 |
| message | string | ○ | ログメッセージ |
| context | object | △ | 処理コンテキスト情報 |
| extra | object | △ | 追加情報 |
| trace_id | string | △ | 分散トレーシングID |
| span_id | string | △ | スパンID |

## ログ出力設定

### Python structlog設定
```python
import structlog
from structlog.stdlib import LoggerFactory

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)
```

### ログ出力先設定
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '%(message)s'
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/app/application.log',
            'maxBytes': 10485760,
            'backupCount': 5,
            'formatter': 'json',
        },
        'azure': {
            'class': 'azure.monitor.opentelemetry.exporter.AzureMonitorLogExporter',
            'formatter': 'json',
        }
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file', 'azure'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

## ログカテゴリ別設計

### 1. アプリケーションログ
- **ファイル**: `/var/log/app/application.log`
- **内容**: 業務処理、エラー、警告
- **ローテーション**: 10MB毎、5世代保持

### 2. アクセスログ
- **ファイル**: `/var/log/app/access.log`
- **内容**: HTTP リクエスト/レスポンス
- **フォーマット**: Combined Log Format + JSON拡張

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "method": "POST",
  "url": "/api/batch/execute",
  "status": 200,
  "response_time": 1.234,
  "user_agent": "Mozilla/5.0...",
  "remote_addr": "192.168.1.100",
  "user_id": "EMP001",
  "request_id": "req_abc123"
}
```

### 3. セキュリティログ
- **ファイル**: `/var/log/app/security.log`
- **内容**: 認証、認可、不正アクセス
- **保存期間**: 1年間

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "WARNING",
  "event_type": "authentication_failed",
  "user_id": "unknown",
  "remote_addr": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "details": {
    "reason": "invalid_credentials",
    "attempt_count": 3
  }
}
```

### 4. バッチ処理ログ
- **ファイル**: `/var/log/app/batch.log`
- **内容**: バッチ処理の詳細ログ
- **保存期間**: 90日間

```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "logger": "batch_processor",
  "message": "レコード処理完了",
  "context": {
    "batch_id": 12345,
    "record_number": 1000,
    "employee_id": "EMP001",
    "project_id": "PRJ001"
  },
  "extra": {
    "processing_time": 0.05,
    "validation_result": "success"
  }
}
```

## 監視・アラート設定

### ログベースアラート
| 条件 | アラートレベル | 通知先 | 説明 |
|------|---------------|--------|------|
| ERROR レベル 5件/分 | 警告 | メール | エラー頻発 |
| CRITICAL レベル 1件 | 緊急 | メール+SMS | 重大エラー |
| 認証失敗 10回/分 | 警告 | メール | 不正アクセス疑い |
| バッチ処理失敗 | 警告 | メール | バッチ処理異常 |

### Azure Monitor連携
```python
from azure.monitor.opentelemetry.exporter import AzureMonitorLogExporter
from opentelemetry.sdk._logs import LoggerProvider
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor

exporter = AzureMonitorLogExporter(
    connection_string="InstrumentationKey=your-key"
)

logger_provider = LoggerProvider()
logger_provider.add_log_record_processor(
    BatchLogRecordProcessor(exporter)
)
```

## ログ分析・可視化

### Kusto クエリ例
```kusto
traces
| where timestamp > ago(1h)
| summarize 
    total = count(),
    errors = countif(severityLevel >= 3)
| extend error_rate = errors * 100.0 / total

traces
| where customDimensions.logger == "batch_processor"
| where message contains "処理完了"
| summarize 
    avg_time = avg(todouble(customDimensions.processing_time)),
    max_time = max(todouble(customDimensions.processing_time))
| by bin(timestamp, 1h)
```

### ダッシュボード設計
1. **システム概要**
   - エラー率推移
   - レスポンス時間
   - アクティブユーザー数

2. **バッチ処理監視**
   - 処理件数推移
   - 処理時間推移
   - エラー件数推移

3. **セキュリティ監視**
   - 認証失敗回数
   - 不正アクセス検知
   - ユーザーアクティビティ

## ログ保持・アーカイブ

### 保持ポリシー
| ログ種別 | 保持期間 | アーカイブ先 | 削除タイミング |
|----------|----------|-------------|---------------|
| アプリケーション | 90日 | Azure Blob Storage | 自動削除 |
| アクセス | 30日 | Azure Blob Storage | 自動削除 |
| セキュリティ | 1年 | Azure Blob Storage | 手動削除 |
| バッチ処理 | 90日 | Azure Blob Storage | 自動削除 |

### アーカイブスクリプト
```python
import os
import gzip
from datetime import datetime, timedelta
from azure.storage.blob import BlobServiceClient

def archive_logs():
    cutoff_date = datetime.now() - timedelta(days=7)
    
    for log_file in os.listdir('/var/log/app/'):
        if log_file.endswith('.log'):
            file_path = f'/var/log/app/{log_file}'
            file_stat = os.stat(file_path)
            
            if datetime.fromtimestamp(file_stat.st_mtime) < cutoff_date:
                with open(file_path, 'rb') as f_in:
                    with gzip.open(f'{file_path}.gz', 'wb') as f_out:
                        f_out.writelines(f_in)
                
                blob_client = BlobServiceClient.from_connection_string(
                    connection_string
                ).get_blob_client(
                    container='logs',
                    blob=f'archive/{log_file}.gz'
                )
                
                with open(f'{file_path}.gz', 'rb') as data:
                    blob_client.upload_blob(data, overwrite=True)
                
                os.remove(file_path)
                os.remove(f'{file_path}.gz')
```

## パフォーマンス考慮事項

### ログ出力最適化
- **非同期ログ出力**: バックグラウンドでの書き込み
- **バッファリング**: メモリバッファによる高速化
- **圧縮**: ログファイルの自動圧縮
- **ローテーション**: サイズベースの自動ローテーション

### 本番環境設定
```python
LOGGING_CONFIG = {
    'level': 'INFO',
    'async': True,
    'buffer_size': 1000,
    'flush_interval': 5,
    'compression': True,
    'rotation': {
        'max_size': '10MB',
        'backup_count': 5
    }
}
```
