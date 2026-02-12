'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QRCodeCanvas } from 'qrcode.react';
import { createLeaderGridCode, getLeaderGridCodes, deleteLeaderGridCode, LeaderGridCode } from '@/lib/leadergrid';
import { onAuthStateChange } from '@/lib/auth';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { Icons } from '@/components/picpick/Icons';
import { getClassLeaderboard, ClassMember, removeStudentFromClass, adjustStudentPoints, bulkAdjustClassPoints } from '@/lib/scoring';
import { getUserProfile } from '@/lib/auth';

interface StudentData extends ClassMember {
    lifetimePoints: number;
    email: string;
    photoURL?: string | null;
}

export default function HostLeaderGridPage() {
    const params = useParams();
    const classId = params.classId as string;
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'codes' | 'points'>('codes');
    const [codes, setCodes] = useState<LeaderGridCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQRModal, setShowQRModal] = useState<LeaderGridCode | null>(null);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newPoints, setNewPoints] = useState(100);
    const [newMaxScans, setNewMaxScans] = useState<string>(''); // Empty for unlimited
    const [newExpiresAt, setNewExpiresAt] = useState('');
    const [isUniversal, setIsUniversal] = useState(false);
    const [creating, setCreating] = useState(false);

    // Student Management State
    const [students, setStudents] = useState<StudentData[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [pointsInput, setPointsInput] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkPointsInput, setBulkPointsInput] = useState('');

    useEffect(() => {
        if (activeTab === 'points' && classId) {
            loadStudents();
            const interval = setInterval(loadStudents, 10000);
            return () => clearInterval(interval);
        }
    }, [activeTab, classId]);

    const loadStudents = async () => {
        try {
            const members = await getClassLeaderboard(classId, 200);
            const studentsWithData = await Promise.all(
                members.map(async (member) => {
                    const profile = await getUserProfile(member.userId);
                    return {
                        ...member,
                        lifetimePoints: profile?.lifetimePoints || 0,
                        email: profile?.email || 'Unknown',
                        photoURL: profile?.photoURL || null
                    };
                })
            );
            setStudents(studentsWithData);
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        if (!confirm('Are you sure you want to remove this student from the class?')) return;

        setProcessing(true);
        try {
            await removeStudentFromClass(classId, studentId);
            await loadStudents();
            alert('Student removed successfully');
        } catch (error) {
            console.error('Error removing student:', error);
            alert('Failed to remove student');
        } finally {
            setProcessing(false);
        }
    };

    const handleAdjustPoints = async (studentId: string, change: number) => {
        setProcessing(true);
        try {
            await adjustStudentPoints(classId, studentId, change);
            await loadStudents();
            setSelectedStudent(null);
            setPointsInput('');
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
        await handleAdjustPoints(studentId, points);
    };

    const handleBulkAdjust = async () => {
        const points = parseInt(bulkPointsInput);
        if (isNaN(points) || points === 0) {
            alert('Please enter a valid number');
            return;
        }

        setProcessing(true);
        try {
            await bulkAdjustClassPoints(classId, points);
            await loadStudents();
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

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (!u) router.push('/login');
            setUser(u);
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        loadCodes();
    }, [user, classId]);

    const loadCodes = async () => {
        try {
            const data = await getLeaderGridCodes(user.uid, classId);
            setCodes(data);
        } catch (error) {
            console.error('Error loading codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await createLeaderGridCode(
                user.uid,
                isUniversal ? null : classId,
                newName,
                newDescription,
                newPoints,
                newMaxScans ? parseInt(newMaxScans) : null,
                newExpiresAt ? new Date(newExpiresAt) : null
            );
            await loadCodes();
            setShowCreateModal(false);
            setNewName('');
            setNewDescription('');
            setNewPoints(100);
            setNewMaxScans('');
            setNewExpiresAt('');
            setIsUniversal(false);
        } catch (error) {
            console.error('Error creating code:', error);
            alert('Failed to create code. Check console for details.');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (codeId: string) => {
        if (!confirm('Are you sure you want to delete this code? This cannot be undone.')) return;
        try {
            await deleteLeaderGridCode(codeId);
            setCodes(codes.filter(c => c.id !== codeId));
        } catch (error) {
            console.error('Error deleting code:', error);
            alert('Failed to delete code.');
        }
    };

    const downloadQR = (code: LeaderGridCode) => {
        // We need to find the canvas element generated by QRCodeCanvas
        // Since we are iterating, we can't easily use refs for all of them without a map.
        // A simpler way is to render a hidden canvas or just use the one in the card if we can select it.
        // Or, we can just generate a new data URL on the fly using a library helper if available, 
        // but QRCodeCanvas renders a canvas.
        // Let's rely on the fact that we can select the canvas within the specific card or modal.
        // Actually, let's just use the one in the "Show" modal if open, or generate one.

        // Better approach: Render a hidden QRCodeCanvas for download or just use the API for download link which is easier?
        // No, user wants to avoid API if possible for reliability.
        // Let's select the canvas from the DOM.

        // We will add an ID to the canvas container in the map.
        const canvas = document.querySelector(`#qr-canvas-${code.id} canvas`) as HTMLCanvasElement;
        if (canvas) {
            const pngFile = canvas.toDataURL("image/png");
            const downloadLink = document.createElement("a");
            downloadLink.download = `LeaderGrid-${code.name}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        } else {
            alert("Could not generate download. Please try opening the 'Show' modal first.");
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-transparent text-white/60">Loading...</div>;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    return (
        <main className="min-h-screen bg-transparent transition-colors duration-300">
            <HostMenu currentPage="Leader Grid" classId={classId} />

            <div className="max-w-6xl mx-auto p-6 pt-10">
                {/* Dashboard Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl text-yellow-600 dark:text-yellow-400">
                                <span className="text-3xl">🏆</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white dark:text-white">Leader Grid Dashboard</h1>
                                <p className="text-white/60 dark:text-gray-400">Manage redemption codes and student points.</p>
                            </div>
                        </div>
                        <button
                            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm border border-slate-700"
                            onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                        >
                            ← Back to Class
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-white/20 dark:border-slate-700">
                        <button
                            onClick={() => setActiveTab('codes')}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'codes'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-white/60 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Manage QR Codes
                            {activeTab === 'codes' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('points')}
                            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'points'
                                ? 'text-indigo-600 dark:text-indigo-400'
                                : 'text-white/60 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Manage Student Points
                            {activeTab === 'points' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'codes' ? (
                    <div className="animate-fade-in">
                        <div className="flex justify-end mb-6">
                            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                + Create New Code
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {codes.map((code) => (
                                <div key={code.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/10 dark:border-slate-700 flex flex-col relative group hover:shadow-md transition-all">
                                    {code.classId === null && (
                                        <div className="absolute top-4 right-4 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold px-2 py-1 rounded-full">
                                            Universal
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 mb-4">
                                        <div id={`qr-canvas-${code.id}`} className="bg-white p-2 rounded-lg border border-white/10 shadow-sm cursor-pointer" onClick={() => setShowQRModal(code)}>
                                            <QRCodeCanvas
                                                value={`${baseUrl}/redeem?code=${code.code}`}
                                                size={64}
                                                level="L"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-white dark:text-white">{code.name}</h3>
                                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                {code.points} <span className="text-sm font-medium text-gray-400">pts</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6 flex-1">
                                        <p className="text-sm text-white/70 dark:text-gray-300 italic mb-2">
                                            "{code.description}"
                                        </p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60">Code:</span>
                                            <span className="font-mono font-bold bg-gray-100 dark:bg-slate-700 text-white dark:text-white px-2 rounded">{code.code}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60">Scans:</span>
                                            <span className="font-medium text-white dark:text-white">
                                                {code.currentScans} / {code.maxScans === null ? '∞' : code.maxScans}
                                            </span>
                                        </div>
                                        {code.expiresAt && (
                                            <div className="flex justify-between text-sm text-red-500 font-medium">
                                                <span>Expires:</span>
                                                <span>{code.expiresAt.toDate().toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <Button
                                            variant="secondary"
                                            className="flex-1 text-sm !bg-gray-100 !text-gray-700 hover:!bg-gray-200 dark:!bg-slate-700 dark:!text-gray-300 dark:hover:!bg-slate-600"
                                            onClick={() => setShowQRModal(code)}
                                        >
                                            Show
                                        </Button>
                                        <button
                                            onClick={() => downloadQR(code)}
                                            className="p-2 bg-gray-100 dark:bg-slate-700 text-white/70 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                            title="Download QR"
                                        >
                                            <Icons.Download className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                            title="Delete"
                                        >
                                            <Icons.Trash className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {codes.length === 0 && (
                            <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-slate-600">
                                <div className="text-6xl mb-4 opacity-50">🏷️</div>
                                <h3 className="text-xl font-bold text-white dark:text-white mb-2">No Codes Yet</h3>
                                <p className="text-white/60 dark:text-gray-400 mb-6">Create your first QR code to award points!</p>
                                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                                    Create Code
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        {/* Header Actions */}
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-white/60 dark:text-gray-400">
                                {students.length} student{students.length !== 1 ? 's' : ''} in class
                            </p>
                            <Button
                                variant="primary"
                                onClick={() => setShowBulkModal(true)}
                                className="bg-indigo-200 hover:bg-indigo-300 !text-black shadow-lg shadow-indigo-500/30 border border-indigo-300"
                            >
                                ✨ Add Points to All
                            </Button>
                        </div>

                        {/* Bulk Points Modal */}
                        {showBulkModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full p-6 border border-white/10 dark:border-slate-700 animate-scale-in">
                                    <h2 className="text-2xl font-bold text-white dark:text-white mb-2">
                                        Add Points to Everyone
                                    </h2>
                                    <p className="text-white/60 dark:text-gray-400 mb-6">
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
                                            className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-white/10 backdrop-blur-sm text-white dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                            style={{ color: '#000', backgroundColor: '#fff' }}
                                            autoFocus
                                        />
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowBulkModal(false);
                                                setBulkPointsInput('');
                                            }}
                                            disabled={processing}
                                            className="px-4 py-2 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
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

                        {/* Students List */}
                        <div className="bg-transparent">
                            {students.length === 0 ? (
                                <div className="text-center py-16 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 dark:border-slate-700">
                                    <div className="text-6xl mb-4">👥</div>
                                    <h3 className="text-xl font-bold text-white dark:text-white mb-2">No Students Yet</h3>
                                    <p className="text-white/60 dark:text-gray-400">
                                        Students will appear here when they join your class
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {students.map((student, index) => {
                                        const isTop3 = index < 3;
                                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

                                        return (
                                            <div
                                                key={student.userId}
                                                className={`relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-white/10 dark:border-slate-700 flex flex-col items-center text-center transition-all hover:shadow-lg hover:-translate-y-1 group ${isTop3 ? 'ring-2 ring-yellow-400/50 dark:ring-yellow-500/30' : ''
                                                    }`}
                                            >
                                                {/* Rank Badge */}
                                                <div className="absolute top-4 left-4 text-2xl font-black drop-shadow-md">
                                                    {medal || <span className="text-gray-400 text-lg">#{index + 1}</span>}
                                                </div>

                                                {/* Profile Image */}
                                                <div className="relative mb-4">
                                                    <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${isTop3 ? 'border-yellow-400' : 'border-white/10 dark:border-slate-700'} shadow-lg`}>
                                                        {student.photoURL ? (
                                                            <img src={student.photoURL} alt={student.nickname} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className={`w-full h-full flex items-center justify-center text-4xl ${isTop3 ? 'bg-yellow-100 text-yellow-600' : 'bg-indigo-100 text-indigo-600 dark:bg-slate-700 dark:text-indigo-400'}`}>
                                                                {student.nickname.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isTop3 && (
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                            TOP {index + 1}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Name & Email */}
                                                <h3 className="font-bold text-lg text-white dark:text-white truncate w-full mb-1">
                                                    {student.nickname}
                                                </h3>
                                                <p className="text-xs text-white/60 dark:text-gray-400 truncate w-full mb-4">
                                                    {student.email}
                                                </p>

                                                {/* Points */}
                                                <div className="w-full grid grid-cols-2 gap-2 mb-6">
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-xl">
                                                        <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                                                            {student.score}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-wider">
                                                            Class Pts
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 dark:bg-slate-700/50 p-2 rounded-xl">
                                                        <div className="text-lg font-bold text-white/70 dark:text-gray-300">
                                                            {student.lifetimePoints}
                                                        </div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                            Lifetime
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="w-full mt-auto pt-4 border-t border-white/10 dark:border-slate-700">
                                                    {selectedStudent === student.userId ? (
                                                        <div className="flex flex-col gap-2 animate-fade-in">
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="number"
                                                                    value={pointsInput}
                                                                    onChange={(e) => setPointsInput(e.target.value)}
                                                                    placeholder="±pts"
                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white/10 backdrop-blur-sm text-sm"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    onClick={() => handleCustomPointsAdjust(student.userId)}
                                                                    disabled={processing}
                                                                    className="flex-1 py-1 text-xs"
                                                                >
                                                                    Apply
                                                                </Button>
                                                                <Button
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setSelectedStudent(null);
                                                                        setPointsInput('');
                                                                    }}
                                                                    disabled={processing}
                                                                    className="flex-1 py-1 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <button
                                                                onClick={() => handleAdjustPoints(student.userId, 10)}
                                                                disabled={processing}
                                                                className="col-span-1 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 rounded-lg py-1.5 text-xs font-bold transition-colors"
                                                                title="+10 Points"
                                                            >
                                                                +10
                                                            </button>
                                                            <button
                                                                onClick={() => handleAdjustPoints(student.userId, -10)}
                                                                disabled={processing}
                                                                className="col-span-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 rounded-lg py-1.5 text-xs font-bold transition-colors"
                                                                title="-10 Points"
                                                            >
                                                                -10
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStudent(student.userId);
                                                                    setPointsInput('');
                                                                }}
                                                                disabled={processing}
                                                                className="col-span-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg py-1.5 flex items-center justify-center transition-colors"
                                                                title="Custom Amount"
                                                            >
                                                                <span className="text-xs">✏️</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleRemoveStudent(student.userId)}
                                                                disabled={processing}
                                                                className="col-span-1 bg-gray-100 hover:bg-red-100 dark:bg-slate-700 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-600 dark:text-white/60 dark:hover:text-red-400 rounded-lg py-1.5 flex items-center justify-center transition-colors"
                                                                title="Remove Student"
                                                            >
                                                                <Icons.Trash className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-2xl animate-bounce-in">
                        <h2 className="text-2xl font-bold text-white dark:text-white mb-6">Create New Code</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Early Bird Bonus"
                                    className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">How to Earn (Description)</label>
                                <input
                                    type="text"
                                    required
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="e.g. Arrive before 9:00 AM"
                                    className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={newPoints}
                                    onChange={(e) => setNewPoints(parseInt(e.target.value))}
                                    className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Scans (Optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newMaxScans}
                                    onChange={(e) => setNewMaxScans(e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration (Optional)</label>
                                <input
                                    type="datetime-local"
                                    value={newExpiresAt}
                                    onChange={(e) => setNewExpiresAt(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-white/20 dark:border-slate-600 bg-transparent text-white dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="universal"
                                    checked={isUniversal}
                                    onChange={(e) => setIsUniversal(e.target.checked)}
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="universal" className="text-sm text-gray-700 dark:text-gray-300">
                                    Universal Code (Works in any class)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <Button type="submit" variant="primary" disabled={creating} className="flex-1">
                                    {creating ? 'Creating...' : 'Create Code'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR Projector Modal */}
            {showQRModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    style={{ backgroundColor: '#000000' }}
                >
                    <div className="text-center flex flex-col items-center animate-fade-in max-w-4xl w-full relative z-[10000]">
                        <h2 className="text-5xl font-black text-white mb-4">{showQRModal.name}</h2>
                        <p className="text-2xl text-gray-300 mb-6 italic">"{showQRModal.description}"</p>
                        <div className="text-3xl font-bold text-indigo-400 mb-12">
                            Scan for +{showQRModal.points} Points!
                        </div>

                        <div className="bg-white p-8 rounded-3xl shadow-2xl mb-8 inline-block ring-8 ring-white/10">
                            <QRCodeCanvas
                                value={`${baseUrl}/redeem?code=${showQRModal.code}`}
                                size={400}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <div className="text-2xl text-gray-400 font-mono tracking-widest mb-8">
                            Code: {showQRModal.code}
                        </div>

                        <button
                            onClick={() => setShowQRModal(null)}
                            className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-sm border border-white/20 font-medium text-lg flex items-center gap-2"
                        >
                            <Icons.Close className="w-5 h-5" />
                            Close Projection
                        </button>

                        <div className="mt-8 text-sm text-white/60">
                            Scans: {showQRModal.currentScans} / {showQRModal.maxScans === null ? '∞' : showQRModal.maxScans}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
