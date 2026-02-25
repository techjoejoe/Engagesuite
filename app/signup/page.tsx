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
