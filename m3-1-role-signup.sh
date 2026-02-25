#!/bin/bash
# ================================================================
# M3.1: Role-Based Signup & Trainer Verification
# Run this in your Codespace: bash m3-1-role-signup.sh
# ================================================================

set -e
cd /workspaces/Engagesuite

echo "=========================================="
echo "M3.1: Role-Based Signup & Access Codes"
echo "=========================================="

# ------------------------------------------------
# 1. CREATE lib/accessCodes.ts
# ------------------------------------------------
echo "[1/5] Creating lib/accessCodes.ts..."

cat > lib/accessCodes.ts << 'ACEOF'
// Access Code Management for Trainer Verification
// Firestore collection: accessCodes/{code}
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface AccessCode {
  code: string;
  tier: 'starter' | 'pro' | 'unlimited' | 'trial';
  createdAt: Timestamp | number;
  expiresAt: Timestamp | number | null;
  usedBy: string | null;
  usedAt: Timestamp | number | null;
  createdBy: string;
  maxUses: number;
  currentUses: number;
  active: boolean;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function validateAccessCode(code: string): Promise<AccessCode | null> {
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = doc(db, 'accessCodes', normalizedCode);
  const codeSnap = await getDoc(codeRef);

  if (!codeSnap.exists()) return null;

  const codeData = codeSnap.data() as AccessCode;

  if (!codeData.active) return null;
  if (codeData.maxUses > 0 && codeData.currentUses >= codeData.maxUses) return null;

  if (codeData.expiresAt) {
    const expiryTime = codeData.expiresAt instanceof Timestamp
      ? codeData.expiresAt.toMillis()
      : codeData.expiresAt;
    if (Date.now() > expiryTime) return null;
  }

  return codeData;
}

export async function redeemAccessCode(code: string, uid: string): Promise<boolean> {
  const normalizedCode = code.trim().toUpperCase();
  const codeRef = doc(db, 'accessCodes', normalizedCode);

  try {
    const codeData = await validateAccessCode(normalizedCode);
    if (!codeData) return false;

    await updateDoc(codeRef, {
      usedBy: uid,
      usedAt: Date.now(),
      currentUses: codeData.currentUses + 1,
      ...(codeData.maxUses === 1 ? { active: false } : {}),
    });
    return true;
  } catch (error) {
    console.error('Error redeeming access code:', error);
    return false;
  }
}

export async function createAccessCode(
  createdBy: string,
  tier: AccessCode['tier'] = 'pro',
  options?: { maxUses?: number; expiresInDays?: number; customCode?: string; }
): Promise<string> {
  const code = options?.customCode?.toUpperCase() || generateCode();
  const codeRef = doc(db, 'accessCodes', code);

  const expiresAt = options?.expiresInDays
    ? Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const codeData: AccessCode = {
    code, tier,
    createdAt: Date.now(),
    expiresAt,
    usedBy: null, usedAt: null,
    createdBy,
    maxUses: options?.maxUses ?? 1,
    currentUses: 0,
    active: true,
  };

  await setDoc(codeRef, codeData);
  return code;
}

export async function createTrialCode(uid: string): Promise<string> {
  return createAccessCode('system', 'trial', { maxUses: 1, expiresInDays: 14 });
}

export async function getAllAccessCodes(): Promise<AccessCode[]> {
  const codesRef = collection(db, 'accessCodes');
  const snapshot = await getDocs(codesRef);
  return snapshot.docs.map(doc => doc.data() as AccessCode);
}

export async function getActiveAccessCodes(): Promise<AccessCode[]> {
  const codesRef = collection(db, 'accessCodes');
  const q = query(codesRef, where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as AccessCode);
}

export async function deactivateAccessCode(code: string): Promise<void> {
  const codeRef = doc(db, 'accessCodes', code.toUpperCase());
  await updateDoc(codeRef, { active: false });
}

export async function deleteAccessCode(code: string): Promise<void> {
  const codeRef = doc(db, 'accessCodes', code.toUpperCase());
  await deleteDoc(codeRef);
}
ACEOF

echo "  Created lib/accessCodes.ts"

# ------------------------------------------------
# 2. UPDATE app/signup/page.tsx (backup first)
# ------------------------------------------------
echo "[2/5] Updating signup page with role selector..."
cp app/signup/page.tsx app/signup/page.tsx.bak.m2

cat > app/signup/page.tsx << 'SIGNUPEOF'
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUpWithEmail, signInWithGoogle } from '@/lib/auth';
import { validateAccessCode, redeemAccessCode } from '@/lib/accessCodes';

type Role = 'player' | 'host';

export default function SignupPage() {
  const [role, setRole] = useState<Role>('player');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeValidating, setCodeValidating] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const router = useRouter();

  const handleCodeChange = async (value: string) => {
    let formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (formatted.length === 4 && !formatted.includes('-')) {
      formatted = formatted + '-';
    }
    setAccessCode(formatted);
    setCodeValid(null);

    if (formatted.length === 9) {
      setCodeValidating(true);
      const result = await validateAccessCode(formatted);
      setCodeValid(result !== null);
      setCodeValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    if (role === 'host') {
      if (!accessCode || accessCode.length < 9) { setError('Please enter a valid trainer access code'); return; }
      const codeData = await validateAccessCode(accessCode);
      if (!codeData) { setError('Invalid or expired access code. Contact your administrator for a valid code.'); return; }
    }

    setLoading(true);

    try {
      const user = await signUpWithEmail(email, password, name, role);
      if (role === 'host' && user) { await redeemAccessCode(accessCode, user.uid); }
      router.push(role === 'host' ? '/dashboard' : '/student/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') setError('An account with this email already exists');
      else if (err.code === 'auth/invalid-email') setError('Invalid email address');
      else if (err.code === 'auth/weak-password') setError('Password is too weak');
      else setError('Failed to create account. Please try again.');
    } finally { setLoading(false); }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    if (role === 'host') {
      if (!accessCode || accessCode.length < 9) { setError('Please enter a valid trainer access code before signing up with Google'); setLoading(false); return; }
      const codeData = await validateAccessCode(accessCode);
      if (!codeData) { setError('Invalid or expired access code.'); setLoading(false); return; }
    }

    try {
      const user = await signInWithGoogle(role);
      if (role === 'host' && user) { await redeemAccessCode(accessCode, user.uid); }
      router.push(role === 'host' ? '/dashboard' : '/student/dashboard');
    } catch (err: any) {
      console.error('Google signup error:', err);
      setError(err.message || 'Failed to sign up with Google');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/15 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-lg">🚀</div>
            <div className="text-left">
              <div className="text-xl font-bold text-white">Trainer-Toolbox</div>
              <div className="text-xs text-gray-400">Training Tools Platform</div>
            </div>
          </Link>
        </div>

        <div className="bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-2">Create Your Account</h1>
          <p className="text-gray-400 text-center mb-6">Choose how you want to use Trainer-Toolbox</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => { setRole('player'); setError(''); setCodeValid(null); }}
              className={`relative p-4 rounded-xl border-2 transition-all text-center ${role === 'player' ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
              <div className="text-3xl mb-2">🎓</div>
              <div className={`font-semibold text-sm ${role === 'player' ? 'text-white' : 'text-white/70'}`}>I&apos;m a Student</div>
              <div className="text-xs text-white/40 mt-1">Join classes for free</div>
              {role === 'player' && (<div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>)}
            </button>
            <button type="button" onClick={() => { setRole('host'); setError(''); }}
              className={`relative p-4 rounded-xl border-2 transition-all text-center ${role === 'host' ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
              <div className="text-3xl mb-2">🏫</div>
              <div className={`font-semibold text-sm ${role === 'host' ? 'text-white' : 'text-white/70'}`}>I&apos;m a Trainer</div>
              <div className="text-xs text-white/40 mt-1">Access code required</div>
              {role === 'host' && (<div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center"><svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>)}
            </button>
          </div>

          {error && (<div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><p className="text-red-400 text-sm text-center">{error}</p></div>)}

          <form onSubmit={handleSubmit} className="space-y-4">
            {role === 'host' && (
              <div>
                <label htmlFor="accessCode" className="block text-sm font-medium text-gray-300 mb-2">Trainer Access Code</label>
                <div className="relative">
                  <input type="text" id="accessCode" value={accessCode} onChange={(e) => handleCodeChange(e.target.value)} required maxLength={9} placeholder="XXXX-XXXX"
                    className={`w-full px-4 py-3 bg-[#0f172a]/50 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all font-mono text-lg tracking-widest text-center ${codeValid === true ? 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20' : codeValid === false ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-white/10 focus:border-purple-500 focus:ring-purple-500/20'}`} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {codeValidating && (<svg className="animate-spin h-5 w-5 text-white/40" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>)}
                    {!codeValidating && codeValid === true && (<svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
                    {!codeValidating && codeValid === false && (<svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>)}
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-1">Don&apos;t have a code? Contact your organization administrator.</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jane Smith" className="w-full px-4 py-3 bg-[#0f172a]/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder={role === 'host' ? 'you@company.com' : 'you@email.com'} className="w-full px-4 py-3 bg-[#0f172a]/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6} className="w-full px-4 py-3 bg-[#0f172a]/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              <p className="text-xs text-white/60 mt-1">Must be at least 6 characters</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" className="w-full px-4 py-3 bg-[#0f172a]/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            </div>

            <button type="submit" disabled={loading || (role === 'host' && codeValid === false)}
              className={`w-full py-3.5 font-semibold rounded-lg shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-white ${role === 'host' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-500/25 hover:shadow-purple-500/40' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-indigo-500/25 hover:shadow-indigo-500/40'}`}>
              {loading ? (<span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>Creating account...</span>) : (role === 'host' ? 'Create Trainer Account' : 'Create Student Account')}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3"><div className="flex-1 h-px bg-white/10" /><span className="text-xs text-white/40">or</span><div className="flex-1 h-px bg-white/10" /></div>

          <button onClick={handleGoogleSignup} disabled={loading} className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-white/80 font-medium hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
            Continue with Google
          </button>

          <p className="mt-5 text-xs text-white/60 text-center">By signing up, you agree to our{' '}<Link href="/terms" className="text-indigo-400 hover:text-indigo-300">Terms of Service</Link>{' '}and{' '}<Link href="/privacy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</Link></p>
          <p className="mt-5 text-center text-gray-400">Already have an account?{' '}<Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link></p>
        </div>
        <p className="mt-6 text-center"><Link href="/" className="text-white/60 hover:text-gray-400 text-sm transition-colors">← Back to home</Link></p>
      </div>
    </main>
  );
}
SIGNUPEOF

echo "  Updated app/signup/page.tsx"

# ------------------------------------------------
# 3. UPDATE app/login/page.tsx (role-based routing)
# ------------------------------------------------
echo "[3/5] Updating login page with role-based routing..."

# Fix import to include getUserProfile
sed -i "s/import { signInWithEmail, signInWithGoogle } from '@\/lib\/auth';/import { signInWithEmail, signInWithGoogle, getUserProfile } from '@\/lib\/auth';/" app/login/page.tsx

# Fix email login routing
sed -i '/await signInWithEmail(email, password);/{
  s/await signInWithEmail(email, password);/const user = await signInWithEmail(email, password);/
}' app/login/page.tsx

# Replace the simple /dashboard redirect after email login
sed -i '/const user = await signInWithEmail/,/router.push.*dashboard/ {
  /} else {/,/router.push.*dashboard/ {
    /router.push.*dashboard/c\
                const profile = await getUserProfile(user.uid);\
                if (profile?.role === '"'"'host'"'"') {\
                    router.push('"'"'/dashboard'"'"');\
                } else {\
                    router.push('"'"'/student/dashboard'"'"');\
                }
  }
}' app/login/page.tsx

# Fix Google login routing
sed -i '/await signInWithGoogle();/{
  s/await signInWithGoogle();/const gUser = await signInWithGoogle();/
}' app/login/page.tsx

# Replace the simple /dashboard redirect after Google login
sed -i '/const gUser = await signInWithGoogle/,/router.push.*dashboard/ {
  /} else {/,/router.push.*dashboard/ {
    /router.push.*dashboard/c\
                const gProfile = await getUserProfile(gUser.uid);\
                if (gProfile?.role === '"'"'host'"'"') {\
                    router.push('"'"'/dashboard'"'"');\
                } else {\
                    router.push('"'"'/student/dashboard'"'"');\
                }
  }
}' app/login/page.tsx

echo "  Updated app/login/page.tsx"

# ------------------------------------------------
# 4. CREATE app/admin/codes/page.tsx
# ------------------------------------------------
echo "[4/5] Creating admin codes management page..."
mkdir -p app/admin/codes

cat > app/admin/codes/page.tsx << 'ADMINEOF'
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChange, getUserProfile } from '@/lib/auth';
import { createAccessCode, getAllAccessCodes, deactivateAccessCode, deleteAccessCode, AccessCode } from '@/lib/accessCodes';
import { User } from 'firebase/auth';

type Tier = 'starter' | 'pro' | 'unlimited' | 'trial';

const TIER_CONFIG: Record<Tier, { label: string; color: string; bg: string }> = {
  starter: { label: 'Starter ($9.99)', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  pro: { label: 'Pro ($15)', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  unlimited: { label: 'Unlimited ($20)', color: 'text-teal-400', bg: 'bg-teal-500/20' },
  trial: { label: '14-Day Trial', color: 'text-amber-400', bg: 'bg-amber-500/20' },
};

export default function AdminCodesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [generating, setGenerating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<Tier>('pro');
  const [batchCount, setBatchCount] = useState(1);
  const [expiryDays, setExpiryDays] = useState<number>(0);
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (currentUser) => {
      if (!currentUser) { router.push('/login'); return; }
      const profile = await getUserProfile(currentUser.uid);
      if (profile?.role !== 'host') { router.push('/student/dashboard'); return; }
      setUser(currentUser);
      await loadCodes();
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  const loadCodes = async () => {
    const allCodes = await getAllAccessCodes();
    allCodes.sort((a, b) => {
      if (a.active !== b.active) return a.active ? -1 : 1;
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0;
      return bTime - aTime;
    });
    setCodes(allCodes);
  };

  const handleGenerate = async () => {
    if (!user) return;
    setGenerating(true);
    setNewCodes([]);
    try {
      const generated: string[] = [];
      for (let i = 0; i < batchCount; i++) {
        const code = await createAccessCode(user.uid, selectedTier, {
          maxUses: 1, expiresInDays: expiryDays > 0 ? expiryDays : undefined,
        });
        generated.push(code);
      }
      setNewCodes(generated);
      await loadCodes();
    } catch (err) { console.error('Error generating codes:', err); }
    finally { setGenerating(false); }
  };

  const handleDeactivate = async (code: string) => { await deactivateAccessCode(code); await loadCodes(); };
  const handleDelete = async (code: string) => { if (confirm('Delete this code?')) { await deleteAccessCode(code); await loadCodes(); } };
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); setCopied(text); setTimeout(() => setCopied(null), 2000); };

  const formatDate = (timestamp: number | any): string => {
    if (!timestamp) return 'N/A';
    const ms = typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || 0;
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isExpired = (code: AccessCode): boolean => {
    if (!code.expiresAt) return false;
    const ms = typeof code.expiresAt === 'number' ? code.expiresAt : code.expiresAt.toMillis?.() || 0;
    return Date.now() > ms;
  };

  if (loading) return (<main className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" /></main>);

  const activeCount = codes.filter(c => c.active && !isExpired(c)).length;
  const usedCount = codes.filter(c => c.currentUses > 0).length;

  return (
    <main className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => router.push('/dashboard')} className="text-white/50 hover:text-white text-sm mb-2 transition-colors">← Back to Dashboard</button>
            <h1 className="text-2xl font-bold">Access Code Manager</h1>
            <p className="text-white/50 text-sm mt-1">Generate and manage trainer access codes</p>
          </div>
          <div className="flex gap-4 text-center">
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-indigo-400">{activeCount}</div><div className="text-xs text-white/40">Active</div></div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-teal-400">{usedCount}</div><div className="text-xs text-white/40">Used</div></div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2"><div className="text-xl font-bold text-white/60">{codes.length}</div><div className="text-xs text-white/40">Total</div></div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="font-semibold text-lg mb-4">Generate New Codes</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Tier</label>
              <select value={selectedTier} onChange={(e) => setSelectedTier(e.target.value as Tier)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500">
                <option value="trial">14-Day Trial</option><option value="starter">Starter ($9.99/mo)</option><option value="pro">Pro ($15/mo)</option><option value="unlimited">Unlimited ($20/mo)</option>
              </select>
            </div>
            <div><label className="block text-xs text-white/50 mb-1">Quantity</label><input type="number" min={1} max={50} value={batchCount} onChange={(e) => setBatchCount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
            <div><label className="block text-xs text-white/50 mb-1">Expires in (days, 0=never)</label><input type="number" min={0} value={expiryDays} onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500" /></div>
            <div className="flex items-end"><button onClick={handleGenerate} disabled={generating} className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg font-semibold hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50">{generating ? 'Generating...' : `Generate ${batchCount} Code${batchCount > 1 ? 's' : ''}`}</button></div>
          </div>
          {newCodes.length > 0 && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4">
              <div className="text-green-400 font-semibold text-sm mb-2">Generated {newCodes.length} code{newCodes.length > 1 ? 's' : ''}:</div>
              <div className="flex flex-wrap gap-2">{newCodes.map((code) => (<button key={code} onClick={() => copyToClipboard(code)} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg font-mono text-sm hover:bg-white/10 transition-all">{code}<span className="text-xs text-white/40">{copied === code ? 'Copied!' : 'Click to copy'}</span></button>))}</div>
            </div>
          )}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10"><h2 className="font-semibold">All Codes ({codes.length})</h2></div>
          {codes.length === 0 ? (<div className="p-12 text-center text-white/40">No access codes yet. Generate your first code above.</div>) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/10 text-xs text-white/40 uppercase tracking-wider"><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Tier</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Created</th><th className="px-4 py-3 text-left">Expires</th><th className="px-4 py-3 text-left">Used</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
                <tbody>{codes.map((code) => {
                  const expired = isExpired(code);
                  const fullyUsed = code.maxUses > 0 && code.currentUses >= code.maxUses;
                  return (
                    <tr key={code.code} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3"><button onClick={() => copyToClipboard(code.code)} className="font-mono text-sm hover:text-indigo-400 transition-colors">{code.code}{copied === code.code && <span className="ml-2 text-xs text-green-400">Copied!</span>}</button></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${TIER_CONFIG[code.tier]?.bg || 'bg-white/10'} ${TIER_CONFIG[code.tier]?.color || 'text-white/60'}`}>{TIER_CONFIG[code.tier]?.label || code.tier}</span></td>
                      <td className="px-4 py-3">{!code.active || expired || fullyUsed ? (<span className="text-xs text-red-400">{expired ? 'Expired' : fullyUsed ? 'Used' : 'Inactive'}</span>) : (<span className="text-xs text-green-400">Active</span>)}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{formatDate(code.createdAt)}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{code.expiresAt ? formatDate(code.expiresAt) : 'Never'}</td>
                      <td className="px-4 py-3 text-sm text-white/50">{code.currentUses}/{code.maxUses || '∞'}</td>
                      <td className="px-4 py-3 text-right"><div className="flex items-center justify-end gap-2">{code.active && !expired && (<button onClick={() => handleDeactivate(code.code)} className="text-xs px-2 py-1 text-amber-400 hover:bg-amber-500/10 rounded transition-colors">Deactivate</button>)}<button onClick={() => handleDelete(code.code)} className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors">Delete</button></div></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
ADMINEOF

echo "  Created app/admin/codes/page.tsx"

# ------------------------------------------------
# 5. UPDATE firestore.rules
# ------------------------------------------------
echo "[5/5] Updating Firestore rules..."

# Check if accessCodes rule already exists
if ! grep -q "accessCodes" firestore.rules; then
  sed -i '/BADGES COLLECTION/i\
    // ACCESS CODES (Trainer Verification)\
    // Read: unauthenticated allowed (validated during signup before user exists)\
    // Write: authenticated users only\
    match /accessCodes/{codeId} {\
      allow read: if true;\
      allow create: if isAuthenticated();\
      allow update: if isAuthenticated();\
      allow delete: if isAuthenticated();\
    }\
' firestore.rules
  echo "  Updated firestore.rules"
else
  echo "  firestore.rules already has accessCodes rule"
fi

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
echo "M3.1 COMPLETE! Files changed:"
echo "=========================================="
echo "  NEW:      lib/accessCodes.ts"
echo "  NEW:      app/admin/codes/page.tsx"
echo "  MODIFIED: app/signup/page.tsx (role selector + access code)"
echo "  MODIFIED: app/login/page.tsx (role-based routing)"
echo "  MODIFIED: firestore.rules (accessCodes collection)"
echo ""
echo "NEXT STEPS:"
echo "  1. git add . && git commit -m 'M3.1: Role-based signup with access codes' && git push"
echo "  2. firebase deploy"
echo "  3. Go to /admin/codes to generate your first trainer access code"
echo "  4. Test: Sign up as Student (no code) and Trainer (with code)"
echo "=========================================="
