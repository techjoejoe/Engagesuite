'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { signUpWithEmail, signInWithGoogle, onAuthStateChange } from '@/lib/auth';

function SignUpContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
        <div className="w-full max-w-md relative z-10">
            <div className="glass-card-strong p-8 md:p-12 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🎮</div>
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-[#94A3B8]">
                        Track your lifetime points and compete globally
                    </p>
                </div>

                <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-[#94A3B8]">
                            Display Name
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-3 input-glass"
                            placeholder="Your Name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={loading}
                        />
                    </div>

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
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-[#94A3B8]">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 input-glass"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? 'Creating Account...' : '🚀 Sign Up'}
                    </Button>
                </form>

                <div className="my-6 text-center text-[#94A3B8] text-sm">
                    or
                </div>

                <Button
                    variant="glass"
                    size="lg"
                    className="w-full"
                    onClick={handleGoogleSignUp}
                    disabled={loading}
                >
                    <span className="mr-2">🔍</span>
                    Sign Up with Google
                </Button>

                <div className="mt-8 text-center text-sm">
                    <span className="text-[#94A3B8]">Already have an account? </span>
                    <button
                        onClick={() => router.push('/login')}
                        className="text-[#22D3EE] font-semibold hover:text-[#06B6D4] transition-colors"
                    >
                        Login
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

export default function SignUpPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Blobs - Vibrant */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/40 rounded-full blur-[150px] animate-blob" />
                <div className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] bg-[#06B6D4]/35 rounded-full blur-[130px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-15%] left-[25%] w-[50%] h-[50%] bg-[#F472B6]/30 rounded-full blur-[140px] animate-blob animation-delay-4000" />
            </div>

            <Suspense fallback={<div className="text-center text-white">Loading...</div>}>
                <SignUpContent />
            </Suspense>
        </main>
    );
}
