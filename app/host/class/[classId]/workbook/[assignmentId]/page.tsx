"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    getClassAlbum,
    getAlbumTemplate,
    getAlbumProgressForClass,
    ClassAlbum,
    AlbumTemplate,
    AlbumProgress,
    AlbumBlock
} from '@/lib/albums';
import { getClassMembers, getClass, Class } from '@/lib/classes';
import { UserProfile, onAuthStateChange } from '@/lib/auth';
import { gradeAnswer, exportGradebookToCSV, downloadCSV, GradebookEntry } from '@/lib/gradebook';
import HostMenu from '@/components/HostMenu';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    Download,
    ChevronRight,
    ChevronDown,
    Users,
    BarChart3,
    AlertCircle,
    MessageSquare,
    Check,
    X,
    Send,
    Search,
    Filter,
    Eye
} from 'lucide-react';

type ViewMode = 'table' | 'student';
type GradingMode = 'idle' | 'grading';

interface StudentGradeState {
    [blockId: string]: {
        points: number;
        feedback: string;
    }
}

export default function WorkbookGradebook() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;
    const assignmentId = params.assignmentId as string;

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [assignment, setAssignment] = useState<ClassAlbum | null>(null);
    const [template, setTemplate] = useState<AlbumTemplate | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [progressMap, setProgressMap] = useState<{ [studentId: string]: AlbumProgress }>({});

    // UI State
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [expandedPages, setExpandedPages] = useState<string[]>([]);

    // Grading State
    const [gradingState, setGradingState] = useState<StudentGradeState>({});
    const [savingGrades, setSavingGrades] = useState(false);
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Fetch class data
                const cls = await getClass(classId);
                setClassData(cls);

                // Fetch Metadata
                const assignData = await getClassAlbum(assignmentId);
                if (!assignData) throw new Error("Assignment not found");
                setAssignment(assignData);

                const tempData = await getAlbumTemplate(assignData.templateId);
                setTemplate(tempData);

                // Fetch Class Roster
                const roster = await getClassMembers(classId);
                setStudents(roster);

                // Fetch All Progress
                const allProgress = await getAlbumProgressForClass(assignmentId);
                const pMap: any = {};
                allProgress.forEach(p => pMap[p.studentId] = p);
                setProgressMap(pMap);

                // Expand first page by default
                if (tempData?.pages?.[0]) {
                    setExpandedPages([tempData.pages[0].id]);
                }

            } catch (error) {
                console.error("Failed to load gradebook", error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, [classId, assignmentId, router]);

    // Calculate stats
    const stats = {
        totalStudents: students.length,
        avgCompletion: students.length > 0
            ? Math.round(Object.values(progressMap).reduce((sum, p) => sum + (p.percentComplete || 0), 0) / students.length)
            : 0,
        completedCount: Object.values(progressMap).filter(p => p.percentComplete >= 100).length,
        needsGrading: Object.values(progressMap).filter(p => {
            return Object.values(p.answers || {}).some((a: any) =>
                a.needsGrading || (a.awardedPoints === undefined && a.answer)
            );
        }).length
    };

    // Get all questions from template
    const getAllQuestions = (): AlbumBlock[] => {
        if (!template) return [];
        const questions: AlbumBlock[] = [];
        template.pages.forEach(page => {
            page.blocks.forEach(block => {
                if (block.type === 'question') {
                    questions.push(block);
                }
            });
        });
        return questions;
    };

    // Filter students
    const filteredStudents = students.filter(student => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!student.displayName.toLowerCase().includes(query) &&
                !student.email.toLowerCase().includes(query)) {
                return false;
            }
        }

        const prog = progressMap[student.uid];
        if (filterStatus === 'completed' && prog?.percentComplete !== 100) return false;
        if (filterStatus === 'in_progress' && (prog?.percentComplete === 0 || prog?.percentComplete === 100 || !prog)) return false;
        if (filterStatus === 'not_started' && prog?.percentComplete > 0) return false;
        if (filterStatus === 'needs_grading') {
            const hasUngraded = Object.values(prog?.answers || {}).some((a: any) =>
                a.needsGrading || (a.awardedPoints === undefined && a.answer)
            );
            if (!hasUngraded) return false;
        }

        return true;
    });

    // Toggle page expansion
    const togglePage = (pageId: string) => {
        setExpandedPages(prev =>
            prev.includes(pageId)
                ? prev.filter(id => id !== pageId)
                : [...prev, pageId]
        );
    };

    // Open student detail view
    const openStudentView = (studentId: string) => {
        setSelectedStudentId(studentId);
        setViewMode('student');

        // Initialize grading state from existing progress
        const prog = progressMap[studentId];
        if (prog?.answers) {
            const state: StudentGradeState = {};
            Object.entries(prog.answers).forEach(([blockId, data]: [string, any]) => {
                state[blockId] = {
                    points: data.awardedPoints ?? 0,
                    feedback: data.feedback ?? ''
                };
            });
            setGradingState(state);
        } else {
            setGradingState({});
        }
    };

    // Handle grading input changes
    const updateGradeState = (blockId: string, field: 'points' | 'feedback', value: any) => {
        setGradingState(prev => ({
            ...prev,
            [blockId]: {
                ...prev[blockId],
                [field]: value
            }
        }));
    };

    // Save grades for current student
    const saveGrades = async () => {
        if (!selectedStudentId) return;

        const progress = progressMap[selectedStudentId];
        if (!progress?.id) {
            console.error("No progress document found");
            return;
        }

        setSavingGrades(true);
        try {
            for (const [blockId, gradeData] of Object.entries(gradingState)) {
                if (progress.answers?.[blockId]) {
                    await gradeAnswer(
                        progress.id,
                        blockId,
                        gradeData.points,
                        gradeData.feedback
                    );
                }
            }

            // Refresh progress data
            const allProgress = await getAlbumProgressForClass(assignmentId);
            const pMap: any = {};
            allProgress.forEach(p => pMap[p.studentId] = p);
            setProgressMap(pMap);

            setSavedMessage("Grades saved successfully!");
            setTimeout(() => setSavedMessage(null), 3000);
        } catch (error) {
            console.error("Failed to save grades:", error);
            setSavedMessage("Failed to save grades");
        } finally {
            setSavingGrades(false);
        }
    };

    // Export this assignment's data
    const handleExport = () => {
        if (!assignment || students.length === 0) return;

        const entries: GradebookEntry[] = students.map(student => {
            const prog = progressMap[student.uid];
            return {
                studentId: student.uid,
                studentName: student.displayName,
                studentEmail: student.email,
                assignments: {
                    [assignment.id]: {
                        status: prog?.percentComplete >= 100 ? 'completed' : prog?.percentComplete > 0 ? 'in_progress' : 'not_started',
                        percentComplete: prog?.percentComplete || 0,
                        pointsEarned: prog?.currentPointsEarned || 0,
                        pointsPossible: assignment.totalPointsAvailable || 0,
                        lastActivity: prog?.lastAccessedAt || 0,
                        needsGrading: false
                    }
                },
                totalPointsEarned: prog?.currentPointsEarned || 0,
                totalPointsPossible: assignment.totalPointsAvailable || 0,
                overallGrade: assignment.totalPointsAvailable > 0
                    ? Math.round(((prog?.currentPointsEarned || 0) / assignment.totalPointsAvailable) * 100)
                    : 0
            };
        });

        const csv = exportGradebookToCSV(entries, [assignment]);
        const filename = `${assignment.title}_gradebook_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400">Loading Gradebook...</p>
                </div>
            </div>
        );
    }

    if (!assignment || !template) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center text-red-400 glass-card p-8">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                    <p>Error loading workbook data.</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 btn-glass px-4 py-2"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // --- Student Detail View ---
    if (viewMode === 'student' && selectedStudentId) {
        const student = students.find(s => s.uid === selectedStudentId);
        const studentProgress = progressMap[selectedStudentId];

        return (
            <div className="min-h-screen">
                <HostMenu currentPage="grades" classId={classId} className={classData?.name || ''} />

                <main className="pt-6 px-6 pb-12 max-w-5xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => {
                            setViewMode('table');
                            setSelectedStudentId(null);
                        }}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to List
                    </button>

                    {/* Student Header */}
                    <div className="glass-card p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                    {student?.displayName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white">{student?.displayName || 'Unknown'}</h1>
                                    <p className="text-gray-400">{student?.email}</p>
                                </div>
                            </div>

                            <button
                                onClick={saveGrades}
                                disabled={savingGrades}
                                className={`btn-3d-primary px-6 py-2.5 flex items-center gap-2 ${savingGrades ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {savingGrades ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Save Grades
                                    </>
                                )}
                            </button>
                        </div>

                        {savedMessage && (
                            <div className={`mt-4 px-4 py-2 rounded-lg text-sm ${savedMessage.includes('successfully') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {savedMessage}
                            </div>
                        )}

                        {/* Progress Stats */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-blue-400">{studentProgress?.percentComplete || 0}%</div>
                                <div className="text-xs text-gray-400 uppercase mt-1">Progress</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{studentProgress?.currentPointsEarned || 0}</div>
                                <div className="text-xs text-gray-400 uppercase mt-1">Points Earned</div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-purple-400">{assignment.totalPointsAvailable || 0}</div>
                                <div className="text-xs text-gray-400 uppercase mt-1">Points Possible</div>
                            </div>
                        </div>
                    </div>

                    {/* Workbook Content */}
                    <h2 className="text-lg font-semibold text-white mb-4">{assignment.title}</h2>

                    <div className="space-y-4">
                        {template.pages.map((page, pIdx) => {
                            const isExpanded = expandedPages.includes(page.id);
                            const pageQuestions = page.blocks.filter(b => b.type === 'question');

                            return (
                                <div key={page.id} className="glass-card overflow-hidden">
                                    {/* Page Header */}
                                    <button
                                        onClick={() => togglePage(page.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center text-sm font-bold">
                                                {pIdx + 1}
                                            </span>
                                            <span className="font-semibold text-white">{page.title}</span>
                                            <span className="text-xs text-gray-500">
                                                ({pageQuestions.length} question{pageQuestions.length !== 1 ? 's' : ''})
                                            </span>
                                        </div>
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Page Content */}
                                    {isExpanded && (
                                        <div className="px-6 pb-6 space-y-6 border-t border-white/10">
                                            {pageQuestions.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic py-4">No questions on this page.</p>
                                            ) : (
                                                pageQuestions.map(block => {
                                                    const answerData = studentProgress?.answers?.[block.id];
                                                    const hasAnswer = !!answerData?.answer;
                                                    const gradeData = gradingState[block.id] || { points: answerData?.awardedPoints ?? 0, feedback: answerData?.feedback ?? '' };

                                                    return (
                                                        <div key={block.id} className="bg-white/5 rounded-xl p-6 mt-4">
                                                            {/* Question Header */}
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <span className="text-xs text-gray-500 uppercase font-semibold">
                                                                        {block.questionType?.replace('_', ' ') || 'Question'}
                                                                    </span>
                                                                    <span className="text-xs text-gray-600 ml-2">
                                                                        • {block.points || 0} pts
                                                                    </span>
                                                                </div>
                                                                {hasAnswer && answerData.submittedAt && (
                                                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />
                                                                        {new Date(answerData.submittedAt).toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Question Text */}
                                                            <p className="text-white font-medium mb-4">{block.content}</p>

                                                            {/* Answer Display */}
                                                            {hasAnswer ? (
                                                                <div className="bg-black/20 rounded-lg p-4 mb-4 border border-white/10">
                                                                    <span className="text-xs text-gray-500 block mb-2">Student Answer:</span>
                                                                    <p className="text-gray-200">{String(answerData.answer)}</p>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-black/20 rounded-lg p-4 mb-4 border border-white/10 text-gray-500 italic">
                                                                    No answer submitted
                                                                </div>
                                                            )}

                                                            {/* Grading Controls */}
                                                            {hasAnswer && (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
                                                                    {/* Points Input */}
                                                                    <div>
                                                                        <label className="text-xs text-gray-400 block mb-2">
                                                                            Points Awarded (max {block.points})
                                                                        </label>
                                                                        <div className="flex items-center gap-2">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={block.points}
                                                                                value={gradeData.points}
                                                                                onChange={(e) => updateGradeState(block.id, 'points', parseInt(e.target.value) || 0)}
                                                                                className="input-glass w-24 px-3 py-2 text-center"
                                                                            />
                                                                            <div className="flex gap-1">
                                                                                <button
                                                                                    onClick={() => updateGradeState(block.id, 'points', block.points)}
                                                                                    className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                                                    title="Full points"
                                                                                >
                                                                                    <Check className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => updateGradeState(block.id, 'points', 0)}
                                                                                    className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30 transition-colors"
                                                                                    title="Zero points"
                                                                                >
                                                                                    <X className="w-4 h-4" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Feedback Input */}
                                                                    <div>
                                                                        <label className="text-xs text-gray-400 block mb-2">
                                                                            Feedback (optional)
                                                                        </label>
                                                                        <textarea
                                                                            value={gradeData.feedback}
                                                                            onChange={(e) => updateGradeState(block.id, 'feedback', e.target.value)}
                                                                            placeholder="Add feedback for the student..."
                                                                            className="input-glass w-full px-3 py-2 text-sm resize-none"
                                                                            rows={2}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Floating Save Button */}
                    <div className="fixed bottom-6 right-6">
                        <button
                            onClick={saveGrades}
                            disabled={savingGrades}
                            className="btn-3d-primary px-6 py-3 flex items-center gap-2 shadow-xl"
                        >
                            {savingGrades ? 'Saving...' : 'Save All Grades'}
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    // --- Main Table View ---
    return (
        <div className="min-h-screen">
            <HostMenu currentPage="grades" classId={classId} className={classData?.name || ''} />

            <main className="pt-6 px-6 pb-12 max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <span
                            className="cursor-pointer hover:text-white transition-colors"
                            onClick={() => router.push('/dashboard')}
                        >
                            Dashboard
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span
                            className="cursor-pointer hover:text-white transition-colors"
                            onClick={() => router.push(`/host/class/${classId}/grades`)}
                        >
                            Gradebook
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">{assignment.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">{assignment.title}</h1>
                            <p className="text-gray-400">Progress & Grading</p>
                        </div>
                        <button
                            onClick={handleExport}
                            className="btn-glass px-4 py-2.5 flex items-center gap-2 text-white hover:text-emerald-300 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </header>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Students</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{stats.totalStudents}</div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-500/20 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Avg. Completion</span>
                        </div>
                        <div className="text-3xl font-bold text-blue-400">{stats.avgCompletion}%</div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Completed</span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-400">{stats.completedCount}</div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Needs Grading</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-400">{stats.needsGrading}</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-glass w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="input-glass px-4 py-2 text-sm min-w-[150px]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="in_progress">In Progress</option>
                            <option value="not_started">Not Started</option>
                            <option value="needs_grading">Needs Grading</option>
                        </select>
                    </div>
                </div>

                {/* Student Table */}
                <div className="glass-card overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Progress</th>
                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Points</th>
                                <th className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Active</th>
                                <th className="text-right px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        {students.length === 0 ? 'No students enrolled' : 'No students match your filters'}
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const prog = progressMap[student.uid];
                                    const status = prog?.percentComplete >= 100 ? 'completed' : (prog?.percentComplete > 0 ? 'in_progress' : 'not_started');
                                    const needsGrading = Object.values(prog?.answers || {}).some((a: any) =>
                                        a.needsGrading || (a.awardedPoints === undefined && a.answer)
                                    );

                                    return (
                                        <tr key={student.uid} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {student.displayName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{student.displayName}</div>
                                                        <div className="text-xs text-gray-500">{student.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <StatusBadge status={status} needsGrading={needsGrading} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 justify-center max-w-[120px] mx-auto">
                                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${prog?.percentComplete || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-gray-400 w-10 text-right">{prog?.percentComplete || 0}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-white font-medium">{prog?.currentPointsEarned || 0}</span>
                                                <span className="text-gray-500">/{assignment.totalPointsAvailable}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-400">
                                                {prog?.lastAccessedAt
                                                    ? new Date(prog.lastAccessedAt).toLocaleDateString()
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => openStudentView(student.uid)}
                                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View & Grade
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}

function StatusBadge({ status, needsGrading }: { status: string; needsGrading?: boolean }) {
    if (needsGrading) {
        return (
            <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-amber-500/30">
                <AlertCircle className="w-3 h-3" />
                Needs Grading
            </span>
        );
    }
    if (status === 'completed') {
        return (
            <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-500/30">
                <CheckCircle className="w-3 h-3" />
                Completed
            </span>
        );
    }
    if (status === 'in_progress') {
        return (
            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-500/30">
                <Clock className="w-3 h-3" />
                In Progress
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 bg-gray-500/20 text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-500/30">
            Not Started
        </span>
    );
}
