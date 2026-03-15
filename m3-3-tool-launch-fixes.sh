#!/bin/bash
# ================================================================
# M3.3: Tool Launch Flow Fixes
# Run in Codespace: bash m3-3-tool-launch-fixes.sh
# ================================================================

set -e
cd /workspaces/Engagesuite

echo "=========================================="
echo "M3.3: Tool Launch Flow Fixes"
echo "=========================================="

# ------------------------------------------------
# 1. CREATE ClassSelector component
# ------------------------------------------------
echo "[1/2] Creating ClassSelector component..."

cat > components/ClassSelector.tsx << 'CSEOF'
'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { getHostedClasses, Class } from '@/lib/classes';
import { User } from 'firebase/auth';

interface ClassSelectorProps {
  toolName: string;
  toolIcon: string;
}

export default function ClassSelector({ toolName, toolIcon }: ClassSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      try {
        const hostedClasses = await getHostedClasses(currentUser.uid);
        setClasses(hostedClasses);
      } catch (err) {
        console.error('Error loading classes:', err);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSelectClass = (classId: string) => {
    // Build URL with classId param
    const params = new URLSearchParams(searchParams.toString());
    params.set('classId', classId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{toolIcon}</div>
          <h1 className="text-2xl font-bold text-white mb-2">Launch {toolName}</h1>
          <p className="text-white/50">Select a class to use {toolName} with</p>
        </div>

        {classes.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-lg font-bold text-white mb-2">No Classes Yet</h3>
            <p className="text-white/50 text-sm mb-6">Create a class first before launching tools.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => handleSelectClass(cls.id)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{cls.name}</div>
                    <div className="text-white/40 text-sm">Code: {cls.code} | {cls.memberIds?.length || 0} students</div>
                  </div>
                  <div className="text-indigo-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    Launch →
                  </div>
                </div>
              </button>
            ))}

            <div className="text-center pt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
CSEOF

echo "  Created components/ClassSelector.tsx"

# ------------------------------------------------
# 2. UPDATE tool pages to show ClassSelector
# ------------------------------------------------
echo "[2/2] Updating tool launch pages..."

# === TICKR ===
echo "  Fixing Tickr..."
# Replace the error display with ClassSelector
sed -i "s/import HamburgerMenu from '@\/components\/HamburgerMenu';/import HamburgerMenu from '@\/components\/HamburgerMenu';\nimport ClassSelector from '@\/components\/ClassSelector';/" app/host/tickr/launch/page.tsx

# Replace the error block to show ClassSelector when no classId
sed -i '/if (error) {/,/^    }/c\
    if (!classId) {\
        return <ClassSelector toolName="Tickr" toolIcon="⏰" />;\
    }\
\
    if (error) {\
        return (\
            <div className="min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">\
                <HamburgerMenu currentPage="Tickr" />\
                <div className="text-[#F472B6] text-6xl mb-4">⚠️</div>\
                <h1 className="text-2xl font-bold mb-2">Launch Failed</h1>\
                <p className="text-[#94A3B8] mb-6">{error}</p>\
                <button onClick={() => router.push('"'"'/dashboard'"'"')} className="px-6 py-3 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-xl font-bold hover:opacity-90 transition-all">Return to Dashboard</button>\
            </div>\
        );\
    }' app/host/tickr/launch/page.tsx

# === WORDSTORM ===
echo "  Fixing WordStorm..."
sed -i "s/import { onAuthStateChange } from '@\/lib\/auth';/import { onAuthStateChange } from '@\/lib\/auth';\nimport ClassSelector from '@\/components\/ClassSelector';/" app/host/wordstorm/launch/page.tsx

# Replace the alert with proper handling
sed -i "s/alert('Error: No class selected. Please try again from the class dashboard.');//" app/host/wordstorm/launch/page.tsx

# Add ClassSelector render check before the main return
# Find the return statement and add classId check before it
sed -i '/return (/i\
    if (!classId) {\
        return <ClassSelector toolName="WordStorm" toolIcon="🌪️" />;\
    }\
' app/host/wordstorm/launch/page.tsx

# === BUZZER ===
echo "  Fixing Buzzer..."
sed -i "1,5{/import/a\\
import ClassSelector from '@/components/ClassSelector';
}" app/host/buzzer/launch/page.tsx

# Find first return and add classId check
cat > /tmp/fix_buzzer.py << 'PYEOF'
import re

with open('app/host/buzzer/launch/page.tsx', 'r') as f:
    content = f.read()

# Add import if not present
if 'ClassSelector' not in content:
    content = content.replace(
        "import { onAuthStateChange } from '@/lib/auth';",
        "import { onAuthStateChange } from '@/lib/auth';\nimport ClassSelector from '@/components/ClassSelector';"
    )

# Find the first 'return (' after the function definition and add classId check before it
# We need to add it after the useEffect blocks but before the main JSX return
lines = content.split('\n')
new_lines = []
found_return = False
in_function = False

for i, line in enumerate(lines):
    # Track if we're in the main component function
    if 'function' in line and 'BuzzerContent' in line or 'function' in line and 'BuzzerLaunch' in line:
        in_function = True

    # Find the first top-level return that renders JSX (not inside useEffect)
    if in_function and not found_return and line.strip().startswith('return ('):
        # Check if previous lines are not inside a useEffect
        prev_lines = '\n'.join(lines[max(0,i-3):i])
        if 'useEffect' not in prev_lines and 'try' not in prev_lines:
            new_lines.append('    if (!classId) {')
            new_lines.append('        return <ClassSelector toolName="Buzzer" toolIcon="🔔" />;')
            new_lines.append('    }')
            new_lines.append('')
            found_return = True

    new_lines.append(line)

with open('app/host/buzzer/launch/page.tsx', 'w') as f:
    f.write('\n'.join(new_lines))

print('Fixed buzzer')
PYEOF
python3 /tmp/fix_buzzer.py

# === RANDOMIZER ===
echo "  Fixing Randomizer..."
sed -i "s/import { User } from 'firebase\/auth';/import { User } from 'firebase\/auth';\nimport ClassSelector from '@\/components\/ClassSelector';/" app/host/randomizer/page.tsx

# Add classId check before the main JSX
cat > /tmp/fix_randomizer.py << 'PYEOF'
with open('app/host/randomizer/page.tsx', 'r') as f:
    content = f.read()

# Find "if (!classData) return null;" or the main return and add classId check before it
# The randomizer shows blank when no classId because the useEffects return early
# We need to add a check that renders ClassSelector

# Find the pattern where it checks for loading and classData
old = "    if (loading) {"
new = """    if (!classId) {
        return <ClassSelector toolName="Randomizer" toolIcon="🎲" />;
    }

    if (loading) {"""

content = content.replace(old, new, 1)

with open('app/host/randomizer/page.tsx', 'w') as f:
    f.write(content)

print('Fixed randomizer')
PYEOF
python3 /tmp/fix_randomizer.py

# === POLL CREATE ===
echo "  Fixing Poll Create..."
sed -i "s/import HostMenu from '@\/components\/HostMenu';/import HostMenu from '@\/components\/HostMenu';\nimport ClassSelector from '@\/components\/ClassSelector';/" app/host/poll/create/page.tsx

# Replace the alert with proper return
sed -i "s/alert('No class selected. Please launch this tool from the Dashboard or a specific Class page.');//" app/host/poll/create/page.tsx

# Add classId check before the main return
cat > /tmp/fix_poll.py << 'PYEOF'
with open('app/host/poll/create/page.tsx', 'r') as f:
    content = f.read()

# Find the main return with JSX
# Add check before the first "return (" that has JSX content (not inside useEffect)
lines = content.split('\n')
new_lines = []
found = False

for i, line in enumerate(lines):
    if not found and '    return (' in line and i > 20:
        # Check context - should be at component level, not inside a function
        prev = '\n'.join(lines[max(0,i-5):i])
        if 'async' not in prev and 'try' not in prev and 'useEffect' not in prev:
            new_lines.append('    if (!classId) {')
            new_lines.append('        return <ClassSelector toolName="Live Vote" toolIcon="📊" />;')
            new_lines.append('    }')
            new_lines.append('')
            found = True
    new_lines.append(line)

with open('app/host/poll/create/page.tsx', 'w') as f:
    f.write('\n'.join(new_lines))

print('Fixed poll')
PYEOF
python3 /tmp/fix_poll.py

# === PICPICK ===
echo "  Fixing PicPick..."
sed -i "s/import HostMenu from '@\/components\/HostMenu';/import HostMenu from '@\/components\/HostMenu';\nimport ClassSelector from '@\/components\/ClassSelector';/" app/host/picpick/launch/page.tsx

cat > /tmp/fix_picpick.py << 'PYEOF'
with open('app/host/picpick/launch/page.tsx', 'r') as f:
    content = f.read()

# Find main return
lines = content.split('\n')
new_lines = []
found = False

for i, line in enumerate(lines):
    if not found and '    return (' in line and i > 30:
        prev = '\n'.join(lines[max(0,i-5):i])
        if 'async' not in prev and 'try' not in prev:
            new_lines.append('    if (!classId) {')
            new_lines.append('        return <ClassSelector toolName="PicPick" toolIcon="📸" />;')
            new_lines.append('    }')
            new_lines.append('')
            found = True
    new_lines.append(line)

with open('app/host/picpick/launch/page.tsx', 'w') as f:
    f.write('\n'.join(new_lines))

print('Fixed picpick')
PYEOF
python3 /tmp/fix_picpick.py

# === COMMITMENT ===
echo "  Fixing Commitment..."
sed -i "2a\\import ClassSelector from '@/components/ClassSelector';" app/host/commitment/launch/page.tsx

cat > /tmp/fix_commitment.py << 'PYEOF'
with open('app/host/commitment/launch/page.tsx', 'r') as f:
    content = f.read()

# Add import if not already there
if 'ClassSelector' not in content:
    content = content.replace(
        "import { useEffect",
        "import ClassSelector from '@/components/ClassSelector';\nimport { useEffect"
    )

lines = content.split('\n')
new_lines = []
found = False

for i, line in enumerate(lines):
    if not found and '    return (' in line and i > 20:
        prev = '\n'.join(lines[max(0,i-5):i])
        if 'async' not in prev and 'try' not in prev:
            new_lines.append('    if (!classId) {')
            new_lines.append('        return <ClassSelector toolName="Commitment Wall" toolIcon="🎯" />;')
            new_lines.append('    }')
            new_lines.append('')
            found = True
    new_lines.append(line)

with open('app/host/commitment/launch/page.tsx', 'w') as f:
    f.write('\n'.join(new_lines))

print('Fixed commitment')
PYEOF
python3 /tmp/fix_commitment.py

echo "  All tool pages updated"

# ------------------------------------------------
# BUILD VERIFICATION
# ------------------------------------------------
echo ""
echo "=========================================="
echo "Building to verify..."
echo "=========================================="

npm run build 2>&1 | tail -15

echo ""
echo "=========================================="
echo "M3.3 COMPLETE! Files changed:"
echo "=========================================="
echo "  NEW:      components/ClassSelector.tsx"
echo "  MODIFIED: app/host/tickr/launch/page.tsx"
echo "  MODIFIED: app/host/wordstorm/launch/page.tsx"
echo "  MODIFIED: app/host/buzzer/launch/page.tsx"
echo "  MODIFIED: app/host/randomizer/page.tsx"
echo "  MODIFIED: app/host/poll/create/page.tsx"
echo "  MODIFIED: app/host/picpick/launch/page.tsx"
echo "  MODIFIED: app/host/commitment/launch/page.tsx"
echo ""
echo "NEXT STEPS:"
echo "  1. git add . && git commit -m 'M3.3: Tool launch fixes - ClassSelector for missing classId' && git push"
echo "  2. firebase deploy --only hosting"
echo "  3. Test: Navigate directly to /host/tickr/launch (no classId) - should show class picker"
echo "  4. Test: Select a class - should launch tool normally"
echo "=========================================="
