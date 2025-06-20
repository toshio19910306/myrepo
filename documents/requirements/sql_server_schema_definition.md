# SQL Serverスキーマ定義書

## 概要
人工作業実績データを格納するSQL Serverデータベースのスキーマを定義します。

## データベース構成

### データベース名
- **データベース名**: `WorkRecordsDB`
- **照合順序**: `Japanese_CI_AS`
- **文字セット**: UTF-8

## テーブル定義

### 1. 作業実績テーブル（work_records）

#### テーブル概要
- **テーブル名**: `work_records`
- **用途**: 日次の人工作業実績データを格納
- **主キー**: `record_id`（自動採番）
- **ユニークキー**: `work_date`, `employee_id`, `project_id`の組み合わせ

#### カラム定義

| No | カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|----|----------|----------|------|------------|------|------|
| 1 | record_id | BIGINT | NOT NULL | IDENTITY(1,1) | PK | レコードID（自動採番） |
| 2 | work_date | DATE | NOT NULL | - | - | 作業日 |
| 3 | employee_id | VARCHAR(10) | NOT NULL | - | FK | 社員ID |
| 4 | employee_name | NVARCHAR(50) | NOT NULL | - | - | 社員名 |
| 5 | project_id | VARCHAR(20) | NOT NULL | - | FK | プロジェクトID |
| 6 | project_name | NVARCHAR(100) | NOT NULL | - | - | プロジェクト名 |
| 7 | work_content | NVARCHAR(200) | NOT NULL | - | - | 作業内容 |
| 8 | work_hours | DECIMAL(5,2) | NOT NULL | - | CHECK (work_hours >= 0 AND work_hours <= 999.99) | 工数（時間） |
| 9 | hourly_rate | DECIMAL(10,0) | NOT NULL | - | CHECK (hourly_rate >= 0) | 時間単価（円） |
| 10 | total_cost | DECIMAL(12,0) | NOT NULL | - | CHECK (total_cost >= 0) | 総費用（円） |
| 11 | order_amount | DECIMAL(12,0) | NULL | - | CHECK (order_amount >= 0) | 発注金額（円） |
| 12 | remarks | NVARCHAR(500) | NULL | - | - | 備考 |
| 13 | created_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 作成日時 |
| 14 | updated_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 更新日時 |
| 15 | created_by | VARCHAR(50) | NOT NULL | 'SYSTEM' | - | 作成者 |
| 16 | updated_by | VARCHAR(50) | NOT NULL | 'SYSTEM' | - | 更新者 |

#### インデックス定義

```sql
-- 主キー
ALTER TABLE work_records ADD CONSTRAINT PK_work_records PRIMARY KEY (record_id);

-- ユニークキー（重複防止）
ALTER TABLE work_records ADD CONSTRAINT UK_work_records_unique 
UNIQUE (work_date, employee_id, project_id);

-- 検索用インデックス
CREATE INDEX IX_work_records_work_date ON work_records (work_date);
CREATE INDEX IX_work_records_employee_id ON work_records (employee_id);
CREATE INDEX IX_work_records_project_id ON work_records (project_id);
CREATE INDEX IX_work_records_created_at ON work_records (created_at);
```

### 2. 社員マスタテーブル（employees）

#### テーブル概要
- **テーブル名**: `employees`
- **用途**: 社員情報のマスタデータ
- **主キー**: `employee_id`

#### カラム定義

| No | カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|----|----------|----------|------|------------|------|------|
| 1 | employee_id | VARCHAR(10) | NOT NULL | - | PK | 社員ID |
| 2 | employee_name | NVARCHAR(50) | NOT NULL | - | - | 社員名 |
| 3 | department_id | VARCHAR(10) | NULL | - | - | 部署ID |
| 4 | department_name | NVARCHAR(50) | NULL | - | - | 部署名 |
| 5 | position | NVARCHAR(30) | NULL | - | - | 役職 |
| 6 | hire_date | DATE | NULL | - | - | 入社日 |
| 7 | is_active | BIT | NOT NULL | 1 | - | 有効フラグ |
| 8 | created_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 作成日時 |
| 9 | updated_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 更新日時 |

### 3. プロジェクトマスタテーブル（projects）

#### テーブル概要
- **テーブル名**: `projects`
- **用途**: プロジェクト情報のマスタデータ
- **主キー**: `project_id`

#### カラム定義

| No | カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|----|----------|----------|------|------------|------|------|
| 1 | project_id | VARCHAR(20) | NOT NULL | - | PK | プロジェクトID |
| 2 | project_name | NVARCHAR(100) | NOT NULL | - | - | プロジェクト名 |
| 3 | client_name | NVARCHAR(100) | NULL | - | - | 顧客名 |
| 4 | start_date | DATE | NULL | - | - | 開始日 |
| 5 | end_date | DATE | NULL | - | - | 終了日 |
| 6 | budget | DECIMAL(15,0) | NULL | - | CHECK (budget >= 0) | 予算（円） |
| 7 | is_active | BIT | NOT NULL | 1 | - | 有効フラグ |
| 8 | created_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 作成日時 |
| 9 | updated_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 更新日時 |

### 4. バッチ処理履歴テーブル（batch_history）

#### テーブル概要
- **テーブル名**: `batch_history`
- **用途**: バッチ処理の実行履歴を記録
- **主キー**: `batch_id`

#### カラム定義

| No | カラム名 | データ型 | NULL | デフォルト | 制約 | 説明 |
|----|----------|----------|------|------------|------|------|
| 1 | batch_id | BIGINT | NOT NULL | IDENTITY(1,1) | PK | バッチID（自動採番） |
| 2 | file_name | VARCHAR(255) | NOT NULL | - | - | 処理ファイル名 |
| 3 | start_time | DATETIME2(3) | NOT NULL | - | - | 処理開始時刻 |
| 4 | end_time | DATETIME2(3) | NULL | - | - | 処理終了時刻 |
| 5 | status | VARCHAR(20) | NOT NULL | - | CHECK (status IN ('RUNNING', 'SUCCESS', 'ERROR')) | 処理状況 |
| 6 | total_records | INT | NULL | - | CHECK (total_records >= 0) | 総レコード数 |
| 7 | success_records | INT | NULL | - | CHECK (success_records >= 0) | 成功レコード数 |
| 8 | error_records | INT | NULL | - | CHECK (error_records >= 0) | エラーレコード数 |
| 9 | error_message | NVARCHAR(1000) | NULL | - | - | エラーメッセージ |
| 10 | created_at | DATETIME2(3) | NOT NULL | GETDATE() | - | 作成日時 |

## 外部キー制約

```sql
-- 作業実績テーブル → 社員マスタテーブル
ALTER TABLE work_records ADD CONSTRAINT FK_work_records_employee_id 
FOREIGN KEY (employee_id) REFERENCES employees(employee_id);

-- 作業実績テーブル → プロジェクトマスタテーブル
ALTER TABLE work_records ADD CONSTRAINT FK_work_records_project_id 
FOREIGN KEY (project_id) REFERENCES projects(project_id);
```

## トリガー定義

### 更新日時自動更新トリガー

```sql
-- 作業実績テーブル更新トリガー
CREATE TRIGGER TR_work_records_update
ON work_records
AFTER UPDATE
AS
BEGIN
    UPDATE work_records 
    SET updated_at = GETDATE()
    WHERE record_id IN (SELECT record_id FROM inserted);
END;

-- 社員マスタテーブル更新トリガー
CREATE TRIGGER TR_employees_update
ON employees
AFTER UPDATE
AS
BEGIN
    UPDATE employees 
    SET updated_at = GETDATE()
    WHERE employee_id IN (SELECT employee_id FROM inserted);
END;

-- プロジェクトマスタテーブル更新トリガー
CREATE TRIGGER TR_projects_update
ON projects
AFTER UPDATE
AS
BEGIN
    UPDATE projects 
    SET updated_at = GETDATE()
    WHERE project_id IN (SELECT project_id FROM inserted);
END;
```

## ビュー定義

### 作業実績サマリビュー

```sql
CREATE VIEW VW_work_records_summary AS
SELECT 
    work_date,
    employee_id,
    employee_name,
    COUNT(*) as record_count,
    SUM(work_hours) as total_hours,
    SUM(total_cost) as total_cost,
    SUM(ISNULL(order_amount, 0)) as total_order_amount
FROM work_records
GROUP BY work_date, employee_id, employee_name;
```

### 月次集計ビュー

```sql
CREATE VIEW VW_monthly_summary AS
SELECT 
    YEAR(work_date) as work_year,
    MONTH(work_date) as work_month,
    employee_id,
    employee_name,
    COUNT(*) as record_count,
    SUM(work_hours) as total_hours,
    SUM(total_cost) as total_cost,
    SUM(ISNULL(order_amount, 0)) as total_order_amount
FROM work_records
GROUP BY YEAR(work_date), MONTH(work_date), employee_id, employee_name;
```

## 初期データ

### サンプル社員データ

```sql
INSERT INTO employees (employee_id, employee_name, department_id, department_name, position, hire_date) VALUES
('EMP001', '山田太郎', 'DEP001', 'システム開発部', '主任', '2020-04-01'),
('EMP002', '佐藤花子', 'DEP001', 'システム開発部', '係長', '2018-04-01'),
('EMP003', '田中次郎', 'DEP001', 'システム開発部', '一般', '2022-04-01');
```

### サンプルプロジェクトデータ

```sql
INSERT INTO projects (project_id, project_name, client_name, start_date, end_date, budget) VALUES
('PRJ001', 'システム開発プロジェクト', '株式会社ABC', '2024-01-01', '2024-12-31', 50000000),
('PRJ002', '保守運用プロジェクト', '株式会社XYZ', '2024-01-01', '2024-12-31', 20000000);
```
