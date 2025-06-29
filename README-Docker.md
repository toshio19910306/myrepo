# Docker Compose セットアップガイド

## 概要
見積依頼管理システムをDocker Desktopで実行するためのセットアップガイドです。

## 前提条件
- Docker Desktop がインストールされていること
- Docker Compose が利用可能であること

## 構成
- **Frontend**: Next.js 15 (ポート: 3000)
- **Backend**: Rust + Axum (ポート: 8000)
- **Database**: PostgreSQL 15 (ポート: 5432)

## 起動方法

### 本番モード
```bash
# プロジェクトルートディレクトリで実行
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### 開発モード
```bash
# 開発用設定で起動
docker-compose -f docker-compose.dev.yml up -d

# ログを確認
docker-compose -f docker-compose.dev.yml logs -f
```

## アクセス方法
- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:8000
- **データベース**: localhost:5432

## 停止方法
```bash
# 本番モード
docker-compose down

# 開発モード
docker-compose -f docker-compose.dev.yml down

# データも削除する場合
docker-compose down -v
```

## トラブルシューティング

### データベース接続エラー
```bash
# データベースコンテナの状態確認
docker-compose ps database

# データベースログ確認
docker-compose logs database
```

### ポート競合エラー
既存のサービスが同じポートを使用している場合は、docker-compose.ymlのポート設定を変更してください。

### コンテナの再ビルド
```bash
# キャッシュを無視して再ビルド
docker-compose build --no-cache

# 特定のサービスのみ再ビルド
docker-compose build --no-cache backend
```

## 初期データ
データベースは初回起動時に自動的にセットアップされ、SQLx migrationsによりテーブルが作成されます。

## 環境変数
必要に応じて以下の環境変数をカスタマイズできます：
- `POSTGRES_DB`: データベース名
- `POSTGRES_USER`: データベースユーザー
- `POSTGRES_PASSWORD`: データベースパスワード
- `JWT_SECRET`: JWT署名用秘密鍵
- `FRONTEND_URL`: フロントエンドURL（CORS設定用）
