'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { onAuthStateChange } from '@/lib/auth';
import { getClass, Class } from '@/lib/classes';
import { getClassLeaderboard, ClassMember, removeStudentFromClass, adjustStudentPoints, bulkAdjustClassPoints, getStudentHistory, PointHistory } from '@/lib/scoring';
import { getUserProfile, UserProfile } from '@/lib/auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { User } from 'firebase/auth';
import HostMenu from '@/components/HostMenu';
import { getHostBadges, awardBadge, Badge } from '@/lib/badges';

interface StudentData extends ClassMember {
    lifetimePoints: number;
    email: string;
}

function StudentsManagementContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const classId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [pointsInput, setPointsInput] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    const [bulkPointsInput, setBulkPointsInput] = useState('');

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [historyData, setHistoryData] = useState<PointHistory[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [viewingStudent, setViewingStudent] = useState<StudentData | null>(null);

    // Badge State
    const [hostBadges, setHostBadges] = useState<Badge[]>([]);
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [studentToAward, setStudentToAward] = useState<StudentData | null>(null);

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

        const loadData = async () => {
            try {
                const cls = await getClass(classId);
                if (cls && cls.hostId === user.uid) {
                    setClassData(cls);
                    await loadStudents(classId);
                    // Load badges
                    getHostBadges(user.uid).then(setHostBadges);
                } else {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Error loading class:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        // Refresh every 10 seconds
        const interval = setInterval(() => loadStudents(classId), 10000);
        return () => clearInterval(interval);
    }, [classId, user, router]);

    const loadStudents = async (cId: string) => {
        try {
            const members = await getClassLeaderboard(cId, 200);
            const studentsWithData = await Promise.all(
                members.map(async (member) => {
                    const profile = await getUserProfile(member.userId);
                    return {
                        ...member,
                        lifetimePoints: profile?.lifetimePoints || 0,
                        email: profile?.email || 'Unknown'
                    };
                })
            );
            setStudents(studentsWithData);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!classId) return;
        if (!confirm('Are you sure you want to remove this student from the class?')) return;

        setProcessing(true);
        try {
            await removeStudentFromClass(classId, studentId);
            await loadStudents(classId);
            alert('Student removed successfully');
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Failed to remove student');
        } finally {
            setProcessing(false);
        }
    };

    const handleAdjustPoints = async (studentId: string, change: number, reason: string = 'Quick Adjustment') => {
        if (!classId) return;

        setProcessing(true);
        try {
            await adjustStudentPoints(classId, studentId, change, user?.uid, reason);
            await loadStudents(classId);
            setSelectedStudent(null);
            setPointsInput('');
            setAdjustmentReason('');
        } catch (error) {
            console.error('Error adjusting points:', error);
            alert('Failed to adjust points');
        } finally {
            setProcessing(false);
        }
    };

    const handleCustomPointsAdjust = async (studentId: string) => {
        const points = parseInt(pointsInput);
        if (isNaN(points) || points === 0) {
            alert('Please enter a valid number');
            return;
        }
        if (!adjustmentReason.trim()) {
            alert('Please provide a reason for this adjustment');
            return;
        }
        await handleAdjustPoints(studentId, points, adjustmentReason);
    };

    const handleBulkAdjust = async () => {
        if (!classId) return;
        const points = parseInt(bulkPointsInput);
        if (isNaN(points) || points === 0) {
            alert('Please enter a valid number');
            return;
        }

        setProcessing(true);
        try {
            await bulkAdjustClassPoints(classId, points, user?.uid);
            await loadStudents(classId);
            setShowBulkModal(false);
            setBulkPointsInput('');
            alert(`Successfully added ${points} points to all students!`);
        } catch (error) {
            console.error('Error bulk adjusting points:', error);
            alert('Failed to update points');
        } finally {
            setProcessing(false);
        }
    };

    const handleViewHistory = async (student: StudentData) => {
        if (!classId) return;
        setViewingStudent(student);
        setShowHistoryModal(true);
        setHistoryLoading(true);
        setHistoryData([]); // Clear previous
        try {
            const history = await getStudentHistory(classId, student.userId);
            setHistoryData(history);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }

    };

    const handleAwardBadge = async (studentId: string, badgeId: string) => {
        if (!user) return;
        setProcessing(true);
        try {
            await awardBadge(studentId, badgeId, user.uid);
            alert('Badge awarded! 🏆');
            setShowBadgeModal(false);
        } catch (error) {
            console.error(error);
            alert('Failed to award badge');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-pulse text-xl font-semibold text-gray-600 dark:text-gray-300">Loading Students...</div>
            </div>
        );
    }

    if (!classData) return null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 p-6 overflow-y-auto transition-colors duration-300">
            <HostMenu currentPage="Students" classId={classId || undefined} />
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-3xl font-bold text-black dark:text-white">
                                Manage Students
                            </h1>
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-black dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-bold border border-indigo-200 dark:border-indigo-800">
                                {classData.name}
                            </span>
                        </div>
                        <p className="text-black dark:text-gray-400 text-sm">
                            {students.length} student{students.length !== 1 ? 's' : ''} in class
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <Button
                            variant="primary"
                            onClick={() => setShowBulkModal(true)}
                            className="bg-indigo-200 hover:bg-indigo-300 !text-black shadow-lg shadow-indigo-500/30 border border-indigo-300"
                        >
                            ✨ Add Points to All
                        </Button>
                        <Button variant="secondary" onClick={() => router.push(`/dashboard/class?id=${classId}`)} className="!text-black bg-white border border-gray-200 hover:bg-gray-50 !bg-none">
                            ← Back to Class
                        </Button>
                    </div>
                </div>

                {/* Bulk Points Modal */}
                {showBulkModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-slate-700 animate-scale-in">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                Add Points to Everyone
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                This will add (or subtract) points for all {students.length} students in the class.
                            </p>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Points Amount
                                </label>
                                <input
                                    type="number"
                                    value={bulkPointsInput}
                                    onChange={(e) => setBulkPointsInput(e.target.value)}
                                    placeholder="e.g. 100 or -50"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                    style={{ color: '#000', backgroundColor: '#fff' }}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowBulkModal(false);
                                        setBulkPointsInput('');
                                    }}
                                    disabled={processing}
                                    className="!bg-transparent !text-gray-500 hover:!text-gray-700 hover:!bg-gray-100 dark:hover:!bg-slate-700"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleBulkAdjust}
                                    disabled={processing || !bulkPointsInput}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {processing ? 'Applying...' : 'Apply to All'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* History Modal */}
                {showHistoryModal && viewingStudent && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-100 dark:border-slate-700 animate-scale-in flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Point History
                                    </h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                        For {viewingStudent.nickname}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowHistoryModal(false)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar border rounded-xl border-gray-100 dark:border-slate-700">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center p-12 text-gray-400">Loading history...</div>
                                ) : historyData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                                        <span className="text-4xl mb-2">📜</span>
                                        <p>No history records found.</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-900 sticky top-0">
                                            <tr>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Create/Reason</th>
                                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Points</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {historyData.map((h, i) => (
                                                <tr key={h.id || i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                                                        {new Date(h.timestamp).toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-900 dark:text-white font-medium">
                                                        {h.reason}
                                                    </td>
                                                    <td className={`p-4 text-sm font-bold text-right ${h.points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {h.points > 0 ? '+' : ''}{h.points}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={() => setShowHistoryModal(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Students List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    {students.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-4">👥</div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Students Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Students will appear here when they join your class
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-black dark:text-gray-400 uppercase tracking-wider">
                                            Rank
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-black dark:text-gray-400 uppercase tracking-wider">
                                            Student
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-black dark:text-gray-400 uppercase tracking-wider">
                                            Class Points
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-black dark:text-gray-400 uppercase tracking-wider">
                                            Lifetime Points
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-black dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {students.map((student, index) => {
                                        const isTop3 = index < 3;
                                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                                        return (
                                            <tr
                                                key={student.userId}
                                                className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${isTop3 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                                                    }`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-2xl font-black text-black dark:text-gray-300">
                                                        {medal || `#${index + 1}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-black dark:text-white">
                                                        {student.nickname}
                                                    </div>
                                                    <div className="text-sm text-black dark:text-gray-400">
                                                        {student.email}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-2xl font-black text-black dark:text-indigo-400">
                                                        {student.score}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="text-lg font-semibold text-black dark:text-gray-400">
                                                        {student.lifetimePoints}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    {selectedStudent === student.userId ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="text"
                                                                value={adjustmentReason}
                                                                onChange={(e) => setAdjustmentReason(e.target.value)}
                                                                placeholder="Reason (required)"
                                                                className="w-32 px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                                                style={{ color: '#000', backgroundColor: '#fff' }}
                                                                disabled={processing}
                                                            />
                                                            <input
                                                                type="number"
                                                                value={pointsInput}
                                                                onChange={(e) => setPointsInput(e.target.value)}
                                                                placeholder="±points"
                                                                className="w-24 px-3 py-1 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
                                                                style={{ color: '#000', backgroundColor: '#fff' }}
                                                                disabled={processing}
                                                            />
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => handleCustomPointsAdjust(student.userId)}
                                                                disabled={processing || !pointsInput || !adjustmentReason.trim()}
                                                            >
                                                                Apply
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedStudent(null);
                                                                    setPointsInput('');
                                                                    setAdjustmentReason('');
                                                                }}
                                                                disabled={processing}
                                                                className="!bg-transparent !text-gray-500 hover:!text-gray-700 hover:!bg-gray-100 dark:hover:!bg-slate-700"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="glass"
                                                                size="sm"
                                                                onClick={() => handleViewHistory(student)}
                                                                className="!text-indigo-500 hover:!text-indigo-600 !px-2"
                                                                title="View History"
                                                            >
                                                                📜
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleAdjustPoints(student.userId, 10)}
                                                                disabled={processing}
                                                                className="!bg-green-100 dark:!bg-green-900/20 !text-black dark:!text-green-400 border border-green-200 dark:border-green-800 hover:!bg-green-200 dark:hover:!bg-green-900/30 !bg-none"
                                                            >
                                                                +10
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setStudentToAward(student);
                                                                    setShowBadgeModal(true);
                                                                }}
                                                                disabled={processing}
                                                                className="!bg-purple-100 dark:!bg-purple-900/20 !text-purple-600 dark:!text-purple-400 border border-purple-200 dark:border-purple-800 hover:!bg-purple-200 !bg-none"
                                                                title="Award Badge"
                                                            >
                                                                🏅
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => handleAdjustPoints(student.userId, -10)}
                                                                disabled={processing}
                                                                className="!bg-red-100 dark:!bg-red-900/20 !text-black dark:!text-red-400 border border-red-200 dark:border-red-800 hover:!bg-red-200 dark:hover:!bg-red-900/30 !bg-none"
                                                            >
                                                                -10
                                                            </Button>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedStudent(student.userId);
                                                                    setPointsInput('');
                                                                }}
                                                                disabled={processing}
                                                                className="!text-black !bg-gray-100 border border-gray-200 hover:!bg-gray-200 !bg-none"
                                                            >
                                                                Custom
                                                            </Button>
                                                            <Button
                                                                variant="danger"
                                                                size="sm"
                                                                onClick={() => handleRemoveStudent(student.userId)}
                                                                disabled={processing}
                                                                className="!text-black !bg-red-500 hover:!bg-red-600 text-white"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Students</div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">{students.length}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Class Points</div>
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                            {students.reduce((sum, s) => sum + s.score, 0)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Avg Points/Student</div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white">
                            {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length) : 0}
                        </div>
                    </div>
                </div>

                {/* Badge Award Modal */}
                {showBadgeModal && studentToAward && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-gray-100 dark:border-slate-700 animate-scale-in flex flex-col max-h-[80vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Award Badge to <span className="text-indigo-500">{studentToAward.nickname}</span>
                                </h2>
                                <button onClick={() => setShowBadgeModal(false)} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="overflow-y-auto p-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {hostBadges.length === 0 ? (
                                    <div className="col-span-full text-center py-8 text-gray-500">
                                        No badges found. <a href="/host/badges" className="text-indigo-400 font-bold hover:underline">Create some badges first!</a>
                                    </div>
                                ) : (
                                    hostBadges.map(badge => (
                                        <button
                                            key={badge.id}
                                            onClick={() => handleAwardBadge(studentToAward.userId, badge.id)}
                                            disabled={processing}
                                            className="flex flex-col items-center p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-transparent hover:border-indigo-500 transition-all hover:scale-105"
                                        >
                                            <img src={badge.imageUrl} alt={badge.name} className="w-16 h-16 object-contain mb-2" />
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">{badge.name}</div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default function StudentsManagement() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
                <div className="animate-pulse text-xl font-semibold text-gray-600 dark:text-gray-300">Loading...</div>
            </div>
        }>
            <StudentsManagementContent />
        </Suspense>
    );
}
