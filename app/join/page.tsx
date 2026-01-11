'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkRoomExists, joinGame } from '@/lib/game';
import { joinClass } from '@/lib/classes';
import { getCurrentUser, onAuthStateChange, signInAnonymouslyUser } from '@/lib/auth';
import { User } from 'firebase/auth';

export default function JoinPage() {
    const router = useRouter();
    const [roomCode, setRoomCode] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        if (code) setRoomCode(code);
    }, []);

    const handleJoin = async () => {
        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }

        if (!user && !playerName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let currentUser = user;

            if (!currentUser) {
                try {
                    currentUser = await signInAnonymouslyUser(playerName);
                } catch (authErr: any) {
                    console.error('Auth error:', authErr);
                    setError('Failed to sign in. Please try again.');
                    setLoading(false);
                    return;
                }
            }

            if (!currentUser) {
                setError('Authentication failed');
                setLoading(false);
                return;
            }

            // 1. Try Join Class
            try {
                const classId = await joinClass(currentUser.uid, roomCode);
                router.push(`/play/class/${classId}`);
                return;
            } catch (classErr: any) {
                if (classErr.message !== 'Invalid class code') {
                    console.error('Class join error:', classErr);
                }
            }

            // 2. Try Join Game (Legacy)
            const exists = await checkRoomExists(roomCode.toUpperCase());

            if (!exists) {
                setError('Room not found. Please check the code.');
                setLoading(false);
                return;
            }

            const pName = user ? (user.displayName || 'Player') : playerName;
            const playerId = await joinGame(roomCode.toUpperCase(), pName);

            localStorage.setItem('playerId', playerId);
            localStorage.setItem('playerName', pName);

            router.push(`/play?room=${roomCode}`);
        } catch (error) {
            console.error('Error joining game:', error);
            setError('Failed to join game. Please try again.');
        } finally {
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

            <div className="w-full max-w-md relative z-10">
                <div className="glass-card p-8 md:p-10 animate-fade-in-up">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4 animate-float">🎮</div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                            Join the <span className="text-gradient">Fun!</span>
                        </h1>
                        <p className="text-[#94A3B8]">
                            Enter the code to start playing
                        </p>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div>
                            <label className="block mb-2 text-sm font-bold text-[#6a6e79]">
                                Room Code
                            </label>
                            <input
                                type="text"
                                placeholder="ABC123"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                maxLength={6}
                                className="w-full px-4 py-4 text-center text-2xl font-black tracking-[0.2em] uppercase input-glass placeholder-[#94A3B8]/50"
                            />
                        </div>

                        {!user && (
                            <div>
                                <label className="block mb-2 text-sm font-bold text-[#94A3B8]">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                    className="w-full px-4 py-3 input-glass placeholder-[#94A3B8]/60"
                                />
                            </div>
                        )}

                        {user && (
                            <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                                <p className="text-green-400 font-medium text-sm">Logged in as {user.displayName}</p>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-sm text-center backdrop-blur-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleJoin}
                            disabled={loading}
                            className="w-full py-4 btn-3d-primary font-bold text-xl mt-2"
                        >
                            {loading ? 'Joining...' : '🚀 Let\'s Play!'}
                        </button>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full py-3 btn-glass font-semibold text-[#94A3B8] hover:text-white"
                        >
                            ← Back to Home
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
