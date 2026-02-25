'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { signInWithEmail, signInWithGoogle, getUserProfile } from '@/lib/auth';

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = const user = await signInWithEmail(email, password);
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                const profile = await getUserProfile(user.uid);
                if (profile?.role === 'host') {
                const profile = await getUserProfile(user.uid);
                if (profile?.role === 'host') {
                    router.push('/dashboard');
                } else {
                    router.push('/student/dashboard');
                }
                } else {
                    router.push('/student/dashboard');
                }
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
            const gUser = const gUser = await signInWithGoogle();
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                const gProfile = await getUserProfile(gUser.uid);
                if (gProfile?.role === 'host') {
                const gProfile = await getUserProfile(gUser.uid);
                if (gProfile?.role === 'host') {
                    router.push('/dashboard');
                } else {
                    router.push('/student/dashboard');
                }
                } else {
                    router.push('/student/dashboard');
                }
            }
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to login with Google');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative z-10">
            <div className="glass-card-strong p-8 md:p-12 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="text-8xl mb-6">🔐</div>
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-[#94A3B8]">
                        Login to play and track your points
                    </p>
                </div>

                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[#94A3B8]">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 input-glass"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-[#94A3B8]">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 input-glass"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full mt-2"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : <><span className="text-2xl">🚀</span> Login</>}
                    </Button>
                </form>

                <div className="my-6 text-center text-[#94A3B8] text-sm">
                    or
                </div>

                <Button
                    variant="glass"
                    size="lg"
                    className="w-full"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <span className="mr-2">🔍</span>
                    Continue with Google
                </Button>

                <div className="mt-8 text-center text-sm">
                    <span className="text-[#94A3B8]">Don't have an account? </span>
                    <button
                        onClick={() => router.push('/signup')}
                        className="text-[#22D3EE] font-semibold hover:text-[#06B6D4] transition-colors"
                    >
                        Sign Up
                    </button>
                </div>

                <div className="mt-4 text-center text-sm">
                    <button
                        onClick={() => router.push('/')}
                        className="text-[#94A3B8] hover:text-white underline transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
            {/* Background Blobs - Vibrant */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[150px] animate-blob" />
                <div className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] bg-purple-600/15 rounded-full blur-[130px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-15%] left-[25%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px] animate-blob animation-delay-4000" />
            </div>

            <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    );
}
