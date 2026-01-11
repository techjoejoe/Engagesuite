#!/bin/bash
# Check for conflicting dynamic route parameters

echo "🔍 Checking for route parameter conflicts..."

# Find all dynamic route directories at the same level
conflicts=$(find app -type d -name '\[*\]' | 
  awk -F'/' '{
    path=""
    for(i=1; i<NF; i++) path=path"/"$i
    print path, $NF
  }' | 
  sort | 
  awk '{
    if (prev_path == $1 && prev_param != $2) {
      print "❌ CONFLICT at " $1 ":"
      print "   - " prev_param
      print "   - " $2
      exit 1
    }
    prev_path=$1
    prev_param=$2
  }'
)

if [ $? -eq 0 ]; then
  echo "✅ No route conflicts detected"
  exit 0
else
  echo "$conflicts"
  echo ""
  echo "⚠️  Fix: Use the same parameter name for sibling routes"
  echo "📖 See .agent/ROUTING_CONVENTIONS.md for details"
  exit 1
fi
