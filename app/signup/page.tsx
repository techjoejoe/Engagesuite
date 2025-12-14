'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { signUpWithEmail, signInWithGoogle, onAuthStateChange } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

function SignUpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    // const [role, setRole] = useState<'host' | 'player'>('player'); // Removed role selection
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                router.push('/dashboard');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password || !displayName) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await signUpWithEmail(email, password, displayName, 'player');
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                router.push('/student/dashboard');
            }
        } catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message || 'Failed to create account');
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setLoading(true);
        setError('');

        try {
            await signInWithGoogle('player');
            if (redirectUrl) {
                router.push(decodeURIComponent(redirectUrl));
            } else {
                router.push('/student/dashboard');
            }
        } catch (err: any) {
            console.error('Google signup error:', err);
            setError(err.message || 'Failed to sign up with Google');
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-slate-700 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Track your lifetime points and compete globally
                    </p>
                </div>

                {/* Role Selection Removed */}

                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Display Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="Your Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </Button>
                </form>

                <div className="my-6 text-center text-gray-400 dark:text-gray-500 text-sm">
                    or
                </div>

                <Button
                    variant="secondary"
                    size="lg"
                    className="w-full bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-600"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                >
                    <span className="mr-2">🔍</span>
                    Sign Up with Google
                </Button>

                <div className="mt-8 text-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Already have an account? </span>
                    <button
                        onClick={() => router.push('/login')}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        Login
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

export default function SignUpPage() {
    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-6 transition-colors duration-300 relative">
            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>
            <Suspense fallback={<div className="text-center">Loading...</div>}>
                <SignUpContent />
            </Suspense>
        </main>
    );
}
