#!/usr/bin/env python3
"""
M3 Final Script - Applies M3.2 + M3.3 + M3.5 changes cleanly.
Run in Codespace: python3 m3-final.py
"""
import os
import sys

BASE = '/workspaces/Engagesuite'
os.chdir(BASE)

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f'  Created {path}')

def patch_file(path, old, new):
    with open(path, 'r') as f:
        content = f.read()
    if old not in content:
        print(f'  WARNING: Pattern not found in {path}, skipping')
        return False
    content = content.replace(old, new, 1)
    with open(path, 'w') as f:
        f.write(content)
    print(f'  Patched {path}')
    return True

# ================================================================
# M3.2: Class Management Enhancements
# ================================================================
print('='*50)
print('M3.2: Class Management Flow')
print('='*50)

# --- 1. ShareClassModal component ---
print('[1/4] Creating ShareClassModal...')
write_file('components/ShareClassModal.tsx', r"""'use client';

import { useState } from 'react';
import QRCode from './QRCode';

interface ShareClassModalProps {
  classCode: string;
  className: string;
  onClose: () => void;
}

export default function ShareClassModal({ classCode, className, onClose }: ShareClassModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${classCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Share Class Code</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>
        <p className="text-white/60 text-sm mb-6">
          Share this code with students so they can join <span className="text-white font-semibold">{className}</span>.
        </p>
        <div className="bg-black/30 rounded-xl p-6 text-center mb-6 border border-white/5">
          <div className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Class Code</div>
          <div className="text-4xl font-black tracking-[0.3em] text-indigo-400 mb-3">{classCode}</div>
          <button onClick={() => copyToClipboard(classCode, 'code')} className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all">
            {copied === 'code' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
        <div className="flex justify-center mb-6">
          <QRCode value={joinUrl} size={180} />
        </div>
        <p className="text-center text-white/40 text-xs mb-6">Students can scan this QR code to join</p>
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-3 border border-white/5">
          <input type="text" value={joinUrl} readOnly className="flex-1 bg-transparent text-white/70 text-sm outline-none truncate" />
          <button onClick={() => copyToClipboard(joinUrl, 'link')} className="px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium hover:bg-white/20 transition-all whitespace-nowrap">
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 font-medium hover:bg-white/10 transition-all">Close</button>
      </div>
    </div>
  );
}
""")

# --- 2. Patch Host Dashboard ---
print('[2/4] Patching host dashboard...')

# Add import
patch_file('app/dashboard/page.tsx',
    "import HostMenu from '@/components/HostMenu';",
    "import HostMenu from '@/components/HostMenu';\nimport ShareClassModal from '@/components/ShareClassModal';")

# Add state variables
patch_file('app/dashboard/page.tsx',
    "const [error, setError] = useState('');",
    "const [error, setError] = useState('');\n    const [shareClass, setShareClass] = useState<Class | null>(null);\n    const [copiedCode, setCopiedCode] = useState<string | null>(null);")

# Add handler functions before openCreateModal
patch_file('app/dashboard/page.tsx',
    "    const openCreateModal = () => {",
    """    const handleCopyCode = (code: string, e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleShareClass = (cls: Class, e: React.MouseEvent) => {
        e.stopPropagation();
        setShareClass(cls);
    };

    const openCreateModal = () => {""")

# Replace class code display with copy+share buttons
patch_file('app/dashboard/page.tsx',
    """                                    <div className="bg-black/20 p-4 rounded-xl text-center border border-white/5">
                                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">CLASS CODE</div>
                                        <div className="text-2xl font-black tracking-widest text-indigo-400">
                                            {cls.code}
                                        </div>
                                    </div>""",
    """                                    <div className="bg-black/20 p-4 rounded-xl text-center border border-white/5" onClick={(e) => e.stopPropagation()}>
                                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">CLASS CODE</div>
                                        <div className="text-2xl font-black tracking-widest text-indigo-400 mb-2">
                                            {cls.code}
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={(e) => handleCopyCode(cls.code, e)} className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-all">
                                                {copiedCode === cls.code ? 'Copied!' : 'Copy'}
                                            </button>
                                            <button onClick={(e) => handleShareClass(cls, e)} className="px-3 py-1 bg-indigo-500/20 rounded-lg text-xs text-indigo-300 hover:bg-indigo-500/30 transition-all">
                                                Share
                                            </button>
                                        </div>
                                    </div>""")

# Add ShareClassModal before closing </main>
patch_file('app/dashboard/page.tsx',
    "        </main>\n    );\n}",
    """            {/* Share Class Modal */}
            {shareClass && (
                <ShareClassModal
                    classCode={shareClass.code}
                    className={shareClass.name}
                    onClose={() => setShareClass(null)}
                />
            )}
        </main>
    );
}""")

# --- 3. Patch Class Detail Page ---
print('[3/4] Patching class detail page...')

patch_file('app/dashboard/class/page.tsx',
    "import HostMenu from '@/components/HostMenu';",
    "import HostMenu from '@/components/HostMenu';\nimport ShareClassModal from '@/components/ShareClassModal';")

patch_file('app/dashboard/class/page.tsx',
    "const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);",
    "const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);\n    const [showShareModal, setShowShareModal] = useState(false);")

# Add Share button after Back to All Classes button
patch_file('app/dashboard/class/page.tsx',
    """                        <Button variant="glass" onClick={() => router.push('/dashboard')}>
                            \u2190 Back to All Classes
                        </Button>""",
    """                        <Button variant="glass" onClick={() => router.push('/dashboard')}>
                            \u2190 Back to All Classes
                        </Button>
                        <Button variant="glass" onClick={() => setShowShareModal(true)}>
                            Share Code
                        </Button>""")

# Add ShareClassModal before closing main in class detail page
with open('app/dashboard/class/page.tsx', 'r') as f:
    content = f.read()
# Find last </main> and add modal before it
last_main = content.rfind('</main>')
if last_main > 0 and 'ShareClassModal' not in content[last_main-200:last_main]:
    insert = """
                {/* Share Class Modal */}
                {showShareModal && classData && (
                    <ShareClassModal
                        classCode={classData.code}
                        className={classData.name}
                        onClose={() => setShowShareModal(false)}
                    />
                )}
"""
    content = content[:last_main] + insert + content[last_main:]
    with open('app/dashboard/class/page.tsx', 'w') as f:
        f.write(content)
    print('  Added ShareClassModal to class detail page')

# --- 4. Patch Student Dashboard ---
print('[4/4] Patching student dashboard...')

patch_file('app/student/dashboard/page.tsx',
    "import { joinClass, getClass, Class, leaveClass, onClassChange } from '@/lib/classes';",
    "import { joinClass, getClass, Class, leaveClass, onClassChange } from '@/lib/classes';\nimport { collection, query, where, getDocs } from 'firebase/firestore';\nimport { db } from '@/lib/firebase';")

patch_file('app/student/dashboard/page.tsx',
    "const [error, setError] = useState('');",
    "const [error, setError] = useState('');\n    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);")

# Add enrolled classes loader after auth effect
patch_file('app/student/dashboard/page.tsx',
    "    // Separate effect for real-time class subscription",
    """    // Load enrolled classes
    useEffect(() => {
        if (!user) return;
        const loadEnrolledClasses = async () => {
            try {
                const classesRef = collection(db, 'classes');
                const q = query(classesRef, where('memberIds', 'array-contains', user.uid));
                const snapshot = await getDocs(q);
                setEnrolledClasses(snapshot.docs.map(doc => doc.data() as Class));
            } catch (err) {
                console.error('Error loading enrolled classes:', err);
            }
        };
        loadEnrolledClasses();
    }, [user]);

    // Separate effect for real-time class subscription""")

# Add My Classes section before Join a Class card
patch_file('app/student/dashboard/page.tsx',
    '                <Card className="animate-fade-in" style={{ padding: \'3rem\', textAlign: \'center\' }}>',
    """                {/* Enrolled Classes */}
                {enrolledClasses.length > 0 && (
                    <div className="mb-6">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>My Classes</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {enrolledClasses.map((cls) => (
                                <div key={cls.id} onClick={async () => { const cd = await getClass(cls.id); setJoinedClass(cd); }}
                                    className="glass-card glass-card-hover"
                                    style={{ padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{cls.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Code: {cls.code} | {cls.memberIds?.length || 0} members</div>
                                    </div>
                                    <div style={{ color: '#818cf8', fontWeight: '600', fontSize: '0.875rem' }}>Enter &rarr;</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Card className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>""")

# ================================================================
# M3.3: Tool Launch Flow Fixes
# ================================================================
print()
print('='*50)
print('M3.3: Tool Launch Flow Fixes')
print('='*50)

# --- ClassSelector component ---
print('[1/2] Creating ClassSelector...')
write_file('components/ClassSelector.tsx', r"""'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { onAuthStateChange } from '@/lib/auth';
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
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!currentUser) { router.push('/login'); return; }
      try {
        const hostedClasses = await getHostedClasses(currentUser.uid);
        setClasses(hostedClasses);
      } catch (err) { console.error('Error loading classes:', err); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const handleSelectClass = (classId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('classId', classId);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

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
            <button onClick={() => router.push('/dashboard')} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:shadow-lg transition-all">Go to Dashboard</button>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls) => (
              <button key={cls.id} onClick={() => handleSelectClass(cls.id)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-left hover:bg-white/10 hover:border-indigo-500/30 transition-all group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">{cls.name}</div>
                    <div className="text-white/40 text-sm">Code: {cls.code} | {cls.memberIds?.length || 0} students</div>
                  </div>
                  <div className="text-indigo-400 font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">Launch &rarr;</div>
                </div>
              </button>
            ))}
            <div className="text-center pt-4">
              <button onClick={() => router.push('/dashboard')} className="text-white/40 hover:text-white text-sm transition-colors">&larr; Back to Dashboard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
""")

# --- Patch tool pages ---
print('[2/2] Patching tool launch pages...')

TOOL_PATCHES = [
    {
        'file': 'app/host/tickr/launch/page.tsx',
        'tool': 'Tickr', 'icon': '\u23f0',
        'import_after': "import HamburgerMenu from '@/components/HamburgerMenu';",
        'add_before_pattern': "    if (error) {",
    },
    {
        'file': 'app/host/wordstorm/launch/page.tsx',
        'tool': 'WordStorm', 'icon': '🌪️',
        'import_after': "import { onAuthStateChange } from '@/lib/auth';",
        'add_before_pattern': "    return (\n        <div className=\"min-h-screen flex flex-col items-center justify-center text-white\">",
    },
    {
        'file': 'app/host/randomizer/page.tsx',
        'tool': 'Randomizer', 'icon': '🎲',
        'import_after': "import { User } from 'firebase/auth';",
        'add_before_pattern': "    if (loading) {",
    },
    {
        'file': 'app/host/poll/create/page.tsx',
        'tool': 'Live Vote', 'icon': '📊',
        'import_after': "import HostMenu from '@/components/HostMenu';",
        'add_before_pattern': None,  # Special handling
    },
    {
        'file': 'app/host/picpick/launch/page.tsx',
        'tool': 'PicPick', 'icon': '📸',
        'import_after': "import HostMenu from '@/components/HostMenu';",
        'add_before_pattern': None,
    },
    {
        'file': 'app/host/buzzer/launch/page.tsx',
        'tool': 'Buzzer', 'icon': '🔔',
        'import_after': "import { onAuthStateChange } from '@/lib/auth';",
        'add_before_pattern': None,
    },
    {
        'file': 'app/host/commitment/launch/page.tsx',
        'tool': 'Commitment Wall', 'icon': '🎯',
        'import_after': None,
        'add_before_pattern': None,
    },
]

for tool in TOOL_PATCHES:
    filepath = tool['file']
    if not os.path.exists(filepath):
        print(f'  SKIP: {filepath} not found')
        continue

    with open(filepath, 'r') as f:
        content = f.read()

    # Skip if already patched
    if 'ClassSelector' in content:
        print(f'  SKIP: {filepath} already patched')
        continue

    # Add import
    if tool.get('import_after') and tool['import_after'] in content:
        content = content.replace(
            tool['import_after'],
            tool['import_after'] + "\nimport ClassSelector from '@/components/ClassSelector';",
            1
        )
    elif "'use client';" in content:
        # Fallback: add after 'use client'
        content = content.replace(
            "'use client';",
            "'use client';\nimport ClassSelector from '@/components/ClassSelector';",
            1
        )

    # Add classId check
    classid_check = f'\n    if (!classId) {{\n        return <ClassSelector toolName="{tool["tool"]}" toolIcon="{tool["icon"]}" />;\n    }}\n\n'

    if tool.get('add_before_pattern') and tool['add_before_pattern'] in content:
        content = content.replace(tool['add_before_pattern'], classid_check + tool['add_before_pattern'], 1)
    else:
        # Find the main return statement (not inside useEffect/try)
        lines = content.split('\n')
        new_lines = []
        inserted = False
        for i, line in enumerate(lines):
            if not inserted and line.strip().startswith('return (') and i > 20:
                # Check it's not inside a nested function
                prev = '\n'.join(lines[max(0,i-5):i])
                if 'async' not in prev and 'try' not in prev and '=>' not in prev:
                    new_lines.append(f'    if (!classId) {{')
                    new_lines.append(f'        return <ClassSelector toolName="{tool["tool"]}" toolIcon="{tool["icon"]}" />;')
                    new_lines.append(f'    }}')
                    new_lines.append('')
                    inserted = True
            new_lines.append(line)
        if inserted:
            content = '\n'.join(new_lines)

    with open(filepath, 'w') as f:
        f.write(content)
    print(f'  Patched {filepath}')

# Also remove the alert() calls for missing classId
for filepath in ['app/host/wordstorm/launch/page.tsx', 'app/host/poll/create/page.tsx']:
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            content = f.read()
        content = content.replace("alert('Error: No class selected. Please try again from the class dashboard.');", "// ClassSelector handles this")
        content = content.replace("alert('No class selected. Please launch this tool from the Dashboard or a specific Class page.');", "// ClassSelector handles this")
        with open(filepath, 'w') as f:
            f.write(content)

# ================================================================
# M3.5: Mobile Responsiveness & PWA
# ================================================================
print()
print('='*50)
print('M3.5: Mobile Responsiveness & PWA')
print('='*50)

# --- 1. PWA Manifest ---
print('[1/3] Creating PWA manifest...')
write_file('public/manifest.json', """{
  "name": "Trainer-Toolbox",
  "short_name": "Trainer-Toolbox",
  "description": "Interactive Training Tools Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#6366f1",
  "orientation": "any",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
""")

# --- 2. Generate PWA icons ---
print('[2/3] Generating PWA icons...')
os.makedirs('public/icons', exist_ok=True)

# Create simple SVG icon and convert
ICON_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#6366f1"/>
  <text x="256" y="340" font-size="280" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">TT</text>
</svg>"""

write_file('public/icons/icon.svg', ICON_SVG)

# Use Python to create PNG from SVG (simple approach - create placeholder PNGs)
try:
    import subprocess
    # Try using rsvg-convert if available
    subprocess.run(['rsvg-convert', '-w', '192', '-h', '192', 'public/icons/icon.svg', '-o', 'public/icons/icon-192.png'], capture_output=True)
    subprocess.run(['rsvg-convert', '-w', '512', '-h', '512', 'public/icons/icon.svg', '-o', 'public/icons/icon-512.png'], capture_output=True)
    if os.path.exists('public/icons/icon-192.png'):
        print('  Generated PNG icons from SVG')
    else:
        raise Exception('rsvg not available')
except:
    # Create minimal valid PNGs using Python
    print('  SVG converter not available, creating placeholder icons')
    # Just copy the SVG as a fallback - browsers handle SVG icons too
    write_file('public/icons/icon-192.png', '')  # placeholder
    write_file('public/icons/icon-512.png', '')  # placeholder
    print('  NOTE: Replace public/icons/icon-192.png and icon-512.png with real PNG icons')

# --- 3. Service Worker ---
print('[3/3] Creating service worker + meta tags...')
write_file('public/sw.js', """// Service Worker for Trainer-Toolbox PWA
const CACHE_NAME = 'trainer-toolbox-v1';

// Install - cache shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
""")

# Add PWA meta tags and SW registration to layout.tsx
patch_file('app/layout.tsx',
    '<head>',
    """<head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />""")

# If <head> not found, try adding after <html>
if '<head>' not in open('app/layout.tsx').read():
    print('  NOTE: Could not find <head> tag in layout.tsx - add PWA meta tags manually')

# Add SW registration
patch_file('app/layout.tsx',
    '</body>',
    """<script dangerouslySetInnerHTML={{__html: `
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
          });
        }
      `}} />
      </body>""")

# --- 4. Add mobile-friendly CSS ---
print('  Adding mobile CSS...')
with open('app/globals.css', 'r') as f:
    css = f.read()

if '@media (max-width: 640px)' not in css or 'touch-action' not in css:
    css += """

/* M3.5: Mobile Responsiveness */
@media (max-width: 640px) {
  .container { padding-left: 1rem; padding-right: 1rem; }
  h1 { font-size: 1.5rem !important; }
  h2 { font-size: 1.25rem !important; }

  /* Ensure tap targets are at least 44px */
  button, a, input, select, textarea {
    min-height: 44px;
  }

  /* Fix tables on mobile */
  table { font-size: 0.875rem; }
  th, td { padding: 0.5rem; }
}

/* Smooth scrolling */
html { scroll-behavior: smooth; }

/* Touch optimizations */
* { -webkit-tap-highlight-color: transparent; touch-action: manipulation; }

/* Safe area for notched phones */
body {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
"""
    with open('app/globals.css', 'w') as f:
        f.write(css)
    print('  Updated globals.css with mobile styles')

# ================================================================
# Fix firebase.ts (remove broken persistence)
# ================================================================
print()
print('='*50)
print('Fixing firebase.ts (remove broken persistence)')
print('='*50)

write_file('lib/firebase.ts', """// Firebase Configuration
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://demo-project-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

let app: FirebaseApp;
let db: Firestore;
let realtimeDb: Database;
let storage: FirebaseStorage;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
} else {
    app = getApps()[0];
    db = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
    auth = getAuth(app);
}

export { app, db, realtimeDb, storage, auth };
""")

# ================================================================
# Done
# ================================================================
print()
print('='*50)
print('ALL DONE! Now run:')
print('='*50)
print('  npm run build')
print('  git add . && git commit -m "M3.2+M3.3+M3.5: Class sharing, tool fixes, PWA" && git push')
print('  firebase deploy --only hosting,firestore:rules')
print()
