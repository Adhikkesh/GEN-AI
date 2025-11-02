#!/bin/bash
# STOP on error
set -e

echo "🚀 Starting pnpm workspace deployment for 'auth-service'..."

# --- CONFIG ---
PROJECT_ID="rock-idiom-475618-q4"
FUNCTION_NAME="auth-service"
REGION="us-central1"
DEPLOY_DIR="deploy-temp"
SERVICE_ACCOUNT_EMAIL="ingestion-sa@rock-idiom-475618-q4.iam.gserviceaccount.com"
ENV_FILE_PATH="apps/backend/auth/.env.yaml"
ENV_FILE_NAME=".env.yaml"

# --- 1. Build TypeScript ---
echo "🔨 (1/5) Building 'auth-backend' TypeScript..."
pnpm turbo build --filter=auth-backend

# --- 2. Create Clean Deployment Folder ---
echo "📁 (2/5) Creating clean deployment folder at '$DEPLOY_DIR/auth'..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/auth

# --- 3. Flatten Monorepo Dependencies ---
echo "📦 (3/5) Flattening monorepo dependencies using 'pnpm deploy'..."
pnpm deploy $DEPLOY_DIR/auth --filter=auth-backend --prod

# --- 4. Remove workspace protocol references ---
echo "🔧 (4/5) Fixing workspace protocol in package.json..."
cd $DEPLOY_DIR/auth

# Use Node.js to rewrite workspace:* to actual versions or remove them
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove workspace dependencies or replace with actual versions
if (pkg.dependencies) {
  Object.keys(pkg.dependencies).forEach(dep => {
    if (pkg.dependencies[dep].startsWith('workspace:')) {
      // Option 1: Remove workspace dependencies (they should already be bundled)
      delete pkg.dependencies[dep];
      
      // Option 2: If you need to keep them, replace with a version
      // pkg.dependencies[dep] = pkg.dependencies[dep].replace('workspace:', '');
    }
  });
}

if (pkg.devDependencies) {
  Object.keys(pkg.devDependencies).forEach(dep => {
    if (pkg.devDependencies[dep].startsWith('workspace:')) {
      delete pkg.devDependencies[dep];
    }
  });
}

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "  - Cleaned workspace protocol references"

# --- 5. Copy Configurations ---
echo "📄 (5/5) Copying configurations..."
cd ../.. # Back to root

if [ -f "$ENV_FILE_PATH" ]; then
  cp $ENV_FILE_PATH $DEPLOY_DIR/auth/$ENV_FILE_NAME
  echo "  - Copied $ENV_FILE_NAME"
else
  echo "  - No $ENV_FILE_PATH found, skipping."
fi

# --- 6. Generate production lockfile ---
echo "📋 (6/5) Generating production lockfile..."
cd $DEPLOY_DIR/auth

# Remove old lockfile and regenerate
rm -f pnpm-lock.yaml
pnpm install --prod --frozen-lockfile=false

# --- 7. Deploy to Cloud Functions ---
echo "🌐 (7/5) Deploying '$FUNCTION_NAME' to Cloud Functions (Gen 2)..."

gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --service-account=$SERVICE_ACCOUNT_EMAIL \
  $( [ -f "$ENV_FILE_NAME" ] && echo "--env-vars-file=$ENV_FILE_NAME" )

echo "✅ Deployment successful!"
cd ../.. # Go back to the monorepo root