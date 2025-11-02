#!/bin/bash

# STOP on error
set -e

echo "🚀 Starting pnpm workspace deployment for 'ingestion'..."

# --- CONFIG ---
GCP_REGION="us-central1"
SERVICE_ACCOUNT_EMAIL="ingestion-sa@rock-idiom-475618-q4.iam.gserviceaccount.com"
DEPLOY_DIR=".deploy"
TOPIC_NAME="run-ingestion"
ENV_FILE=".env.yaml" # Make sure this file exists!

# --- SCRIPT ---

echo "🔨 (1/5) Building TypeScript..."
pnpm build

echo "📁 (2/5) Creating clean deployment folder '$DEPLOY_DIR'..."
rm -rf $DEPLOY_DIR
mkdir $DEPLOY_DIR

echo "📦 (3/5) Copying compiled code..."
cp -r dist/* $DEPLOY_DIR/

echo "📄 (4/5) Copying configurations..."
cp $ENV_FILE $DEPLOY_DIR/
cp package.deploy.json $DEPLOY_DIR/package.json

echo "🌐 (5/5) Deploying to Cloud Functions..."
cd $DEPLOY_DIR

gcloud pubsub topics create $TOPIC_NAME --quiet 2>/dev/null || echo "Topic '$TOPIC_NAME' already exists."

# Deploy HTTP Trigger
gcloud functions deploy ingestTrigger \
  --gen2 \
  --runtime=nodejs20 \
  --region=$GCP_REGION \
  --source=. \
  --entry-point=ingestTrigger \
  --trigger-http \
  --allow-unauthenticated \
  --timeout=60s \
  --memory=512MB \
  --env-vars-file=$ENV_FILE \
  --service-account=$SERVICE_ACCOUNT_EMAIL

# Deploy Pub/Sub Worker
gcloud functions deploy ingestionWorker \
  --gen2 \
  --runtime=nodejs20 \
  --region=$GCP_REGION \
  --source=. \
  --entry-point=ingestionWorker \
  --trigger-topic=$TOPIC_NAME \
  --timeout=540s \
  --memory=2GB \
  --max-instances=1 \
  --env-vars-file=$ENV_FILE \
  --service-account=$SERVICE_ACCOUNT_EMAIL

echo "✅ Deployment successful!"
cd ..