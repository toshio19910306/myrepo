#!/bin/bash

echo "Setting up test environment..."

echo "1. Setting up PostgreSQL test database..."
export TEST_DATABASE_URL="postgresql://postgres:password@localhost/test_db"

echo "2. Installing backend test dependencies..."
cd src/backend
cargo build

echo "3. Installing frontend test dependencies..."
cd ../frontend
bun install
bunx playwright install

echo "4. Creating test database..."
createdb test_db 2>/dev/null || echo "Test database already exists"

echo "5. Running database migrations for test..."
cd ../backend
sqlx migrate run --database-url $TEST_DATABASE_URL

echo "Test environment setup complete!"
