#!/bin/bash

set -e

echo "Starting deployment process..."

RESOURCE_GROUP="Devin-test"
LOCATION="japanwest"
APP_NAME="estimate-app-$(date +%s)"
POSTGRES_PASSWORD="EstimateApp2024!"

echo "Using resource group: $RESOURCE_GROUP"
echo "Using location: $LOCATION"
echo "Using app name: $APP_NAME"

echo "Logging in to Azure with service principal..."
az login --service-principal \
  --username "c7bfba26-e1c7-4e60-86c5-5344eb65e6d5" \
  --password "${Devin_test_app_Secret_SECRET_VALUE}" \
  --tenant "d0000d8b-2d8b-4472-bbe0-766e72c3612b"

echo "Setting subscription..."
az account set --subscription "b9237209-38a6-4aa4-8199-cdceceb61c20"

echo "Deploying infrastructure with Bicep..."
az deployment group create \
  --resource-group $RESOURCE_GROUP \
  --template-file bicep/main.bicep \
  --parameters appName=$APP_NAME postgresAdminPassword=$POSTGRES_PASSWORD

WEB_APP_URL=$(az deployment group show \
  --resource-group $RESOURCE_GROUP \
  --name main \
  --query properties.outputs.webAppUrl.value \
  --output tsv)

echo "Web app URL: $WEB_APP_URL"

echo "Building application..."
cd src/frontend
npm install
npm run build

cd ../backend
cargo build --release

cd ../..
mkdir -p deploy
cp -r src/frontend/out/* deploy/
cp -r src/backend/target/release/* deploy/
cp src/backend/Cargo.toml deploy/

echo "Deploying application..."
cd deploy
zip -r ../app.zip .
cd ..

az webapp deployment source config-zip \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --src app.zip

echo "Restarting web app..."
az webapp restart \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME

echo "Deployment completed successfully!"
echo "Application URL: $WEB_APP_URL"
