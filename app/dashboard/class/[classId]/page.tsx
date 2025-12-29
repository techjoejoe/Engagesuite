'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Button from '@/components/Button';
import { onAuthStateChange } from '@/lib/auth';
import { getClass, Class } from '@/lib/classes';

import { resetAllEnergy } from '@/lib/energy';

export default function ClassDashboard() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
            } else {
                if (classId) {
                    const data = await getClass(classId);
                    if (data && data.hostId === user.uid) {
                        setClassData(data);
                    } else {
                        // Class not found or not authorized
                        router.push('/dashboard');
                    }
                }
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, [router, classId]);

    const handleResetEnergy = async () => {
        if (confirm("Reset everyone's energy meter to 100%?")) {
            await resetAllEnergy(classId);
        }
    };

    if (loading) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="animate-pulse">Loading Class...</div>
            </div>
        );
    }

    if (!classData) return null;

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '1200px', paddingBottom: '4rem' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                            {classData.name}
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                            Select a tool to engage your class.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button
                            variant="secondary"
                            onClick={handleResetEnergy}
                            style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#a5b4fc'
                            }}
                        >
                            ⚡ Reset Energy
                        </Button>
                        <Button variant="glass" onClick={() => router.push('/dashboard')}>
                            ← Back to All Classes
                        </Button>
                    </div>
                </div>

                {/* Tools Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {/* PicPick */}
                    <ToolCard
                        icon="📸"
                        title="PicPick"
                        description="Run a photo contest where learners vote for their favorite images."
                        status="coming-soon"
                    />

                    {/* The Randomizer */}
                    <ToolCard
                        icon="🎡"
                        title="The Randomizer"
                        description="A spinning wheel to randomly select learners or topics."
                        status="coming-soon"
                    />

                    {/* LiveVote (Create Poll) */}
                    <ToolCard
                        icon="📊"
                        title="LiveVote"
                        description="Engage your class with real-time polls and see instant results."
                        status="active"
                        action={() => router.push(`/host/poll/create?classId=${classId}`)}
                        actionLabel="Launch"
                    />

                    {/* QuizBattle (Create Trivia) */}
                    <ToolCard
                        icon="⚡"
                        title="QuizBattle"
                        description="Test knowledge with fun, interactive quizzes and leaderboards."
                        status="active"
                        action={() => router.push(`/host/create?classId=${classId}`)}
                        actionLabel="Launch"
                    />

                    {/* Tickr */}
                    <ToolCard
                        icon="⏱️"
                        title="Tickr"
                        description="A shared timer for activities, breaks, or presentations."
                        status="coming-soon"
                    />

                    {/* WordStorm */}
                    <ToolCard
                        icon="☁️"
                        title="WordStorm"
                        description="Visualize real-time feedback with a dynamic word cloud."
                        status="coming-soon"
                    />

                    {/* Buzzer */}
                    <ToolCard
                        icon="🔔"
                        title="Buzzer"
                        description="A virtual buzzer system for class competitions and games."
                        status="coming-soon"
                    />

                    {/* Parking Lot */}
                    <ToolCard
                        icon="🚙"
                        title="Parking Lot"
                        description="A digital space to 'park' questions or ideas for later."
                        status="active"
                        action={() => router.push(`/host/parkinglot/${classId}`)}
                        actionLabel="Open"
                        badge="New!"
                    />

                    {/* Leader Grid */}
                    <ToolCard
                        icon="🏆"
                        title="Leader Grid"
                        description="Award points to learners by scanning a unique QR code."
                        status="coming-soon"
                    />

                    {/* Workbooks (New!) */}
                    <ToolCard
                        icon="📚"
                        title="Workbooks"
                        description="Assign self-paced albums and worksheets to the class."
                        status="active"
                        action={() => setShowAssignModal(true)}
                        actionLabel="Assign"
                        badge="New!"
                    />
                </div>
            </div>

            <AssignmentModal
                isOpen={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                classId={classId}
            />
        </main>
    );
}

import { getDesignerAlbums, assignAlbumToClass, getStudentAssignments, AlbumTemplate, ClassAlbum } from '@/lib/albums';
import { getCurrentUser } from '@/lib/auth';

const AssignmentModal = ({ isOpen, onClose, classId }: { isOpen: boolean, onClose: () => void, classId: string }) => {
    const [tab, setTab] = useState<'assign' | 'manage'>('assign');
    const [albums, setAlbums] = useState<AlbumTemplate[]>([]);
    const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);

    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        const load = async () => {
            const user = getCurrentUser();
            if (user) {
                // Load Templates
                const userAlbums = await getDesignerAlbums(user.uid);
                setAlbums(userAlbums);

                // Load Active Assignments
                const active = await getStudentAssignments(classId);
                setActiveAssignments(active);
            }
            setLoading(false);
        };
        load();
    }, [isOpen, classId]);

    const handleAssign = async (templateId: string) => {
        const user = getCurrentUser();
        if (!user) return;
        setAssigning(templateId);
        try {
            await assignAlbumToClass(templateId, classId, user.uid);
            // Refresh details
            const active = await getStudentAssignments(classId);
            setActiveAssignments(active);
            alert("Workbook assigned successfully!");
            setTab('manage'); // Switch tab to see it
        } catch (e) {
            console.error("Failed to assign", e);
            alert("Error assigning workbook");
        } finally {
            setAssigning(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Manage Workbooks</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="flex gap-4 border-b border-gray-100 mb-4 pb-1">
                    <button
                        onClick={() => setTab('assign')}
                        className={`pb-2 text-sm font-bold transition-colors ${tab === 'assign' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Assign New
                    </button>
                    <button
                        onClick={() => setTab('manage')}
                        className={`pb-2 text-sm font-bold transition-colors ${tab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Active Assignments ({activeAssignments.length})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-1">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading library...</div>
                    ) : tab === 'assign' ? (
                        albums.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500 mb-4">You haven't designed any albums yet.</p>
                                <Button variant="primary" onClick={() => window.location.href = '/host/design'}>Go to Designer</Button>
                            </div>
                        ) : (
                            albums.map(album => (
                                <div key={album.id} className="border border-gray-100 p-4 rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{album.title}</h3>
                                        <p className="text-sm text-gray-400">{album.pages?.length || 0} Pages • {album.totalPointsAvailable} Pts</p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => handleAssign(album.id)}
                                        disabled={assigning === album.id}
                                        className="bg-blue-600 text-white"
                                    >
                                        {assigning === album.id ? 'Assigning...' : 'Assign'}
                                    </Button>
                                </div>
                            ))
                        )
                    ) : (
                        // Manage View
                        activeAssignments.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">No active workbooks for this class.</div>
                        ) : (
                            activeAssignments.map(assign => (
                                <div key={assign.id} className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800">{assign.title}</h3>
                                        <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Active</p>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        onClick={() => router.push(`/host/class/${classId}/workbook/${assign.id}`)}
                                        className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                                    >
                                        View Report
                                    </Button>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

interface ToolCardProps {
    icon: string;
    title: string;
    description: string;
    status: 'active' | 'coming-soon';
    action?: () => void;
    actionLabel?: string;
    badge?: string;
}

function ToolCard({ icon, title, description, status, action, actionLabel, badge }: ToolCardProps) {
    return (
        <div className="card glass-hover" style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            position: 'relative',
        }}>
            {badge && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#EF4444',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    {badge}
                </div>
            )}
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>{title}</h3>
            <p style={{
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                fontSize: '0.9rem',
                flex: 1,
                lineHeight: '1.5'
            }}>
                {description}
            </p>

            {status === 'active' ? (
                <Button
                    variant="primary"
                    className="full-width"
                    onClick={action}
                    style={{
                        background: 'var(--gradient-primary)',
                        border: 'none'
                    }}
                >
                    {actionLabel || 'Launch'}
                </Button>
            ) : (
                <Button
                    variant="glass"
                    className="full-width"
                    disabled
                    style={{
                        opacity: 0.5,
                        cursor: 'not-allowed',
                        background: 'rgba(255, 255, 255, 0.05)'
                    }}
                >
                    Coming Soon
                </Button>
            )}
        </div>
    );
}
