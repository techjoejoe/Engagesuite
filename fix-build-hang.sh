#!/bin/bash

# BUILD HANG RESOLUTION SCRIPT
# Fixes React 19 + Next 16 incompatibility + clears corrupted build cache

set -e

echo "🔧 Starting Build Hang Fix..."
echo "================================================"

# Step 1: Kill existing processes
echo "📌 Step 1/6: Killing existing Node processes..."
lsof -t -i:3000 | xargs kill -9 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
sleep 2

# Step 2: Clean corrupted build artifacts
echo "📌 Step 2/6: Removing corrupted build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf out
rm -rf .turbo
rm -f tsconfig.tsbuildinfo
echo "   ✓ Cleaned .next, caches, and build info"

# Step 3: Backup current configs
echo "📌 Step 3/6: Backing up current configurations..."
cp package.json package.json.backup
cp tsconfig.json tsconfig.json.backup
echo "   ✓ Backups created (package.json.backup, tsconfig.json.backup)"

# Step 4: Remove node_modules (nuclear option)
echo "📌 Step 4/6: Removing node_modules for clean install..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml
echo "   ✓ node_modules and lock files removed"

# Step 5: Apply fixes (copy fixed configs from Claude's output)
echo "📌 Step 5/6: Applying dependency fixes..."
echo "   ⚠️  MANUAL STEP REQUIRED:"
echo "   1. Replace package.json with the fixed version from Claude"
echo "   2. Replace tsconfig.json with the fixed version from Claude"
echo "   3. Press ENTER to continue installation..."
read -p ""

# Step 6: Fresh install
echo "📌 Step 6/6: Installing dependencies (this may take 2-3 minutes)..."
npm install

echo ""
echo "================================================"
echo "✅ Build hang fix complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run: npm run build"
echo "   2. If build succeeds, test with: npm run dev"
echo "   3. If still hangs, check for circular deps:"
echo "      npx madge --circular --extensions ts,tsx ./app"
echo ""
echo "📊 Key Changes Applied:"
echo "   • React 19.2.0 → 18.3.1 (stable)"
echo "   • Next 16.0.8 → 15.1.6 (stable)"
echo "   • Firebase 12.6.0 → 11.1.0 (compatible)"
echo "   • Node engine: 24 → 20-24 (flexible)"
echo "   • Disabled incremental TypeScript builds"
echo "   • Added memory limit to build script"
echo "   • Changed JSX transform: react-jsx → preserve"
echo ""
