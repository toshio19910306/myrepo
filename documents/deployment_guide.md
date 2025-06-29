# Deployment Guide - 見積依頼システム

## Overview
This document describes the deployment process for the Estimate Request System to Azure.

## Architecture
- Frontend: Next.js 15 deployed to Azure Static Web Apps
- Backend: Rust (Axum) deployed to Azure Web Apps with Docker
- Database: Azure Database for PostgreSQL Flexible Server
- Storage: Local file system (can be extended to Azure Blob Storage)

## Prerequisites
- Azure CLI installed and configured
- Service Principal credentials
- Resource Group: Devin-test
- Region: japanwest

## Deployment Steps

### 1. Infrastructure Deployment
```bash
# Deploy Bicep template
az deployment group create \
  --resource-group Devin-test \
  --template-file bicep/main.bicep \
  --parameters postgresAdminPassword="EstimateApp2024!"
```

### 2. Backend Deployment
- Build Docker image for Rust backend
- Deploy to Azure Web Apps
- Configure environment variables

### 3. Frontend Deployment
- Build Next.js application for static export
- Deploy to Azure Static Web Apps
- Configure API URL to point to backend

### 4. Database Setup
- Run migrations on Azure PostgreSQL
- Configure connection strings
- Set up initial admin user

## Environment Variables

### Backend
- `DATABASE_URL`: Azure PostgreSQL connection string
- `JWT_SECRET`: JWT signing secret
- `CORS_ORIGINS`: Allowed frontend origins
- `ENVIRONMENT`: Set to 'production'

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_ENVIRONMENT`: Set to 'production'

## Post-Deployment Testing
- Test application functionality
- Verify database connectivity
- Check API endpoints
- Validate user workflows

## URLs
- Frontend: https://{app-name}-frontend.azurestaticapps.net
- Backend: https://{app-name}-backend.azurewebsites.net
