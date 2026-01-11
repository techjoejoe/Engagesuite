'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { onAuthStateChange } from '@/lib/auth';
import { Icons } from '@/components/picpick/Icons';
import { Spinner, Toast } from '@/components/picpick/UI';
import Button from '@/components/Button';

export default function PicPickHome() {
    const router = useRouter();
    const [code, setCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Redirect enrolled students to their dashboard
    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (user) {
                // Check if user is enrolled in any class
                const membersQuery = query(
                    collection(db, 'classes'),
                    where('memberIds', 'array-contains', user.uid)
                );
                const classesSnap = await getDocs(membersQuery);

                if (!classesSnap.empty) {
                    // User is enrolled, redirect to dashboard
                    router.push('/student/dashboard');
                    return;
                }
            }
            setCheckingAuth(false);
        });
        return () => unsubscribe();
    }, [router]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 6) {
            setToast({ message: 'Please enter a valid 6-character code', type: 'error' });
            return;
        }

        setJoining(true);
        try {
            const q = query(collection(db, 'galleries'), where('code', '==', code.toUpperCase()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const galleryId = querySnapshot.docs[0].id;
                setToast({ message: 'Gallery found! Redirecting...', type: 'success' });
                router.push(`/picpick/gallery/${galleryId}`);
            } else {
                setToast({ message: 'Gallery not found. Check the code.', type: 'error' });
                setJoining(false);
            }
        } catch (err) {
            console.error(err);
            setToast({ message: 'Error joining gallery', type: 'error' });
            setJoining(false);
        }
    };

    if (checkingAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <main className="full-height flex-center" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '500px' }}>
                <div className="text-center mb-4 animate-fade-in">
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)'
                    }}>
                        <Icons.Fire style={{ width: '40px', height: '40px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #fff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        PicPick
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        Live Photo Contests
                    </p>
                </div>

                <div className="card animate-fade-in" style={{ padding: '2.5rem', backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <form onSubmit={handleJoin} className="flex-col gap-4">
                        <div className="text-center mb-2">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                                Enter Join Code
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }}>
                                    <Icons.Key style={{ width: '20px', height: '20px' }} />
                                </div>
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    placeholder="CODE"
                                    maxLength={6}
                                    className="input"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '1.5rem',
                                        letterSpacing: '0.2em',
                                        paddingLeft: '3rem',
                                        paddingRight: '1rem',
                                        fontFamily: 'monospace',
                                        textTransform: 'uppercase',
                                        background: 'rgba(0,0,0,0.3)',
                                        borderColor: 'rgba(255,255,255,0.1)'
                                    }}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="full-width"
                            disabled={joining}
                            style={{ padding: '1rem', fontSize: '1.1rem' }}
                        >
                            {joining ? <Spinner size="sm" /> : 'Join Contest'}
                        </Button>
                    </form>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Want to host your own contest?
                        </p>
                        <Link href="/picpick/admin">
                            <Button variant="glass" className="full-width">
                                <Icons.Plus style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                                Create Gallery
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="text-center mt-4">
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                        v2.0
                    </p>
                </div>
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </main>
    );
}
