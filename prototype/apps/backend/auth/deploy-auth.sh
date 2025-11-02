#!/bin/bash
# STOP on error
set -e

echo "🚀 Starting pnpm workspace deployment for 'auth-service'..."

# --- Ensure we're in the monorepo root ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$MONOREPO_ROOT"

echo "📍 Working from monorepo root: $MONOREPO_ROOT"

# --- CONFIG ---
PROJECT_ID="rock-idiom-475618-q4"
FUNCTION_NAME="auth-service"
REGION="us-central1"
DEPLOY_DIR="deploy-temp"
SERVICE_ACCOUNT_EMAIL="auth-sa@rock-idiom-475618-q4.iam.gserviceaccount.com"
ENV_FILE_PATH="apps/backend/auth/.env.yaml"
ENV_FILE_NAME=".env.yaml"

# --- 1. Build TypeScript FIRST (in monorepo context) ---
echo "🔨 (1/6) Building 'auth-backend' TypeScript..."
# Try turbo first, fallback to direct pnpm build
if command -v turbo &> /dev/null; then
  pnpm turbo build --filter=auth-backend
elif [ -f "node_modules/.bin/turbo" ]; then
  pnpm exec turbo build --filter=auth-backend
else
  # Fallback: build directly
  pnpm --filter=auth-backend build
fi

# --- 2. Create Clean Deployment Folder ---
echo "📁 (2/6) Creating clean deployment folder at '$DEPLOY_DIR/auth'..."
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR/auth

# --- 3. Flatten Monorepo Dependencies (production only) ---
echo "📦 (3/6) Flattening monorepo dependencies using 'pnpm deploy'..."
pnpm deploy $DEPLOY_DIR/auth --filter=auth-backend --prod

# --- 4. Copy the BUILT files (dist folder) ---
echo "📋 (4/6) Copying built files..."
cp -r apps/backend/auth/dist $DEPLOY_DIR/auth/

# --- 5. Remove workspace protocol and remove build script ---
echo "🔧 (5/6) Fixing package.json for deployment..."
cd $DEPLOY_DIR/auth

node << 'EOF'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Remove workspace dependencies
if (pkg.dependencies) {
  Object.keys(pkg.dependencies).forEach(dep => {
    if (pkg.dependencies[dep].startsWith('workspace:')) {
      delete pkg.dependencies[dep];
    }
  });
}

if (pkg.devDependencies) {
  // Remove ALL devDependencies since we already built
  delete pkg.devDependencies;
}

// Remove build script since we're deploying pre-built code
if (pkg.scripts && pkg.scripts.build) {
  delete pkg.scripts.build;
}

// Add start script if not present
if (!pkg.scripts) {
  pkg.scripts = {};
}
pkg.scripts.start = 'node dist/index.js';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✓ Fixed package.json');
EOF

# Remove tsconfig.json - not needed for deployment
rm -f tsconfig.json

echo "  - Cleaned workspace protocol references"
echo "  - Removed devDependencies"
echo "  - Removed tsconfig.json (not needed)"

# --- 6. Copy Configurations ---
echo "📄 (6/6) Copying configurations..."
cd "$MONOREPO_ROOT"

if [ -f "$ENV_FILE_PATH" ]; then
  cp $ENV_FILE_PATH $DEPLOY_DIR/auth/$ENV_FILE_NAME
  echo "  - Copied $ENV_FILE_NAME"
else
  echo "  - No $ENV_FILE_PATH found, skipping."
fi

# --- 7. Generate production lockfile (runtime dependencies only) ---
echo "📋 (7/6) Generating production lockfile..."
cd $DEPLOY_DIR/auth

# Remove old lockfile and regenerate with only production deps
rm -f pnpm-lock.yaml
pnpm install --prod --frozen-lockfile=false

# --- 8. Deploy to Cloud Functions ---
echo "🌐 (8/6) Deploying '$FUNCTION_NAME' to Cloud Functions (Gen 2)..."

gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --project=$PROJECT_ID \
  --region=$REGION \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --service-account=$SERVICE_ACCOUNT_EMAIL \
  --entry-point=authService \
  $( [ -f "$ENV_FILE_NAME" ] && echo "--env-vars-file=$ENV_FILE_NAME" )

echo "✅ Deployment successful!"
cd "$MONOREPO_ROOT" # Go back to the monorepo root