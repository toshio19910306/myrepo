# セッション02: 設計フェーズ

## セッション概要
- **開始日時**: 2024年6月20日
- **フェーズ**: 設計フェーズ
- **目的**: CSVからSQL Serverへのデータ変換バッチシステムの設計文書作成

## 技術スタック変更
- **変更前**: Next.js + TypeScript + Rust/Go (分離構成)
- **変更後**: Flask 3.0+ (モノリシック構成)
- **理由**: ユーザーノート「設計」に基づく仮想サーバでのモノリシック構成要件

## 作成した設計文書

### 1. システム全体設計書 (system_design.md)
- Flask 3.0+ベースのモノリシック構成
- Python 3.11+、SQLAlchemy、TailwindCSS
- Azure環境での運用設計
- モジュール設計とデータフロー定義

### 2. インフラ設計書 (infrastructure_design.md)
- Azure App Service、SQL Database、Blob Storage構成
- ネットワーク設計（VNet、Private Endpoint）
- セキュリティ設定とコスト最適化
- 監視・バックアップ戦略

### 3. データベース設計書 (database_design.md)
- ER図と4テーブル設計（作業実績、社員、プロジェクト、バッチ履歴）
- インデックス戦略とパフォーマンス最適化
- ストアドプロシージャとビュー定義
- データ保持ポリシー

### 4. UI/UX設計書 (ui_ux_design.md)
- デジタル庁デザインシステム準拠
- カラーパレット（#82A0AA、#B31F26）
- レスポンシブデザインとダークモード対応
- 画面遷移図と機能要件

### 5. ログ設計書 (log_design.md)
- structlogを使用した構造化ログ
- ログレベル定義とカテゴリ別設計
- Azure Monitor連携とアラート設定
- ログ保持・アーカイブポリシー

### 6. API設計書 (api_design.md)
- Flask REST APIエンドポイント設計
- Azure AD認証とRBAC
- バッチ処理、監視、設定管理API
- エラーハンドリングとレート制限

### 7. セキュリティ設計書 (security_design.md)
- Azure AD統合認証
- データ保護（暗号化、マスキング）
- ネットワークセキュリティ（NSG、Private Link）
- 入力検証とSQLインジェクション対策

### 8. バッチ設計書 (batch_design.md)
- APSchedulerを使用したスケジューリング
- エラーハンドリングとリトライ機能
- 並行処理とパフォーマンス最適化
- 監視・通知サービス設計

### 9. テスト設計書 (test_design.md)
- pytest、Playwright、Locustを使用
- 単体テスト、結合テスト、E2E、負荷テストの順序
- カバレッジ目標70%
- 表形式テスト成績書テンプレート

## 設計方針

### アーキテクチャ
- **モノリシック構成**: フロントエンドとバックエンドを統合
- **Flask中心**: Jinja2テンプレート、TailwindCSS、Vanilla JavaScript
- **Azure統合**: App Service、SQL Database、Blob Storage

### セキュリティ
- **Azure AD認証**: OAuth 2.0 / OpenID Connect
- **RBAC**: admin、operator、viewerロール
- **データ保護**: TDE、SSE、個人情報マスキング

### パフォーマンス
- **バッチ処理**: 1万件/日の処理要件
- **並行処理**: マルチプロセッシング対応
- **データベース最適化**: バルクインサート、インデックス戦略

### 運用・保守
- **監視**: Azure Monitor、Application Insights
- **ログ**: 構造化ログ、自動アーカイブ
- **バックアップ**: 自動バックアップ、災害復旧

## 次のステップ
- ユーザーレビューと承認取得
- 実装フェーズへの移行
- 70%実装 → レビュー → 100%実装のサイクル実行

## 技術的考慮事項
- デジタル庁デザインシステム準拠
- 日次1万件データ処理の性能要件
- Azure Japan Westリージョンでの運用
- git-flowブランチ戦略の継続
