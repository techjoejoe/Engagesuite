'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { onAuthStateChange, signOutUser, getUserProfile, UserProfile } from '@/lib/auth';
import { joinClass, getClass, Class, leaveClass, onClassChange } from '@/lib/classes';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';
import UserDash from '@/components/student/UserDash';
import StudentMenu from '@/components/StudentMenu';

export default function StudentDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [joinedClass, setJoinedClass] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);
    const [classCode, setClassCode] = useState('');
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [enrolledClasses, setEnrolledClasses] = useState<Class[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
                const userProfile = await getUserProfile(currentUser.uid);
                setProfile(userProfile);

                // Don't fetch class here - let the next useEffect handle it
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Load enrolled classes
    useEffect(() => {
        if (!user) return;
        const loadEnrolledClasses = async () => {
            try {
                const classesRef = collection(db, 'classes');
                const q = query(classesRef, where('memberIds', 'array-contains', user.uid));
                const snapshot = await getDocs(q);
                setEnrolledClasses(snapshot.docs.map(doc => doc.data() as Class));
            } catch (err) {
                console.error('Error loading enrolled classes:', err);
            }
        };
        loadEnrolledClasses();
    }, [user]);

    // Separate effect for real-time class subscription
    useEffect(() => {
        if (!profile?.joinedClassId) {
            setJoinedClass(null);
            return;
        }

        // Set up real-time listener for class updates
        const unsubscribe = onClassChange(profile.joinedClassId, (classData) => {
            console.log('Real-time class update:', classData.currentActivity);
            setJoinedClass(classData);
        });

        return () => unsubscribe();
    }, [profile?.joinedClassId]);

    const handleJoinClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !classCode.trim()) return;

        setJoining(true);
        setError('');

        try {
            const classId = await joinClass(user.uid, classCode.trim());
            const classData = await getClass(classId);
            setJoinedClass(classData);
            // Refresh profile to update joinedClassId locally if needed, 
            // but we already set joinedClass so UI updates.
        } catch (err: any) {
            console.error('Error joining class:', err);
            setError('Invalid class code or failed to join.');
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveClass = async () => {
        if (!user) return;
        if (confirm('Are you sure you want to leave this class?')) {
            try {
                await leaveClass(user.uid);
                setJoinedClass(null);
                // Optionally refresh profile
                const userProfile = await getUserProfile(user.uid);
                setProfile(userProfile);
            } catch (err) {
                console.error('Error leaving class:', err);
                alert('Failed to leave class');
            }
        }
    };

    const handleSignOut = async () => {
        await signOutUser();
        router.push('/');
    };

    if (loading) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    if (joinedClass && user) {
        return (
            <UserDash
                classData={joinedClass}
                userId={user.uid}
                onLeaveClass={handleLeaveClass}
            />
        );
    }

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <StudentMenu currentPage="Dashboard" />

            <div className="container" style={{ maxWidth: '600px' }}>
                {/* Header */}
                <div className="flex-between mb-4">
                    <div>
                        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                            Student Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Welcome, {user?.displayName || 'Student'}!
                        </p>
                    </div>
                </div>

                {/* Enrolled Classes */}
                {enrolledClasses.length > 0 && (
                    <div className="mb-6">
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>My Classes</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {enrolledClasses.map((cls) => (
                                <div key={cls.id} onClick={async () => { const cd = await getClass(cls.id); setJoinedClass(cd); }}
                                    className="glass-card glass-card-hover"
                                    style={{ padding: '1rem 1.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: 'white' }}>{cls.name}</div>
                                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Code: {cls.code} | {cls.memberIds?.length || 0} members</div>
                                    </div>
                                    <div style={{ color: '#818cf8', fontWeight: '600', fontSize: '0.875rem' }}>Enter &rarr;</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Card className="animate-fade-in" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏫</div>
                    <h2 className="mb-3">Join a Class</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Enter the 6-character code provided by your teacher to join the class.
                    </p>

                    <form onSubmit={handleJoinClass} className="flex-col gap-3">
                        <input
                            type="text"
                            className="input"
                            placeholder="Class Code (e.g. AB12CD)"
                            value={classCode}
                            onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                            maxLength={6}
                            style={{
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase'
                            }}
                            disabled={joining}
                        />

                        {error && (
                            <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>
                                {error}
                            </div>
                        )}

                        <Button
                            variant="primary"
                            size="lg"
                            className="full-width"
                            type="submit"
                            disabled={joining || classCode.length < 6}
                        >
                            {joining ? 'Joining...' : 'Join Class'}
                        </Button>
                    </form>
                </Card>
            </div>
        </main>
    );
}
