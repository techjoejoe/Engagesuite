'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

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
            await signInWithEmail(email, password);
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                router.push('/dashboard');
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
            await signInWithGoogle();
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Failed to login with Google');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-slate-700 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🔐</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Login to play and track your points
                    </p>
                </div>

                <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
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
                        {loading ? 'Logging in...' : 'Login'}
                    </Button>
                </form>

                <div className="my-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                    or
                </div>

                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <span className="mr-2">🔍</span>
                    Continue with Google
                </Button>

                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Don't have an account? </span>
                    <button
                        onClick={() => router.push('/signup')}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        Sign Up
                    </button>
                </div>

                <div className="mt-4 text-center text-sm">
                    <button
                        onClick={() => router.push('/')}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 underline"
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
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300 relative">
            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    );
}
