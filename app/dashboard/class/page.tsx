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

function ClassDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [user, setUser] = useState<User | null>(null);

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

    // Clear active tools when dashboard loads to prevent stuck states
    useEffect(() => {
        if (classId) {
            import('@/lib/tools').then(({ updateToolState }) => {
                updateToolState(classId, 'dice', { active: false });
                updateToolState(classId, 'coin', { active: false });
            });
        }
    }, [classId]);

    const handleStopActivity = async () => {
        if (!classId) return;
        if (confirm('Are you sure you want to stop the current activity and return all students to the dashboard?')) {
            await updateClassActivity(classId, { type: 'none' });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-pulse text-xl font-semibold text-gray-600 dark:text-gray-300">Loading Class...</div>
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

                {/* Tools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">

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

                    {/* AI Activity Maker */}
                    <ToolCard
                        icon="🤖"
                        title="AI Activity Maker"
                        description="Generate quizzes and activities instantly with AI."
                        status="coming-soon"
                        color="bg-purple-600"
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

                    {/* Share */}
                    <ToolCard
                        icon="📤"
                        title="Share"
                        description="Share an image, or document to your learners mobile device"
                        status="coming-soon"
                        color="bg-teal-500"
                    />
                </div>
            </div>
        </main>
    );
}

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
