#!/bin/bash
# ================================================================
# M3.2: Class Management Flow Enhancements
# Run in Codespace: bash m3-2-class-management.sh
# ================================================================

set -e
cd /workspaces/Engagesuite

echo "=========================================="
echo "M3.2: Class Management Flow"
echo "=========================================="

# ------------------------------------------------
# 1. CREATE ShareClassModal component
# ------------------------------------------------
echo "[1/4] Creating ShareClassModal component..."

cat > components/ShareClassModal.tsx << 'SHAREEOF'
'use client';

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

        {/* Big Code Display */}
        <div className="bg-black/30 rounded-xl p-6 text-center mb-6 border border-white/5">
          <div className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Class Code</div>
          <div className="text-4xl font-black tracking-[0.3em] text-indigo-400 mb-3">{classCode}</div>
          <button
            onClick={() => copyToClipboard(classCode, 'code')}
            className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
          >
            {copied === 'code' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <QRCode value={joinUrl} size={180} />
        </div>
        <p className="text-center text-white/40 text-xs mb-6">Students can scan this QR code to join</p>

        {/* Copy Link */}
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-3 border border-white/5">
          <input
            type="text"
            value={joinUrl}
            readOnly
            className="flex-1 bg-transparent text-white/70 text-sm outline-none truncate"
          />
          <button
            onClick={() => copyToClipboard(joinUrl, 'link')}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium hover:bg-white/20 transition-all whitespace-nowrap"
          >
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 font-medium hover:bg-white/10 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
SHAREEOF

echo "  Created components/ShareClassModal.tsx"

# ------------------------------------------------
# 2. ADD Share button + Copy code to HOST DASHBOARD class cards
# ------------------------------------------------
echo "[2/4] Adding share/copy to host dashboard..."

# Add import for ShareClassModal
sed -i "s/import HostMenu from '@\/components\/HostMenu';/import HostMenu from '@\/components\/HostMenu';\nimport ShareClassModal from '@\/components\/ShareClassModal';/" app/dashboard/page.tsx

# Add share modal state after the error state
sed -i "s/const \[error, setError\] = useState('');/const [error, setError] = useState('');\n    const [shareClass, setShareClass] = useState<Class | null>(null);\n    const [copiedCode, setCopiedCode] = useState<string | null>(null);/" app/dashboard/page.tsx

# Add copy code handler function after resetForm
sed -i '/const openCreateModal = () => {/i\
    const handleCopyCode = (code: string, e: React.MouseEvent) => {\
        e.stopPropagation();\
        navigator.clipboard.writeText(code);\
        setCopiedCode(code);\
        setTimeout(() => setCopiedCode(null), 2000);\
    };\
\
    const handleShareClass = (cls: Class, e: React.MouseEvent) => {\
        e.stopPropagation();\
        setShareClass(cls);\
    };\
' app/dashboard/page.tsx

# Replace the class code display with copy + share buttons
sed -i 's|<div className="bg-black/20 p-4 rounded-xl text-center border border-white/5">|<div className="bg-black/20 p-4 rounded-xl text-center border border-white/5" onClick={(e) => e.stopPropagation()}>|' app/dashboard/page.tsx

# Replace the class code block entirely
sed -i '/<div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">CLASS CODE<\/div>/,/<\/div>\n                                    <\/div>/c\
                                        <div className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider">CLASS CODE</div>\
                                        <div className="text-2xl font-black tracking-widest text-indigo-400 mb-2">\
                                            {cls.code}\
                                        </div>\
                                        <div className="flex gap-2 justify-center">\
                                            <button onClick={(e) => handleCopyCode(cls.code, e)} className="px-3 py-1 bg-white/10 rounded-lg text-xs text-white/70 hover:bg-white/20 transition-all">\
                                                {copiedCode === cls.code ? "Copied!" : "Copy"}\
                                            </button>\
                                            <button onClick={(e) => handleShareClass(cls, e)} className="px-3 py-1 bg-indigo-500/20 rounded-lg text-xs text-indigo-300 hover:bg-indigo-500/30 transition-all">\
                                                Share\
                                            </button>\
                                        </div>' app/dashboard/page.tsx

# Add ShareClassModal render before closing </main>
sed -i '/<\/main>/i\
\
            {/* Share Class Modal */}\
            {shareClass && (\
                <ShareClassModal\
                    classCode={shareClass.code}\
                    className={shareClass.name}\
                    onClose={() => setShareClass(null)}\
                />\
            )}' app/dashboard/page.tsx

echo "  Updated app/dashboard/page.tsx with copy + share"

# ------------------------------------------------
# 3. ADD Share button to CLASS DETAIL page
# ------------------------------------------------
echo "[3/4] Adding share button to class detail page..."

# Add import for ShareClassModal at top of file
sed -i "s/import HostMenu from '@\/components\/HostMenu';/import HostMenu from '@\/components\/HostMenu';\nimport ShareClassModal from '@\/components\/ShareClassModal';/" app/dashboard/class/page.tsx

# Add state for share modal (after showAssignModal state)
sed -i 's/const \[activeAssignments, setActiveAssignments\] = useState<ClassAlbum\[\]>(\[\]);/const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);\n    const [showShareModal, setShowShareModal] = useState(false);/' app/dashboard/class/page.tsx

# Add Share button next to the class code badge
sed -i 's|<span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30">|<button onClick={() => setShowShareModal(true)} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30 hover:bg-blue-500/30 transition-all cursor-pointer flex items-center gap-1">|' app/dashboard/class/page.tsx

# Change closing span to button and add share icon
sed -i 's|{classData.code}\n                            </span>|{classData.code} \x26#x1F517;\n                            </button>|' app/dashboard/class/page.tsx

# Actually, let me use a simpler approach - add a Share button after the existing buttons
sed -i '/<Button variant="glass" onClick={() => router.push('"'"'\/dashboard'"'"')}/a\
                        <Button variant="glass" onClick={() => setShowShareModal(true)}>\
                            \xF0\x9F\x94\x97 Share Code\
                        </Button>' app/dashboard/class/page.tsx

# Add ShareClassModal before closing </main> in the class page
# Find the last </main> and add before it
sed -i '/<\/main>/{
/ShareClassModal/!i\
\
                {/* Share Class Modal */}\
                {showShareModal && classData && (\
                    <ShareClassModal\
                        classCode={classData.code}\
                        className={classData.name}\
                        onClose={() => setShowShareModal(false)}\
                    />\
                )}
}' app/dashboard/class/page.tsx

echo "  Updated app/dashboard/class/page.tsx with share modal"

# ------------------------------------------------
# 4. ENHANCE Student Dashboard - show enrolled classes
# ------------------------------------------------
echo "[4/4] Enhancing student dashboard with enrolled classes..."

# Add getClassMembers and related imports
sed -i "s/import { joinClass, getClass, Class, leaveClass, onClassChange } from '@\/lib\/classes';/import { joinClass, getClass, Class, leaveClass, onClassChange, getClassByCode } from '@\/lib\/classes';\nimport { collection, query, where, getDocs } from 'firebase\/firestore';\nimport { db } from '@\/lib\/firebase';/" app/student/dashboard/page.tsx

# Add state for enrolled classes list
sed -i "s/const \[error, setError\] = useState('');/const [error, setError] = useState('');\n    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);/" app/student/dashboard/page.tsx

# Add function to load enrolled classes after the auth effect
sed -i '/\/\/ Separate effect for real-time class subscription/i\
    // Load all classes the student is enrolled in\
    useEffect(() => {\
        if (!user) return;\
        const loadEnrolledClasses = async () => {\
            try {\
                const classesRef = collection(db, '"'"'classes'"'"');\
                const q = query(classesRef, where('"'"'memberIds'"'"', '"'"'array-contains'"'"', user.uid));\
                const snapshot = await getDocs(q);\
                const classes = snapshot.docs.map(doc => doc.data() as Class);\
                setEnrolledClasses(classes);\
            } catch (err) {\
                console.error('"'"'Error loading enrolled classes:'"'"', err);\
            }\
        };\
        loadEnrolledClasses();\
    }, [user]);\
' app/student/dashboard/page.tsx

# Add "My Classes" section before the "Join a Class" card
sed -i '/<Card className="animate-fade-in" style={{ padding: '"'"'3rem'"'"', textAlign: '"'"'center'"'"' }}>/i\
                {/* Enrolled Classes */}\
                {enrolledClasses.length > 0 && (\
                    <div className="mb-6">\
                        <h2 style={{ fontSize: '"'"'1.25rem'"'"', marginBottom: '"'"'1rem'"'"', color: '"'"'white'"'"' }}>My Classes</h2>\
                        <div style={{ display: '"'"'flex'"'"', flexDirection: '"'"'column'"'"', gap: '"'"'0.75rem'"'"' }}>\
                            {enrolledClasses.map((cls) => (\
                                <div key={cls.id}\
                                    onClick={async () => {\
                                        const classData = await getClass(cls.id);\
                                        setJoinedClass(classData);\
                                    }}\
                                    className="glass-card glass-card-hover"\
                                    style={{ padding: '"'"'1rem 1.5rem'"'"', cursor: '"'"'pointer'"'"', display: '"'"'flex'"'"', justifyContent: '"'"'space-between'"'"', alignItems: '"'"'center'"'"' }}\
                                >\
                                    <div>\
                                        <div style={{ fontWeight: '"'"'bold'"'"', color: '"'"'white'"'"', fontSize: '"'"'1rem'"'"' }}>{cls.name}</div>\
                                        <div style={{ color: '"'"'#94a3b8'"'"', fontSize: '"'"'0.75rem'"'"' }}>Code: {cls.code} | {cls.memberIds?.length || 0} members</div>\
                                    </div>\
                                    <div style={{ color: '"'"'#818cf8'"'"', fontWeight: '"'"'600'"'"', fontSize: '"'"'0.875rem'"'"' }}>Enter →</div>\
                                </div>\
                            ))}\
                        </div>\
                    </div>\
                )}\
' app/student/dashboard/page.tsx

echo "  Updated app/student/dashboard/page.tsx with enrolled classes"

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
echo "M3.2 COMPLETE! Files changed:"
echo "=========================================="
echo "  NEW:      components/ShareClassModal.tsx"
echo "  MODIFIED: app/dashboard/page.tsx (copy code + share button on cards)"
echo "  MODIFIED: app/dashboard/class/page.tsx (share modal with QR)"
echo "  MODIFIED: app/student/dashboard/page.tsx (enrolled classes list)"
echo ""
echo "NEXT STEPS:"
echo "  1. git add . && git commit -m 'M3.2: Class management - share codes, QR, enrolled classes' && git push"
echo "  2. firebase deploy --only hosting"
echo "  3. Test: Create a class, click Share, verify QR + copy + link"
echo "  4. Test: Join class as student, see enrolled classes list"
echo "=========================================="
