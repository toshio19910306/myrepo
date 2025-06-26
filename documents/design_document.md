# 設計書

## 1. システム全体設計

### 1.1 開発言語・フレームワーク・バージョン

| 項目 | 技術 | バージョン |
|------|------|-----------|
| フロントエンド言語 | TypeScript | 5.3+ |
| フロントエンドフレームワーク | Next.js (App Router) | 15.x |
| パッケージマネージャー | bun | 1.0+ |
| バックエンド言語 | Rust | 1.75+ |
| Webフレームワーク | Axum | 0.7+ |
| ORM | SeaORM | 0.12+ |
| データベース | Azure SQL Database | 最新 |
| スタイリング | TailwindCSS | 3.4+ |
| UIコンポーネント | shadcn/ui | 最新 |
| 認証 | JWT + jsonwebtoken | 最新 |
| ファイルストレージ | Azure Blob Storage | 最新 |
| メール送信 | Azure SendGrid | 最新 |
| 単体テスト | bun test + cargo test | 最新 |
| E2Eテスト | Playwright | 最新 |
| 負荷テスト | 未定（要検討） | - |

### 1.2 システム構成図

```
[ユーザー] 
    ↓ HTTPS
[Azure Static Web Apps (Next.js)]
    ├── フロントエンドアプリケーション
    ├── 静的アセット
    └── CDN配信
    ↓ API呼び出し
[Azure Container Apps (Rust)]
    ├── Axum Webサーバー
    ├── ビジネスロジック
    └── 認証・認可
    ↓
[Azure SQL Database]
    ├── アプリケーションデータ
    ├── ユーザー情報（所属・職位含む）
    └── 承認履歴データ
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
| Azure Static Web Apps | フロントエンドホスティング | Next.js App Router対応 |
| Azure Container Apps | バックエンドホスティング | Rustアプリケーション |
| Azure SQL Database | データベース | Basic/Standard tier |
| Azure Blob Storage | ファイルストレージ | 添付ファイル保存 |
| Azure SendGrid | メール送信サービス | 承認通知用 |
| Azure Monitor | ログ・監視 | アプリケーション監視 |
| Azure Key Vault | シークレット管理 | DB接続文字列等 |
| Azure Application Insights | パフォーマンス監視 | フロント・バック両方 |

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
| password_hash | NVARCHAR(255) | NOT NULL | - | パスワードハッシュ |
| full_name | NVARCHAR(100) | NOT NULL | - | 氏名 |
| department | NVARCHAR(100) | NULL | - | 所属部署 |
| position | NVARCHAR(50) | NULL | - | 職位 |
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
| action_type | NVARCHAR(20) | NOT NULL | - | 処理内容（申請/上程/承認/差し戻し） |
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
    ├── [承認履歴一覧] → [承認履歴詳細画面]
    └── [ユーザー管理]
```

### 4.2 画面設計方針
- レスポンシブデザイン対応（モバイルファースト）
- TailwindCSS + shadcn/ui を使用したモダンUI
- デジタル庁デザインシステム準拠
- メインカラー：#82A0AA, #FFFFFF
- サブカラー：#B31F26, #000000
- 日本語フォント最適化（Noto Sans JP）
- アクセシビリティ対応（WCAG 2.1 AA準拠）
- ダークモード・ライトモード対応

### 4.3 新規画面：承認履歴
- **承認履歴一覧画面**: `/approval-history`
  - 承認履歴の検索・フィルタリング機能
  - 処理内容、処理日時、所属、職位、氏名、コメントの表示
  - ページネーション対応
  - CSV出力機能
- **承認履歴詳細画面**: `/approval-history/[id]`
  - 承認履歴の詳細情報表示
  - 関連する見積依頼・回答の表示
  - 承認フロー全体の可視化

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
| GET | /api/approvals/{id}/history | 承認履歴取得 |
| GET | /api/approval-history | 承認履歴一覧取得（検索・フィルタ対応） |

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
| POST | /api/users | ユーザー作成（所属・職位含む） |
| PUT | /api/users/{id} | ユーザー更新（所属・職位含む） |
| DELETE | /api/users/{id} | ユーザー削除 |
| GET | /api/users/{id} | ユーザー詳細取得 |

### 6.2 APIレスポンス形式

#### 6.2.1 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "操作が正常に完了しました",
  "timestamp": "2024-06-26T13:21:50Z"
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
  },
  "timestamp": "2024-06-26T13:21:50Z"
}
```

#### 6.2.3 承認履歴APIレスポンス例
```json
{
  "success": true,
  "data": {
    "approval_history": [
      {
        "id": 1,
        "action_type": "申請",
        "processed_at": "2024-06-26T10:00:00Z",
        "user": {
          "full_name": "田中太郎",
          "department": "IT企画部",
          "position": "主任"
        },
        "comments": "見積依頼を申請します"
      },
      {
        "id": 2,
        "action_type": "承認",
        "processed_at": "2024-06-26T11:30:00Z",
        "user": {
          "full_name": "佐藤花子",
          "department": "IT企画部",
          "position": "課長"
        },
        "comments": "承認します"
      }
    ],
    "total_count": 2,
    "page": 1,
    "per_page": 20
  }
}
```

## 7. セキュリティ設計

### 7.1 認証方法
- JWT（JSON Web Token）ベース認証
- トークンの有効期限管理（アクセストークン: 1時間、リフレッシュトークン: 7日）
- パスワードハッシュ化（bcrypt）
- レート制限（ログイン試行回数制限）

### 7.2 認可方法
- ロールベースアクセス制御（RBAC）
- ユーザー種別による機能制限（IT/VENDOR）
- データレベルセキュリティ（自社データのみアクセス可能）
- APIエンドポイント毎の認可チェック

### 7.3 セキュリティ対策
- SQLインジェクション対策（SeaORM使用、パラメータ化クエリ）
- XSS対策（React自動エスケープ、CSP設定）
- CSRF対策（SameSite Cookie、CSRF トークン）
- ファイルアップロード制限（拡張子・サイズ・MIME type・ウイルススキャン）
- HTTPS強制（Azure Static Web Apps/Container Apps）
- セキュリティヘッダー設定（HSTS、X-Frame-Options等）
- 入力値検証（Rust validator crate、Zod）
- ログ記録（認証・認可・操作履歴）

### 7.4 Azure セキュリティ機能
- Azure Key Vault（機密情報管理）
- Azure Active Directory（オプション認証）
- Azure Application Gateway（WAF）
- Azure Monitor（セキュリティ監視）

## 8. バッチ設計

### 8.1 バッチスケジュール定義

| バッチ名 | 実行タイミング | 処理内容 |
|---------|---------------|----------|
| 期限切れ通知 | 毎日 9:00 | 回答期限が近い案件の通知メール送信 |
| ファイル削除 | 毎月 1日 2:00 | 5年経過したファイルの削除 |
| ログローテーション | 毎日 1:00 | ログファイルのローテーション |

## 9. テスト設計

### 9.1 フロントエンド単体テスト（bun test）

#### 9.1.1 コンポーネントテスト
- ユーザー管理コンポーネント（作成・更新・削除）
- 見積依頼フォームコンポーネント
- 見積回答フォームコンポーネント
- 承認履歴表示コンポーネント
- ファイルアップロードコンポーネント

#### 9.1.2 ユーティリティテスト
- API クライアント関数
- 認証ヘルパー関数
- バリデーション関数
- 日付・文字列処理関数

### 9.2 バックエンド単体テスト（cargo test）

#### 9.2.1 ハンドラーテスト
- 認証ハンドラー（ログイン・ログアウト・トークン検証）
- ユーザー管理ハンドラー（CRUD操作、所属・職位含む）
- 見積依頼ハンドラー（作成・更新・削除・検索）
- 見積回答ハンドラー（作成・更新・価格計算）
- 承認ハンドラー（承認・差し戻し・履歴取得）
- ファイル管理ハンドラー（アップロード・ダウンロード・削除）

#### 9.2.2 サービス層テスト
- ユーザー認証サービス
- 承認ワークフローサービス
- 承認履歴管理サービス
- ファイル管理サービス
- メール通知サービス

#### 9.2.3 モデル・バリデーションテスト
- データモデルのシリアライゼーション
- 入力値バリデーション
- ビジネスルール検証

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

### 9.3 E2Eテスト定義（Playwright）

#### 9.3.1 見積依頼業務フロー
1. IT部門ユーザーログイン
2. 見積依頼新規作成（所属・職位情報含む）
3. ファイル添付（Azure Blob Storage）
4. 上程・承認ワークフロー
5. 承認履歴の記録確認
6. ベンダーへの通知確認

#### 9.3.2 見積回答業務フロー
1. ベンダーユーザーログイン
2. 見積依頼一覧確認
3. 見積回答作成
4. 見積書添付
5. 上程・承認ワークフロー
6. 承認履歴の記録確認
7. IT部門への通知確認

#### 9.3.3 承認ワークフロー・履歴管理
1. 多段階承認の実行
2. 差し戻し処理
3. 取り戻し処理
4. 承認履歴表示・検索機能
5. 承認履歴詳細表示
6. メール通知確認

#### 9.3.4 ユーザー管理・承認履歴
1. ユーザー作成（所属・職位設定）
2. ユーザー情報更新
3. 承認履歴での所属・職位表示確認
4. 承認履歴検索・フィルタリング

#### 9.3.5 レスポンシブ・テーマ切り替え
1. モバイル表示での操作確認
2. ダークモード・ライトモード切り替え
3. 各画面でのレスポンシブ動作確認

### 9.4 負荷テスト定義

#### 9.4.1 基本負荷テスト
- 同時接続ユーザー数: 50名
- テスト時間: 30分
- 対象機能: 見積依頼一覧表示、承認履歴表示

#### 9.4.2 ピーク負荷テスト
- 同時接続ユーザー数: 100名
- テスト時間: 10分
- 対象機能: 見積依頼作成、承認処理

#### 9.4.3 ファイルアップロード負荷テスト
- 同時アップロード数: 20ファイル
- ファイルサイズ: 10MB
- テスト時間: 15分
- 対象: Azure Blob Storage連携

#### 9.4.4 承認履歴検索負荷テスト
- 同時検索ユーザー数: 30名
- データ件数: 10,000件の承認履歴
- 検索条件: 複数条件での絞り込み
- テスト時間: 20分

### 9.5 テストカバレッジ目標
- フロントエンド単体テスト: 70%以上
- バックエンド単体テスト: 70%以上
- E2Eテスト: 主要業務フロー100%カバー
- 承認履歴機能: 100%カバー（新機能のため）

## 10. 非機能要件詳細

### 10.1 パフォーマンス要件
- 画面表示レスポンス時間: 2秒以内（Next.js SSR/SSG活用）
- API応答時間: 500ms以内（Rust高速処理）
- ファイルアップロード時間: 10MB/20秒以内（Azure Blob Storage直接アップロード）
- データベースクエリ実行時間: 300ms以内（インデックス最適化）
- 承認履歴検索: 1秒以内（大量データ対応）

### 10.2 可用性要件
- システム稼働率: 99.9%以上（Azure SLA活用）
- 計画メンテナンス時間: 月1回、1時間以内
- 障害復旧時間: 2時間以内（Azure自動復旧機能）
- フロントエンド: CDN配信による高可用性

### 10.3 拡張性要件
- ユーザー数: 最大1,000名まで対応
- データ保存期間: 7年間（法的要件対応）
- ファイル保存容量: 5TB（Azure Blob Storage）
- 承認履歴データ: 無制限（アーカイブ機能付き）
- 水平スケーリング対応（Azure Container Apps）

### 10.4 運用・保守要件
- ログ保存期間: 2年間（Azure Monitor）
- バックアップ頻度: 日次自動バックアップ（Azure SQL Database）
- 監視項目: 
  - インフラ: CPU、メモリ、ディスク、ネットワーク
  - アプリケーション: 応答時間、エラー率、スループット
  - ビジネス: 承認処理時間、ファイルアップロード成功率
- アラート設定: 閾値超過時の自動通知

### 10.5 セキュリティ要件
- データ暗号化: 保存時・転送時ともにAES-256
- アクセスログ: 全API呼び出しの記録
- 個人情報保護: GDPR準拠のデータ処理
- 承認履歴の改ざん防止: ハッシュ値による整合性チェック

### 10.6 ユーザビリティ要件
- レスポンシブデザイン: スマートフォン・タブレット対応
- アクセシビリティ: WCAG 2.1 AA準拠
- 多言語対応: 日本語・英語（将来拡張）
- ダークモード対応: ユーザー設定保存

## 11. デプロイメント設計

### 11.1 Azure リソース構成
- **リソースグループ**: Devin-test
- **リージョン**: Japan West
- **フロントエンド**: Azure Static Web Apps
- **バックエンド**: Azure Container Apps
- **データベース**: Azure SQL Database
- **ストレージ**: Azure Blob Storage
- **メール**: Azure SendGrid
- **監視**: Azure Application Insights
- **セキュリティ**: Azure Key Vault

### 11.2 Bicep テンプレート構成
```
infrastructure/
├── main.bicep              # メインテンプレート
├── modules/
│   ├── staticwebapp.bicep  # Static Web Apps
│   ├── containerapp.bicep  # Container Apps
│   ├── database.bicep      # SQL Database
│   ├── storage.bicep       # Blob Storage
│   ├── keyvault.bicep      # Key Vault
│   └── monitoring.bicep    # Application Insights
└── parameters/
    ├── dev.bicepparam      # 開発環境パラメータ
    └── prod.bicepparam     # 本番環境パラメータ
```

### 11.3 環境変数設定
#### フロントエンド（Static Web Apps）
- `NEXT_PUBLIC_API_BASE_URL`: バックエンドAPI URL
- `NEXT_PUBLIC_BLOB_STORAGE_URL`: Blob Storage URL
- `NEXT_PUBLIC_APP_INSIGHTS_KEY`: Application Insights キー

#### バックエンド（Container Apps）
- `DATABASE_URL`: SQL Database接続文字列
- `BLOB_STORAGE_CONNECTION_STRING`: Blob Storage接続文字列
- `SENDGRID_API_KEY`: SendGrid APIキー
- `JWT_SECRET`: JWT署名用秘密鍵
- `RUST_LOG`: ログレベル設定
- `SCM_DO_BUILD_DURING_DEPLOYMENT`: true（自動ビルド有効）

### 11.4 CI/CD パイプライン
#### GitHub Actions ワークフロー
- **フロントエンド**: Static Web Apps自動デプロイ
- **バックエンド**: Container Registry → Container Apps
- **データベース**: マイグレーション自動実行
- **テスト**: 単体テスト・E2Eテスト自動実行

### 11.5 データベースマイグレーション
- SeaORM Migration機能使用
- 承認履歴機能用テーブル変更
  - `users`テーブル: `department`, `position`カラム追加
  - `approval_steps`テーブル: `action_type`カラム追加
- 本番環境への段階的適用

## 12. 承認履歴機能詳細設計

### 12.1 承認履歴データモデル
承認履歴は既存の`approval_steps`テーブルを拡張して管理する。

#### 12.1.1 拡張されたapproval_stepsテーブル
```sql
-- 承認履歴表示用のビュー
CREATE VIEW approval_history_view AS
SELECT 
    as.step_id,
    as.action_type,
    as.approved_at as processed_at,
    u.full_name,
    u.department,
    u.position,
    as.comments,
    af.target_type,
    af.target_id,
    CASE 
        WHEN af.target_type = 'REQUEST' THEN er.subject
        WHEN af.target_type = 'RESPONSE' THEN er2.subject
    END as target_title
FROM approval_steps as
JOIN users u ON as.approver_id = u.user_id
JOIN approval_flows af ON as.flow_id = af.flow_id
LEFT JOIN estimate_requests er ON af.target_type = 'REQUEST' AND af.target_id = er.request_id
LEFT JOIN estimate_responses resp ON af.target_type = 'RESPONSE' AND af.target_id = resp.response_id
LEFT JOIN estimate_requests er2 ON resp.request_id = er2.request_id
WHERE as.approved_at IS NOT NULL
ORDER BY as.approved_at DESC;
```

### 12.2 承認履歴API設計

#### 12.2.1 承認履歴一覧取得API
```
GET /api/approval-history?page=1&per_page=20&target_type=estimate_request&target_id=123&action_type=承認&date_from=2024-01-01&date_to=2024-12-31&department=IT企画部&position=課長
```

**クエリパラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `per_page`: 1ページあたりの件数（デフォルト: 20、最大: 100）
- `target_type`: 対象種別（estimate_request/estimate_response）
- `target_id`: 対象ID
- `action_type`: 処理内容（申請/上程/承認/差し戻し）
- `date_from`: 処理日時開始
- `date_to`: 処理日時終了
- `department`: 所属部署
- `position`: 職位
- `approver_name`: 承認者名（部分一致）
- `sort_by`: ソート項目（processed_at/department/position/full_name）
- `sort_order`: ソート順（asc/desc、デフォルト: desc）

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "approval_history": [
      {
        "id": 1,
        "action_type": "申請",
        "processed_at": "2024-06-26T10:00:00Z",
        "user": {
          "full_name": "田中太郎",
          "department": "IT企画部",
          "position": "主任"
        },
        "comments": "見積依頼を申請します",
        "target": {
          "type": "estimate_request",
          "id": 123,
          "title": "ECサイト構築プロジェクト"
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_count": 150,
      "total_pages": 8
    }
  }
}
```

#### 12.2.2 特定対象の承認履歴取得API
```
GET /api/approvals/{id}/history
```

**レスポンス例:**
```json
{
  "success": true,
  "data": {
    "target": {
      "type": "estimate_request",
      "id": 123,
      "title": "ECサイト構築プロジェクト",
      "status": "承認済み"
    },
    "approval_history": [
      {
        "step_number": 1,
        "action_type": "申請",
        "processed_at": "2024-06-26T10:00:00Z",
        "user": {
          "full_name": "田中太郎",
          "department": "IT企画部",
          "position": "主任"
        },
        "comments": "見積依頼を申請します"
      },
      {
        "step_number": 2,
        "action_type": "承認",
        "processed_at": "2024-06-26T11:30:00Z",
        "user": {
          "full_name": "佐藤花子",
          "department": "IT企画部",
          "position": "課長"
        },
        "comments": "承認します"
      }
    ]
  }
}
```

### 12.3 承認履歴UI設計

#### 12.3.1 承認履歴一覧画面
- **パス**: `/approval-history`
- **コンポーネント**: `ApprovalHistoryList`
- **機能**: 
  - 承認履歴の一覧表示（テーブル形式）
  - 検索・フィルタリング機能
  - ページネーション
  - CSV出力
  - 詳細表示リンク

**表示項目:**
- 処理日時
- 処理内容（申請/上程/承認/差し戻し）
- 対象（見積依頼/見積回答のタイトル）
- 承認者氏名
- 所属部署
- 職位
- コメント（省略表示）
- アクション（詳細表示）

#### 12.3.2 承認履歴詳細画面
- **パス**: `/approval-history/[id]`
- **コンポーネント**: `ApprovalHistoryDetail`
- **機能**:
  - 承認履歴の詳細情報表示
  - 関連する見積依頼・回答の表示
  - 承認フロー全体の可視化（タイムライン形式）
  - 添付ファイルの表示・ダウンロード

#### 12.3.3 承認履歴コンポーネント設計
```typescript
// 承認履歴表示コンポーネント
interface ApprovalHistoryItem {
  id: number;
  actionType: '申請' | '上程' | '承認' | '差し戻し';
  processedAt: string;
  user: {
    fullName: string;
    department: string;
    position: string;
  };
  comments: string;
  target: {
    type: 'estimate_request' | 'estimate_response';
    id: number;
    title: string;
  };
}

interface ApprovalHistoryFilters {
  targetType?: 'estimate_request' | 'estimate_response';
  actionType?: '申請' | '上程' | '承認' | '差し戻し';
  dateFrom?: string;
  dateTo?: string;
  department?: string;
  position?: string;
  approverName?: string;
}

interface ApprovalHistoryListProps {
  items: ApprovalHistoryItem[];
  pagination: PaginationInfo;
  filters: ApprovalHistoryFilters;
  onPageChange: (page: number) => void;
  onFilter: (filters: ApprovalHistoryFilters) => void;
  onExportCSV: () => void;
}

// 承認履歴フィルターコンポーネント
interface ApprovalHistoryFilterProps {
  filters: ApprovalHistoryFilters;
  onFilterChange: (filters: ApprovalHistoryFilters) => void;
  onReset: () => void;
}

// 承認履歴タイムラインコンポーネント
interface ApprovalTimelineProps {
  history: ApprovalHistoryItem[];
  target: {
    type: string;
    id: number;
    title: string;
    status: string;
  };
}
```

### 12.4 承認履歴検索・フィルタリング

#### 12.4.1 検索条件
- **処理内容**: ドロップダウン選択（申請、上程、承認、差し戻し）
- **処理日時範囲**: 日付ピッカー（開始日〜終了日）
- **所属部署**: オートコンプリート入力
- **職位**: ドロップダウン選択
- **承認者氏名**: テキスト入力（部分一致）
- **対象種別**: ラジオボタン（見積依頼/見積回答/全て）
- **コメント**: テキスト入力（部分一致）

#### 12.4.2 ソート条件
- **処理日時**（デフォルト：降順）
- **所属部署**（昇順・降順）
- **職位**（昇順・降順）
- **承認者氏名**（昇順・降順）

#### 12.4.3 CSV出力機能
- フィルタリング結果をCSV形式で出力
- 出力項目：処理日時、処理内容、対象タイトル、承認者氏名、所属部署、職位、コメント
- ファイル名：`approval_history_YYYYMMDD_HHMMSS.csv`

### 12.5 承認履歴セキュリティ設計

#### 12.5.1 アクセス制御
- **IT部門ユーザー**: 全ての承認履歴を閲覧可能
- **ベンダーユーザー**: 自社関連の承認履歴のみ閲覧可能
- **承認者**: 自分が関与した承認履歴を閲覧可能
- **一般ユーザー**: 自分が作成した案件の承認履歴のみ閲覧可能

#### 12.5.2 データ保護
- 承認履歴データの改ざん防止（ハッシュ値による整合性チェック）
- 個人情報の適切な取り扱い（GDPR準拠）
- アクセスログの記録（誰がいつ何を閲覧したか）
- データ保存期間の管理（7年間保存後アーカイブ）

### 12.6 承認履歴パフォーマンス設計

#### 12.6.1 データベースインデックス
```sql
-- 承認履歴検索用インデックス
CREATE INDEX idx_approval_steps_processed_at ON approval_steps(approved_at);
CREATE INDEX idx_approval_steps_action_type ON approval_steps(action_type);
CREATE INDEX idx_approval_steps_approver_processed ON approval_steps(approver_id, approved_at);
CREATE INDEX idx_users_department_position ON users(department, position);
CREATE INDEX idx_approval_flows_target ON approval_flows(target_type, target_id);

-- 複合インデックス（よく使われる検索条件の組み合わせ）
CREATE INDEX idx_approval_history_search ON approval_steps(approved_at, action_type, approver_id);
```

#### 12.6.2 キャッシュ戦略
- **承認履歴一覧**: Redis でページネーション結果をキャッシュ（5分間）
- **ユーザー情報**: 所属・職位情報をメモリキャッシュ（30分間）
- **検索結果**: 同一検索条件の結果を一時キャッシュ（3分間）
- **統計情報**: 承認処理件数などの統計データをキャッシュ（1時間）

#### 12.6.3 パフォーマンス目標
- **承認履歴一覧表示**: 1秒以内
- **承認履歴検索**: 2秒以内
- **CSV出力**: 10,000件まで30秒以内
- **承認履歴詳細表示**: 500ms以内

### 12.7 承認履歴テスト設計

#### 12.7.1 単体テスト
- 承認履歴API のレスポンス形式テスト
- フィルタリング・ソート機能のテスト
- ページネーション機能のテスト
- CSV出力機能のテスト
- アクセス制御のテスト

#### 12.7.2 結合テスト
- 承認処理と履歴記録の連携テスト
- ユーザー情報更新と履歴表示の連携テスト
- ファイルアップロードと履歴記録の連携テスト

#### 12.7.3 E2Eテスト
- 承認履歴一覧画面の表示・操作テスト
- 検索・フィルタリング機能のテスト
- CSV出力機能のテスト
- 承認履歴詳細画面の表示テスト
- レスポンシブデザインのテスト
