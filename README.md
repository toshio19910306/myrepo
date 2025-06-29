# 見積依頼システム

IT部門向け見積依頼・回答管理システム

## 概要

このシステムは、IT部門がベンダーに対して見積依頼を行い、回答を管理するためのWebアプリケーションです。デジタル庁のデザインシステムに基づいて設計されており、モダンな技術スタックを使用して構築されています。

## 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- Bun (パッケージマネージャー)

### バックエンド
- Rust
- Axum (Webフレームワーク)
- PostgreSQL
- SeaORM

### デザイン
- デジタル庁デザインシステム準拠
- レスポンシブデザイン
- ダークモード・ライトモード対応

## 主要機能

### 70%実装完了機能
- ✅ ユーザー管理 (CRUD操作)
- ✅ 仕様書管理 (作成、編集、提出)
- ✅ 見積依頼管理 (作成、編集、送信、コピー)
- ✅ 見積回答管理 (作成、編集、提出)
- ✅ 承認管理 (基本的な承認フロー)
- ✅ ダッシュボード (概要表示)
- ✅ ナビゲーション
- ✅ 認証システム (基本実装)

### 今後実装予定
- データベース統合
- ファイルアップロード機能
- メール通知機能
- 詳細な承認ワークフロー
- レポート機能

## セットアップ

### 前提条件
- Node.js 18+
- Bun
- Rust
- PostgreSQL

### フロントエンド
```bash
cd src/frontend
bun install
bun dev
```

### バックエンド
```bash
cd src/backend
cargo run
```

### データベース
```bash
# PostgreSQLでデータベースを作成
createdb estimate_request

# マイグレーション実行
psql -d estimate_request -f migrations/001_initial.sql
```

## ディレクトリ構成

```
myrepo/
├── src/
│   ├── frontend/          # Next.js フロントエンド
│   │   ├── src/
│   │   │   ├── app/       # App Router ページ
│   │   │   ├── components/ # 再利用可能コンポーネント
│   │   │   └── lib/       # ユーティリティ
│   │   └── package.json
│   └── backend/           # Rust バックエンド
│       ├── src/
│       │   ├── handlers/  # API ハンドラー
│       │   ├── models/    # データモデル
│       │   ├── services/  # ビジネスロジック
│       │   └── utils/     # ユーティリティ
│       ├── migrations/    # データベースマイグレーション
│       └── Cargo.toml
├── documents/             # 設計書・要件定義書
└── README.md
```

## API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/logout` - ログアウト

### ユーザー管理
- `GET /api/users` - ユーザー一覧取得
- `POST /api/users` - ユーザー作成
- `GET /api/users/:id` - ユーザー詳細取得
- `PUT /api/users/:id` - ユーザー更新
- `DELETE /api/users/:id` - ユーザー削除

### 仕様書管理
- `GET /api/specifications` - 仕様書一覧取得
- `POST /api/specifications` - 仕様書作成
- `GET /api/specifications/:id` - 仕様書詳細取得
- `PUT /api/specifications/:id` - 仕様書更新
- `DELETE /api/specifications/:id` - 仕様書削除
- `POST /api/specifications/:id/submit` - 仕様書提出

### 見積依頼管理
- `GET /api/requests` - 見積依頼一覧取得
- `POST /api/requests` - 見積依頼作成
- `GET /api/requests/:id` - 見積依頼詳細取得
- `PUT /api/requests/:id` - 見積依頼更新
- `DELETE /api/requests/:id` - 見積依頼削除
- `POST /api/requests/:id/submit` - 見積依頼送信
- `POST /api/requests/:id/copy` - 見積依頼コピー

### 見積回答管理
- `GET /api/responses` - 見積回答一覧取得
- `POST /api/responses` - 見積回答作成
- `GET /api/responses/:id` - 見積回答詳細取得
- `PUT /api/responses/:id` - 見積回答更新
- `DELETE /api/responses/:id` - 見積回答削除
- `POST /api/responses/:id/submit` - 見積回答提出

### 承認管理
- `GET /api/approvals` - 承認フロー一覧取得
- `POST /api/approvals` - 承認フロー作成
- `GET /api/approvals/:id` - 承認フロー詳細取得
- `POST /api/approvals/:id/action` - 承認アクション実行
- `GET /api/approvals/history` - 承認履歴取得

## デザインシステム

### カラーパレット
- **メインカラー**: #82A0AA (グレーブルー), #FFFFFF (ホワイト)
- **サブカラー**: #B31F26 (レッド), #000000 (ブラック)

### コンポーネント
- デジタル庁デザインシステムに準拠
- アクセシビリティ対応
- レスポンシブデザイン

## 開発ガイドライン

### ブランチ戦略
- Git Flow を採用
- feature ブランチで開発
- develop ブランチにマージ

### コーディング規約
- TypeScript strict モード
- ESLint + Prettier
- Rust clippy

### テスト
- フロントエンド: Bun test
- バックエンド: Cargo test
- E2E: Playwright
- カバレッジ目標: 70%以上

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。
