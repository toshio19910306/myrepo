#!/bin/bash

echo "Setting up PostgreSQL database..."

sudo apt update
sudo apt install -y postgresql postgresql-contrib

sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql << EOF
CREATE USER estimate_user WITH PASSWORD 'estimate_password';
CREATE DATABASE estimate_request_db OWNER estimate_user;
GRANT ALL PRIVILEGES ON DATABASE estimate_request_db TO estimate_user;
\q
EOF

echo "Database setup completed!"
echo "Database URL: postgresql://estimate_user:estimate_password@localhost/estimate_request_db"
