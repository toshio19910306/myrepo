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
