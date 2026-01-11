'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { signUpWithEmail, signInWithGoogle, onAuthStateChange } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminSignUpPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
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
            await signUpWithEmail(email, password, displayName, 'host');
            router.push('/dashboard');
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
            await signInWithGoogle('host');
            router.push('/dashboard');
        } catch (err: any) {
            console.error('Google signup error:', err);
            setError(err.message || 'Failed to sign up with Google');
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background - Vibrant */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#7C3AED]/40 rounded-full blur-[120px] animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-[#06B6D4]/35 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-[#F472B6]/30 rounded-full blur-[120px] animate-blob animation-delay-4000" />
            </div>

            <div className="absolute top-6 right-6 z-10">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="glass-card p-8 md:p-12 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4 animate-float">👨‍🏫</div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                            Create <span className="text-gradient">Host Account</span>
                        </h1>
                        <p className="text-[#94A3B8]">
                            Start creating interactive classes
                        </p>
                    </div>

                    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-[#6a6e79]">
                                Display Name
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 input-glass placeholder-[#6a6e79]/60"
                                placeholder="Your Name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-bold text-[#6a6e79]">
                                Email
                            </label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 input-glass placeholder-[#6a6e79]/60"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-bold text-[#6a6e79]">
                                Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 input-glass placeholder-[#6a6e79]/60"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block mb-2 text-sm font-bold text-[#6a6e79]">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 input-glass placeholder-[#6a6e79]/60"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm text-center backdrop-blur-sm">
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
                            {loading ? 'Creating Account...' : 'Sign Up as Host'}
                        </Button>
                    </form>

                    <div className="my-6 text-center text-[#94A3B8] text-sm font-medium">
                        or
                    </div>

                    <button
                        className="w-full py-3.5 btn-glass font-bold text-white flex items-center justify-center gap-2"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                    >
                        <span className="text-xl">🔍</span>
                        Sign Up with Google
                    </button>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-[#94A3B8]">Already have a host account? </span>
                        <button
                            onClick={() => router.push('/admin/login')}
                            className="text-[#22D3EE] font-bold hover:text-[#06B6D4] transition-colors"
                        >
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
