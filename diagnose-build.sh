#!/bin/bash

# BUILD DIAGNOSTICS SCRIPT
# Run this AFTER fixing dependencies to verify resolution

echo "🔍 Running Build Diagnostics..."
echo "================================================"

# Check 1: Circular Dependencies
echo "📌 Check 1/5: Scanning for circular dependencies..."
if command -v madge &> /dev/null; then
    madge --circular --extensions ts,tsx ./app > circular-deps.txt 2>&1
    if [ $? -eq 0 ]; then
        echo "   ✓ No circular dependencies found"
    else
        echo "   ⚠️  Circular dependencies detected (see circular-deps.txt)"
        cat circular-deps.txt
    fi
else
    echo "   ℹ️  Installing madge for dependency analysis..."
    npm install -g madge
    madge --circular --extensions ts,tsx ./app
fi

# Check 2: TypeScript Configuration
echo ""
echo "📌 Check 2/5: Validating TypeScript configuration..."
if grep -q '"incremental": true' tsconfig.json; then
    echo "   ⚠️  WARNING: Incremental builds enabled (can cause cache corruption)"
    echo "   Recommendation: Set 'incremental: false' in tsconfig.json"
else
    echo "   ✓ Incremental builds disabled"
fi

if grep -q '"jsx": "react-jsx"' tsconfig.json; then
    echo "   ⚠️  WARNING: Using react-jsx transform with Next.js"
    echo "   Recommendation: Change to 'jsx: preserve' for Next.js"
else
    echo "   ✓ JSX transform configured correctly"
fi

# Check 3: React/Next Version Compatibility
echo ""
echo "📌 Check 3/5: Checking React/Next.js version compatibility..."
REACT_VERSION=$(node -p "require('./package.json').dependencies.react" 2>/dev/null)
NEXT_VERSION=$(node -p "require('./package.json').dependencies.next" 2>/dev/null)

echo "   React version: $REACT_VERSION"
echo "   Next.js version: $NEXT_VERSION"

if [[ $REACT_VERSION == *"19"* ]]; then
    echo "   ⚠️  React 19 detected - may cause build issues"
    echo "   Recommendation: Downgrade to React 18.3.1"
elif [[ $REACT_VERSION == *"18"* ]]; then
    echo "   ✓ React 18 (stable and compatible)"
fi

# Check 4: Node Memory Configuration
echo ""
echo "📌 Check 4/5: Checking Node.js memory settings..."
if grep -q "NODE_OPTIONS.*max-old-space-size" package.json; then
    MEMORY=$(grep -o "max-old-space-size=[0-9]*" package.json | cut -d= -f2)
    echo "   ✓ Memory limit configured: ${MEMORY}MB"
else
    echo "   ⚠️  No memory limit set in build script"
    echo "   Recommendation: Add NODE_OPTIONS='--max-old-space-size=4096' to build script"
fi

# Check 5: Build Output
echo ""
echo "📌 Check 5/5: Testing build process (dry run)..."
echo "   Running: NODE_OPTIONS='--max-old-space-size=4096' next build --dry-run"
timeout 30s node --max-old-space-size=4096 ./node_modules/.bin/next build --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✓ Next.js executable responding"
else
    echo "   ⚠️  Next.js not responding (may indicate deeper issue)"
fi

echo ""
echo "================================================"
echo "✅ Diagnostics complete!"
echo ""
echo "Summary of issues found above. Review warnings and apply recommendations."
echo ""
