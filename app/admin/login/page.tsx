'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmail, signInWithGoogle, getUserProfile, onAuthStateChange } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

function AdminLoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check if user is already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (user) {
                const profile = await getUserProfile(user.uid);
                if (profile?.role === 'host') {
                    // Already logged in as host, redirect to dashboard
                    router.push('/dashboard');
                }
            }
            setCheckingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = await signInWithEmail(email, password);
            const profile = await getUserProfile(user.uid);

            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else if (profile?.role === 'host') {
                router.push('/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to login');
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError('');

        try {
            const user = await signInWithGoogle('host');
            const profile = await getUserProfile(user.uid);

            if (profile?.role === 'host') {
                router.push('/dashboard');
            } else {
                router.push('/student/dashboard');
            }
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to login with Google');
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="w-full max-w-md relative z-10">
                <div className="glass-card p-12 text-center">
                    <div className="animate-pulse text-lg text-white">
                        Checking authentication...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="glass-card p-8 md:p-12 animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-float">👨‍🏫</div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                        Host <span className="text-gradient">Login</span>
                    </h1>
                    <p className="text-slate-300">
                        Manage your classes and games
                    </p>
                </div>

                <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
                    <div>
                        <label className="block mb-2 text-sm font-bold text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 input-glass placeholder-slate-400"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-bold text-slate-300">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 input-glass placeholder-slate-400"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <button
                        className="w-full py-3.5 btn-3d-primary font-bold text-lg"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login as Host'}
                    </button>
                </form>

                <div className="my-6 text-center text-slate-400 text-sm font-medium">
                    or continue with
                </div>

                <button
                    className="w-full py-3.5 btn-glass font-bold text-white flex items-center justify-center gap-2"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <span className="text-xl">🔍</span>
                    Google
                </button>

                <div className="mt-8 text-center text-sm">
                    <span className="text-slate-400">Don't have a host account? </span>
                    <button
                        onClick={() => router.push('/admin/signup')}
                        className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                    >
                        Sign Up
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function AdminLoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            </div>

            <div className="absolute top-6 right-6 z-20">
                <ThemeToggle />
            </div>
            <Suspense fallback={<div className="text-center text-white relative z-10">Loading...</div>}>
                <AdminLoginContent />
            </Suspense>
        </main>
    );
}
