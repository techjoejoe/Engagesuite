'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import HamburgerMenu from '@/components/HamburgerMenu';
import { onAuthStateChange } from '@/lib/auth';
import { getClass, onClassChange, Class, updateClassActivity } from '@/lib/classes';

import { User } from 'firebase/auth';
import { logEvent } from '@/lib/analytics';
import HostMenu from '@/components/HostMenu';
import { getStudentAssignments, ClassAlbum } from '@/lib/albums';

function ClassDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((currentUser) => {
            if (!currentUser) {
                router.push('/login');
            } else {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!classId || !user) return;

        const unsubscribe = onClassChange(classId, (data) => {
            if (data && data.hostId === user.uid) {
                setClassData(data);
            } else {
                if (data) router.push('/dashboard');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [classId, user, router]);

    // Clear active tools and reset activity when dashboard loads
    useEffect(() => {
        if (classId) {
            import('@/lib/tools').then(({ updateToolState }) => {
                updateToolState(classId, 'dice', { active: false });
                updateToolState(classId, 'coin', { active: false });
            });

            // Reset current activity so students return to dashboard
            updateClassActivity(classId, { type: 'none' });
        }
    }, [classId]);

    // Fetch active workbook assignments
    useEffect(() => {
        if (!classId) return;
        getStudentAssignments(classId).then(setActiveAssignments);
    }, [classId, showAssignModal]); // Refetch when modal closes

    const handleStopActivity = async () => {
        if (!classId) return;
        if (confirm('Are you sure you want to stop the current activity and return all students to the dashboard?')) {
            await updateClassActivity(classId, { type: 'none' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="animate-pulse text-xl font-semibold text-white/70 dark:text-gray-300">Loading Class...</div>
            </div>
        );
    }

    if (!classData) return null;

    return (
        <main className="min-h-screen p-6 overflow-y-auto transition-colors duration-300">
            <HostMenu currentPage="Class" classId={classId || undefined} />
            <div className="container mx-auto max-w-7xl pb-16">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold text-white">
                                {classData.name}
                            </h1>
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-bold border border-blue-500/30">
                                {classData.code}
                            </span>
                        </div>
                        <p className="text-gray-300 text-sm">
                            Select a tool to engage your class.
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Button variant="secondary" onClick={handleStopActivity} className="bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 whitespace-nowrap">
                            ⏹️ Stop Activity
                        </Button>
                        <Button variant="primary" onClick={() => router.push(`/dashboard/class/students?id=${classId}`)}>
                            👥 Manage Students
                        </Button>
                        <Button variant="glass" onClick={() => router.push(`/host/class/${classId}/projector`)}>
                            📽️ Projector View
                        </Button>
                        <Button variant="glass" onClick={() => router.push('/dashboard')}>
                            ← Back to All Classes
                        </Button>
                    </div>
                </div>

                {/* Active Workbooks Section */}
                {activeAssignments.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📚</span> Active Workbooks
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeAssignments.map(assign => (
                                <div key={assign.id} className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/15 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-white text-lg truncate pr-2">{assign.title}</h3>
                                        <span className="bg-green-500/20 text-green-300 text-xs px-2 py-1 rounded font-bold uppercase tracking-wider">
                                            Active
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-sm mb-4">
                                        {assign.totalPointsAvailable} Points Available
                                    </div>
                                    <button
                                        onClick={() => router.push(`/host/class/${classId}/workbook/${assign.id}`)}
                                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        View Gradebook →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">

                    {/* PicPick */}
                    <ToolCard
                        icon="📸"
                        title="PicPick"
                        description="Run a photo contest where learners vote for their favorite images."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'PicPick', classId }); router.push(`/host/picpick/launch?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-cyan-500"
                    />

                    {/* The Randomizer */}
                    <ToolCard
                        icon="🎡"
                        title="The Randomizer"
                        description="A spinning wheel to randomly select learners or topics."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Randomizer', classId }); router.push(`/host/randomizer?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-orange-500"
                    />

                    {/* LiveVote (Create Poll) */}
                    <ToolCard
                        icon="📊"
                        title="LiveVote"
                        description="Engage your class with real-time polls and see instant results."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'LiveVote', classId }); router.push(`/host/poll/create?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-green-500"
                    />

                    {/* QuizBattle (Create Trivia) */}
                    <ToolCard
                        icon="⚡"
                        title="QuizBattle"
                        description="Test knowledge with fun, interactive quizzes and leaderboards."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'QuizBattle', classId }); router.push(`/host/quizbattle?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-red-500"
                    />

                    {/* Tickr */}
                    <ToolCard
                        icon="⏱️"
                        title="Tickr"
                        description="A shared timer for activities, breaks, or presentations."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Tickr', classId }); router.push(`/host/tickr/launch?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-orange-600"
                    />

                    {/* WordStorm */}
                    <ToolCard
                        icon="☁️"
                        title="WordStorm"
                        description="Visualize real-time feedback with a dynamic word cloud."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'WordStorm', classId }); router.push(`/host/wordstorm/launch?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-blue-500"
                    />

                    {/* Commitment Wall */}
                    <ToolCard
                        icon="🧱"
                        title="Commitment Wall"
                        description="A shared wall for students to post their commitments to success."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Commitment Wall', classId }); router.push(`/host/commitment/launch?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-pink-600"
                        badge="New!"
                    />

                    {/* Buzzer */}
                    <ToolCard
                        icon="🔔"
                        title="Buzzer"
                        description="A virtual buzzer system for class competitions and games."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Buzzer', classId }); router.push(`/host/buzzer/launch?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-red-600"
                    />

                    {/* Dice Roll */}
                    <ToolCard
                        icon="🎲"
                        title="Dice Roll"
                        description="Roll a die to pick a number or make a decision."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Dice Roll', classId }); router.push(`/host/dice?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-indigo-500"
                        badge="New!"
                    />

                    {/* Coin Flip */}
                    <ToolCard
                        icon="🪙"
                        title="Coin Flip"
                        description="Flip a coin to settle a debate or choose sides."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Coin Flip', classId }); router.push(`/host/coin?classId=${classId}`); }}
                        actionLabel="Launch"
                        color="bg-yellow-500"
                        badge="New!"
                    />

                    {/* Parking Lot */}
                    <ToolCard
                        icon="🚙"
                        title="Parking Lot"
                        description="A digital space to 'park' questions or ideas for later."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Parking Lot', classId }); router.push(`/host/parkinglot/${classId}`); }}
                        actionLabel="Launch"
                        color="bg-blue-600"
                    />

                    {/* Leader Grid */}
                    <ToolCard
                        icon="🏆"
                        title="Leader Grid"
                        description="Award points to learners by scanning a unique QR code."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Leader Grid', classId }); router.push(`/host/leadergrid/${classId}`); }}
                        actionLabel="Launch"
                        color="bg-yellow-500"
                    />

                    {/* Badge Library */}
                    <ToolCard
                        icon="🏅"
                        title="Badge Library"
                        description="Create and manage custom badges for your students."
                        status="active"
                        action={() => { logEvent('tool_launch', { toolName: 'Badge Library', classId }); router.push('/host/badges'); }}
                        actionLabel="Manage"
                        color="bg-yellow-600"
                    />

                    {/* Workbooks (New!) */}
                    <ToolCard
                        icon="📚"
                        title="Workbooks"
                        description="Assign self-paced workbooks and worksheets to the class."
                        status="active"
                        action={() => setShowAssignModal(true)}
                        actionLabel="Assign"
                        color="bg-indigo-600"
                        badge="New!"
                    />
                </div>
            </div>

            {classId && (
                <AssignmentModal
                    isOpen={showAssignModal}
                    onClose={() => setShowAssignModal(false)}
                    classId={classId}
                />
            )}
        </main>
    );
}

// Assignment Modal Component
import { getDesignerAlbums, assignAlbumToClass, AlbumTemplate, unassignWorkbook } from '@/lib/albums';
import { getCurrentUser } from '@/lib/auth';

const AssignmentModal = ({ isOpen, onClose, classId }: { isOpen: boolean, onClose: () => void, classId: string }) => {
    const [tab, setTab] = useState<'assign' | 'manage'>('assign');
    const [albums, setAlbums] = useState<AlbumTemplate[]>([]);
    const [activeAssignments, setActiveAssignments] = useState<ClassAlbum[]>([]);

    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [unassigning, setUnassigning] = useState<string | null>(null);
    const [confirmUnassign, setConfirmUnassign] = useState<string | null>(null); // ID of workbook to confirm unassign
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

    const handleUnassignClick = (assignmentId: string) => {
        setConfirmUnassign(assignmentId); // Show confirmation modal
    };

    const handleUnassignConfirm = async () => {
        if (!confirmUnassign) return;
        const assignmentId = confirmUnassign;
        setConfirmUnassign(null); // Close confirmation modal
        setUnassigning(assignmentId);
        try {
            await unassignWorkbook(assignmentId, false);
            const active = await getStudentAssignments(classId);
            setActiveAssignments(active);
        } catch (err) {
            console.error('Failed to unassign:', err);
            alert('Failed to unassign workbook');
        } finally {
            setUnassigning(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-fade-in-up">

                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Manage Workbooks</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white/70">✕</button>
                </div>

                <div className="flex gap-4 border-b border-white/10 mb-4 pb-1">
                    <button
                        onClick={() => setTab('assign')}
                        className={`pb-2 text-sm font-bold transition-colors ${tab === 'assign' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-white/70'}`}
                    >
                        Assign New
                    </button>
                    <button
                        onClick={() => setTab('manage')}
                        className={`pb-2 text-sm font-bold transition-colors ${tab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-white/70'}`}
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
                                <p className="text-white/60 mb-4">You haven't designed any workbooks yet.</p>
                                <Button variant="primary" onClick={() => window.location.href = '/host/design'}>Go to Designer</Button>
                            </div>
                        ) : (
                            albums.map(album => (
                                <div key={album.id} className="border border-white/10 p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors">
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
                                    <div className="flex gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() => router.push(`/host/class/${classId}/workbook/${assign.id}`)}
                                            className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"
                                        >
                                            View Report
                                        </Button>
                                        <button
                                            type="button"
                                            onClick={() => handleUnassignClick(assign.id)}
                                            disabled={unassigning === assign.id}
                                            className="px-4 py-2 text-sm font-bold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {unassigning === assign.id ? 'Removing...' : 'Unassign'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* Confirmation Modal for Unassign */}
            {confirmUnassign && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-3xl">⚠️</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Unassign Workbook?</h3>
                            <p className="text-white/70 mb-6">
                                This will remove the workbook from the class. <br />
                                <strong className="text-green-600">Student progress will be kept.</strong>
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmUnassign(null)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUnassignConfirm}
                                    className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
                                >
                                    Yes, Unassign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function ClassDashboard() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-pulse text-xl font-semibold text-gray-300">Loading...</div>
            </div>
        }>
            <ClassDashboardContent />
        </Suspense>
    );
}

interface ToolCardProps {
    icon: string;
    title: string;
    description: string;
    status: 'active' | 'coming-soon';
    action?: () => void;
    actionLabel?: string;
    color: string;
    badge?: string;
}

function ToolCard({ icon, title, description, status, action, actionLabel, color, badge }: ToolCardProps) {
    return (
        <div className="glass-card glass-card-hover p-8 flex flex-col items-center text-center h-full group relative">
            {badge && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-pulse">
                    {badge}
                </div>
            )}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6 text-white shadow-md group-hover:scale-110 transition-transform duration-300 ${color}`}>
                {icon}
            </div>
            <h3 className="mb-3 text-xl font-bold text-white">{title}</h3>
            <p className="text-gray-300 mb-6 text-sm flex-1 leading-relaxed">
                {description}
            </p>

            {status === 'active' ? (
                <Button
                    variant="primary"
                    className="w-full"
                    onClick={action}
                >
                    {actionLabel || 'Launch'}
                </Button>
            ) : (
                <Button
                    variant="glass"
                    className="w-full opacity-50 cursor-not-allowed"
                    disabled
                >
                    Coming Soon
                </Button>
            )}
        </div>
    );
}
