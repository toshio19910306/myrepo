# 設計書

## 1. システム全体設計

### 1.1 開発言語・フレームワーク・バージョン

| 項目 | 技術 | バージョン |
|------|------|-----------|
| バックエンド言語 | Python | 3.12 |
| Webフレームワーク | Flask | 3.0.x |
| データベース | Azure SQL Database | 最新 |
| フロントエンド | HTML/CSS/JavaScript | - |
| テンプレートエンジン | Jinja2 | 3.1.x |
| ORMライブラリ | SQLAlchemy | 2.0.x |
| 認証ライブラリ | Flask-Login | 0.6.x |
| ファイルアップロード | Flask-Uploads | 0.2.x |
| メール送信 | Flask-Mail | 0.9.x |
| フォーム処理 | Flask-WTF | 1.2.x |
| 単体テスト | pytest | 7.4.x |
| 結合テスト | pytest + Flask-Testing | - |
| E2Eテスト | Selenium | 4.15.x |
| 負荷テスト | Locust | 2.17.x |

### 1.2 システム構成図

```
[ユーザー] 
    ↓ HTTPS
[Azure Application Gateway]
    ↓
[Azure Web Apps (Container)]
    ├── Flask Application
    ├── Static Files
    └── File Storage
    ↓
[Azure SQL Database]
    ├── アプリケーションデータ
    └── ファイルメタデータ
    ↓
[Azure Blob Storage]
    └── 添付ファイル
    ↓
[Azure SendGrid]
    └── メール送信
```

## 2. インフラ設計

### 2.1 利用サービス一覧

| サービス名 | 用途 | 備考 |
|-----------|------|------|
| Azure Web Apps | Webアプリケーションホスティング | コンテナランタイム |
| Azure SQL Database | データベース | Basic/Standard tier |
| Azure Blob Storage | ファイルストレージ | 添付ファイル保存 |
| Azure Application Gateway | ロードバランサー・SSL終端 | HTTPS強制 |
| Azure SendGrid | メール送信サービス | 承認通知用 |
| Azure Monitor | ログ・監視 | アプリケーション監視 |
| Azure Key Vault | シークレット管理 | DB接続文字列等 |

## 3. データベース設計

### 3.1 ER図

```
[users] ←1:N→ [specifications] ←1:N→ [estimate_requests] ←1:N→ [estimate_responses]
   ↓                ↓                        ↓                        ↓
[user_roles]  [spec_files]           [request_files]        [response_files]
                     ↓                        ↓                        ↓
              [approval_flows] ←1:N→ [approval_steps]
```

### 3.2 テーブル定義書

#### 3.2.1 users（ユーザーマスター）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| user_id | INT | NOT NULL | PK | ユーザーID |
| username | NVARCHAR(100) | NOT NULL | UQ | ユーザー名 |
| email | NVARCHAR(255) | NOT NULL | UQ | メールアドレス |
| full_name | NVARCHAR(100) | NOT NULL | - | 氏名 |
| user_type | NVARCHAR(20) | NOT NULL | - | ユーザー種別（IT/VENDOR） |
| company_name | NVARCHAR(200) | NULL | - | 会社名 |
| is_active | BIT | NOT NULL | - | 有効フラグ |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.2 specifications（仕様登録）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| spec_id | INT | NOT NULL | PK | 仕様ID |
| spec_number | NVARCHAR(50) | NOT NULL | UQ | 仕様番号 |
| title | NVARCHAR(200) | NOT NULL | - | 仕様タイトル |
| work_items | NTEXT | NOT NULL | - | 作業項目（JSON配列） |
| deliverables | NTEXT | NOT NULL | - | 成果物（JSON配列） |
| desired_delivery_date | DATE | NULL | - | 希望納期 |
| delivery_location | NVARCHAR(200) | NULL | - | 納入場所 |
| acceptance_conditions | NTEXT | NULL | - | 検収条件 |
| estimate_copies | INT | NULL | - | 見積書部数 |
| supplied_items | NTEXT | NULL | - | 支給品 |
| loaned_items | NTEXT | NULL | - | 貸与品 |
| applicable_standards | NTEXT | NULL | - | 適用標準 |
| special_notes | NTEXT | NULL | - | 特記事項 |
| status | NVARCHAR(20) | NOT NULL | - | 状況 |
| created_by | INT | NOT NULL | FK | 作成者ID |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.3 estimate_requests（見積依頼）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| request_id | INT | NOT NULL | PK | 依頼ID |
| spec_id | INT | NULL | FK | 仕様ID |
| request_number | NVARCHAR(50) | NOT NULL | UQ | 依頼番号 |
| revision | INT | NOT NULL | - | 改番 |
| subject | NVARCHAR(200) | NOT NULL | - | 件名 |
| request_date | DATE | NOT NULL | - | 見積依頼日 |
| deadline | DATE | NOT NULL | - | 回答期限 |
| order_content | NTEXT | NOT NULL | - | 発注内容 |
| remarks | NTEXT | NULL | - | 備考 |
| assignee_id | INT | NOT NULL | FK | 担当者ID |
| vendor_id | INT | NOT NULL | FK | 依頼先ベンダーID |
| status | NVARCHAR(20) | NOT NULL | - | 状況 |
| created_by | INT | NOT NULL | FK | 作成者ID |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.4 estimate_responses（見積回答）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| response_id | INT | NOT NULL | PK | 回答ID |
| request_id | INT | NOT NULL | FK | 依頼ID |
| estimate_number | NVARCHAR(50) | NULL | - | 見積番号 |
| estimate_price | DECIMAL(15,2) | NULL | - | 見積価格 |
| response_remarks | NTEXT | NULL | - | 備考 |
| response_date | DATE | NULL | - | 回答実績日 |
| status | NVARCHAR(20) | NOT NULL | - | 状況 |
| created_by | INT | NOT NULL | FK | 作成者ID |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.5 approval_flows（承認フロー）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| flow_id | INT | NOT NULL | PK | フローID |
| target_type | NVARCHAR(20) | NOT NULL | - | 対象種別（REQUEST/RESPONSE） |
| target_id | INT | NOT NULL | - | 対象ID |
| current_step | INT | NOT NULL | - | 現在ステップ |
| total_steps | INT | NOT NULL | - | 総ステップ数 |
| status | NVARCHAR(20) | NOT NULL | - | 承認状況 |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.6 approval_steps（承認ステップ）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| step_id | INT | NOT NULL | PK | ステップID |
| flow_id | INT | NOT NULL | FK | フローID |
| step_number | INT | NOT NULL | - | ステップ番号 |
| approver_id | INT | NOT NULL | FK | 承認者ID |
| step_name | NVARCHAR(100) | NOT NULL | - | ステップ名 |
| status | NVARCHAR(20) | NOT NULL | - | ステップ状況 |
| approved_at | DATETIME2 | NULL | - | 承認日時 |
| comments | NTEXT | NULL | - | 承認コメント |
| created_at | DATETIME2 | NOT NULL | - | 作成日時 |
| updated_at | DATETIME2 | NOT NULL | - | 更新日時 |

#### 3.2.7 attached_files（添付ファイル）
| カラム名 | データ型 | NULL | キー | 説明 |
|---------|---------|------|------|------|
| file_id | INT | NOT NULL | PK | ファイルID |
| target_type | NVARCHAR(20) | NOT NULL | - | 対象種別（REQUEST/RESPONSE） |
| target_id | INT | NOT NULL | - | 対象ID |
| original_filename | NVARCHAR(255) | NOT NULL | - | 元ファイル名 |
| stored_filename | NVARCHAR(255) | NOT NULL | - | 保存ファイル名 |
| file_size | BIGINT | NOT NULL | - | ファイルサイズ |
| content_type | NVARCHAR(100) | NOT NULL | - | コンテンツタイプ |
| blob_url | NVARCHAR(500) | NOT NULL | - | Blob Storage URL |
| uploaded_by | INT | NOT NULL | FK | アップロード者ID |
| uploaded_at | DATETIME2 | NOT NULL | - | アップロード日時 |

## 4. UI/UX設計

### 4.1 画面遷移図

```
[ログイン画面]
    ↓
[メニュー画面]
    ├── [仕様登録一覧] → [仕様登録作成/編集] → [仕様承認画面]
    ├── [見積依頼一覧] → [見積依頼作成/編集] → [依頼承認画面]
    ├── [見積回答一覧] → [見積回答作成/編集] → [回答承認画面]
    ├── [ワークフロー状況] → [進捗詳細画面]
    └── [ユーザー管理]
```

### 4.2 画面設計方針
- レスポンシブデザイン対応
- Bootstrap 5.3を使用したモダンUI
- 日本語フォント最適化
- アクセシビリティ対応（WCAG 2.1 AA準拠）
- ダークモード対応（将来拡張）

## 5. ログ設計

### 5.1 ログレベル定義

| レベル | 用途 | 出力先 |
|--------|------|--------|
| ERROR | エラー情報 | ファイル + Azure Monitor |
| WARNING | 警告情報 | ファイル + Azure Monitor |
| INFO | 一般情報 | ファイル |
| DEBUG | デバッグ情報 | ファイル（開発環境のみ） |

### 5.2 ログフォーマット定義

```
[TIMESTAMP] [LEVEL] [MODULE] [USER_ID] [SESSION_ID] MESSAGE
例: [2024-06-16 10:30:15] [INFO] [auth] [user123] [sess456] User login successful
```

### 5.3 ログ出力項目
- 認証・認可関連
- データベース操作
- ファイルアップロード・ダウンロード
- 承認フロー操作
- エラー・例外
- パフォーマンス情報

## 6. API設計

### 6.1 エンドポイント一覧

#### 6.1.1 認証関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | /api/auth/login | ログイン |
| POST | /api/auth/logout | ログアウト |
| GET | /api/auth/me | 現在ユーザー情報取得 |

#### 6.1.2 仕様登録関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/specifications | 仕様一覧取得 |
| POST | /api/specifications | 仕様作成 |
| GET | /api/specifications/{id} | 仕様詳細取得 |
| PUT | /api/specifications/{id} | 仕様更新 |
| DELETE | /api/specifications/{id} | 仕様削除 |
| POST | /api/specifications/{id}/submit | 仕様上程 |
| GET | /api/work-items | 作業項目マスター取得 |
| GET | /api/deliverables | 成果物マスター取得 |

#### 6.1.3 見積依頼関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/requests | 見積依頼一覧取得 |
| POST | /api/requests | 見積依頼作成 |
| GET | /api/requests/{id} | 見積依頼詳細取得 |
| PUT | /api/requests/{id} | 見積依頼更新 |
| DELETE | /api/requests/{id} | 見積依頼削除 |
| POST | /api/requests/{id}/submit | 見積依頼上程 |
| POST | /api/requests/{id}/copy | 見積依頼複写 |

#### 6.1.4 見積回答関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/responses | 見積回答一覧取得 |
| POST | /api/responses | 見積回答作成 |
| GET | /api/responses/{id} | 見積回答詳細取得 |
| PUT | /api/responses/{id} | 見積回答更新 |
| POST | /api/responses/{id}/submit | 見積回答上程 |

#### 6.1.5 承認関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/approvals | 承認待ち一覧取得 |
| POST | /api/approvals/{id}/approve | 承認実行 |
| POST | /api/approvals/{id}/reject | 差し戻し |
| POST | /api/approvals/{id}/withdraw | 取り戻し |

#### 6.1.6 ファイル関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| POST | /api/files/upload | ファイルアップロード |
| GET | /api/files/{id}/download | ファイルダウンロード |
| DELETE | /api/files/{id} | ファイル削除 |

#### 6.1.7 ユーザー管理関連
| メソッド | エンドポイント | 説明 |
|---------|---------------|------|
| GET | /api/users | ユーザー一覧取得 |
| POST | /api/users | ユーザー作成 |
| PUT | /api/users/{id} | ユーザー更新 |
| DELETE | /api/users/{id} | ユーザー削除 |

### 6.2 APIレスポンス形式

#### 6.2.1 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "操作が正常に完了しました"
}
```

#### 6.2.2 エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値に誤りがあります",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}
```

## 7. セキュリティ設計

### 7.1 認証方法
- セッションベース認証
- CSRF保護（Flask-WTF）
- パスワードハッシュ化（bcrypt）
- セッションタイムアウト（30分）

### 7.2 認可方法
- ロールベースアクセス制御（RBAC）
- ユーザー種別による機能制限
- データレベルセキュリティ（自社データのみアクセス可能）

### 7.3 セキュリティ対策
- SQLインジェクション対策（SQLAlchemy ORM使用）
- XSS対策（Jinja2自動エスケープ）
- CSRF対策（Flask-WTF）
- ファイルアップロード制限（拡張子・サイズ・MIME type）
- HTTPS強制
- セキュリティヘッダー設定

## 8. バッチ設計

### 8.1 バッチスケジュール定義

| バッチ名 | 実行タイミング | 処理内容 |
|---------|---------------|----------|
| 期限切れ通知 | 毎日 9:00 | 回答期限が近い案件の通知メール送信 |
| ファイル削除 | 毎月 1日 2:00 | 5年経過したファイルの削除 |
| ログローテーション | 毎日 1:00 | ログファイルのローテーション |

## 9. テスト設計

### 9.1 単体テストケース

#### 9.1.1 ユーザー管理コンポーネント
- ユーザー作成機能
- ユーザー認証機能
- ユーザー情報更新機能

#### 9.1.2 見積依頼コンポーネント
- 見積依頼作成機能
- 見積依頼検索機能
- 見積依頼更新機能
- 見積依頼削除機能

#### 9.1.3 見積回答コンポーネント
- 見積回答作成機能
- 見積回答更新機能
- 見積価格計算機能

#### 9.1.4 承認フローコンポーネント
- 承認フロー作成機能
- 承認実行機能
- 差し戻し機能

#### 9.1.5 ファイル管理コンポーネント
- ファイルアップロード機能
- ファイルダウンロード機能
- ファイル削除機能

### 9.2 APIテストケース

#### 9.2.1 認証API
- POST /api/auth/login - 正常ログイン
- POST /api/auth/login - 不正ログイン
- POST /api/auth/logout - ログアウト

#### 9.2.2 見積依頼API
- GET /api/requests - 一覧取得（正常）
- POST /api/requests - 作成（正常）
- POST /api/requests - 作成（バリデーションエラー）
- PUT /api/requests/{id} - 更新（正常）
- DELETE /api/requests/{id} - 削除（正常）

#### 9.2.3 見積回答API
- GET /api/responses - 一覧取得（正常）
- POST /api/responses - 作成（正常）
- PUT /api/responses/{id} - 更新（正常）

#### 9.2.4 ファイルAPI
- POST /api/files/upload - アップロード（正常）
- POST /api/files/upload - アップロード（サイズ超過）
- GET /api/files/{id}/download - ダウンロード（正常）

### 9.3 E2Eテスト定義

#### 9.3.1 見積依頼業務フロー
1. IT部門ユーザーログイン
2. 見積依頼新規作成
3. ファイル添付
4. 上程・承認
5. ベンダーへの通知確認

#### 9.3.2 見積回答業務フロー
1. ベンダーユーザーログイン
2. 見積依頼一覧確認
3. 見積回答作成
4. 見積書添付
5. 上程・承認
6. IT部門への通知確認

#### 9.3.3 承認ワークフロー
1. 多段階承認の実行
2. 差し戻し処理
3. 取り戻し処理
4. メール通知確認

### 9.4 負荷テスト定義

#### 9.4.1 基本負荷テスト
- 同時接続ユーザー数: 50名
- テスト時間: 30分
- 対象機能: 見積依頼一覧表示

#### 9.4.2 ピーク負荷テスト
- 同時接続ユーザー数: 100名
- テスト時間: 10分
- 対象機能: 見積依頼作成

#### 9.4.3 ファイルアップロード負荷テスト
- 同時アップロード数: 20ファイル
- ファイルサイズ: 10MB
- テスト時間: 15分

## 10. 非機能要件詳細

### 10.1 パフォーマンス要件
- 画面表示レスポンス時間: 3秒以内
- API応答時間: 1秒以内
- ファイルアップロード時間: 10MB/30秒以内
- データベースクエリ実行時間: 500ms以内

### 10.2 可用性要件
- システム稼働率: 99%以上
- 計画メンテナンス時間: 月1回、2時間以内
- 障害復旧時間: 4時間以内

### 10.3 拡張性要件
- ユーザー数: 最大500名まで対応
- データ保存期間: 5年間
- ファイル保存容量: 1TB

### 10.4 運用・保守要件
- ログ保存期間: 1年間
- バックアップ頻度: 日次
- 監視項目: CPU使用率、メモリ使用率、ディスク使用率、応答時間
