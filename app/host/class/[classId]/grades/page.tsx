"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getClass, getClassMembers, Class } from '@/lib/classes';
import { UserProfile, onAuthStateChange } from '@/lib/auth';
import {
    getClassAssignments,
    getAllProgressForClass,
    calculateGradebookData,
    GradebookEntry,
    GradeSummary,
    exportGradebookToCSV,
    downloadCSV
} from '@/lib/gradebook';
import { ClassAlbum, AlbumProgress } from '@/lib/albums';
import HostMenu from '@/components/HostMenu';
import {
    Download,
    BookOpen,
    Users,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    ChevronRight,
    BarChart3,
    FileText,
    Filter,
    Search,
    ArrowUpDown
} from 'lucide-react';

type SortField = 'name' | 'grade' | 'completion';
type SortDirection = 'asc' | 'desc';

export default function GradesDashboard() {
    const router = useRouter();
    const params = useParams();
    const classId = params.classId as string;

    const [loading, setLoading] = useState(true);
    const [classData, setClassData] = useState<Class | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [assignments, setAssignments] = useState<ClassAlbum[]>([]);
    const [entries, setEntries] = useState<GradebookEntry[]>([]);
    const [summary, setSummary] = useState<GradeSummary | null>(null);

    // Filters and sorting
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Selected assignment filter
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');

    useEffect(() => {
        const unsub = onAuthStateChange(async (user) => {
            if (!user) {
                router.push('/login');
                return;
            }

            try {
                // Load class data
                const cls = await getClass(classId);
                if (!cls) throw new Error('Class not found');
                setClassData(cls);

                // Load students
                const classStudents = await getClassMembers(classId);
                setStudents(classStudents);

                // Load all assignments
                const classAssignments = await getClassAssignments(classId);
                // Filter to only active assignments
                const activeAssignments = classAssignments.filter(a => a.status === 'active');
                setAssignments(activeAssignments);

                // Load all progress records
                const allProgress = await getAllProgressForClass(classId);

                // Calculate gradebook data
                const { entries: gradebookEntries, summary: gradeSummary } = await calculateGradebookData(
                    classStudents,
                    activeAssignments,
                    allProgress
                );

                setEntries(gradebookEntries);
                setSummary(gradeSummary);

            } catch (error) {
                console.error('Failed to load gradebook:', error);
            } finally {
                setLoading(false);
            }
        });

        return () => unsub();
    }, [classId, router]);

    // Sort and filter entries
    const processedEntries = entries
        .filter(entry => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!entry.studentName.toLowerCase().includes(query) &&
                    !entry.studentEmail.toLowerCase().includes(query)) {
                    return false;
                }
            }

            // Status filter
            if (filterStatus !== 'all') {
                const hasStatusMatch = Object.values(entry.assignments).some(a => {
                    if (filterStatus === 'needs_grading') return a.needsGrading;
                    return a.status === filterStatus;
                });
                if (!hasStatusMatch) return false;
            }

            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            if (sortField === 'name') {
                comparison = a.studentName.localeCompare(b.studentName);
            } else if (sortField === 'grade') {
                comparison = a.overallGrade - b.overallGrade;
            } else if (sortField === 'completion') {
                const aAvg = Object.values(a.assignments).reduce((sum, x) => sum + x.percentComplete, 0) / (Object.keys(a.assignments).length || 1);
                const bAvg = Object.values(b.assignments).reduce((sum, x) => sum + x.percentComplete, 0) / (Object.keys(b.assignments).length || 1);
                comparison = aAvg - bAvg;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const handleExportCSV = () => {
        if (entries.length === 0 || assignments.length === 0) return;
        const csv = exportGradebookToCSV(entries, assignments);
        const filename = `${classData?.name || 'class'}_gradebook_${new Date().toISOString().split('T')[0]}.csv`;
        downloadCSV(csv, filename);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-emerald-400';
        if (grade >= 80) return 'text-green-400';
        if (grade >= 70) return 'text-yellow-400';
        if (grade >= 60) return 'text-orange-400';
        return 'text-red-400';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
            case 'in_progress': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
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
                            onClick={() => router.push(`/dashboard/class?id=${classId}`)}
                        >
                            {classData?.name}
                        </span>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-white">Gradebook</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1">
                                Gradebook
                            </h1>
                            <p className="text-gray-400">
                                Track student progress and grade assignments
                            </p>
                        </div>
                        <button
                            onClick={handleExportCSV}
                            className="btn-glass px-4 py-2.5 flex items-center gap-2 text-white hover:text-emerald-300 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                                <Users className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Students</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{summary?.totalStudents || 0}</div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                <BookOpen className="w-5 h-5 text-purple-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Workbooks</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{summary?.totalAssignments || 0}</div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-emerald-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Avg. Grade</span>
                        </div>
                        <div className={`text-3xl font-bold ${getGradeColor(summary?.averageGrade || 0)}`}>
                            {summary?.averageGrade || 0}%
                        </div>
                    </div>

                    <div className="glass-card p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-400" />
                            </div>
                            <span className="text-gray-400 text-sm">Needs Grading</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-400">{summary?.needsGradingCount || 0}</div>
                    </div>
                </div>

                {/* Status Distribution Bar */}
                {summary && summary.totalStudents > 0 && (
                    <div className="glass-card p-5 mb-8">
                        <h3 className="text-sm font-semibold text-gray-400 mb-4">Completion Distribution</h3>
                        <div className="h-4 rounded-full overflow-hidden flex bg-gray-700/50">
                            <div
                                className="bg-emerald-500 transition-all duration-500"
                                style={{ width: `${(summary.completedCount / (summary.completedCount + summary.inProgressCount + summary.notStartedCount)) * 100}%` }}
                                title={`Completed: ${summary.completedCount}`}
                            />
                            <div
                                className="bg-blue-500 transition-all duration-500"
                                style={{ width: `${(summary.inProgressCount / (summary.completedCount + summary.inProgressCount + summary.notStartedCount)) * 100}%` }}
                                title={`In Progress: ${summary.inProgressCount}`}
                            />
                            <div
                                className="bg-white/50 transition-all duration-500"
                                style={{ width: `${(summary.notStartedCount / (summary.completedCount + summary.inProgressCount + summary.notStartedCount)) * 100}%` }}
                                title={`Not Started: ${summary.notStartedCount}`}
                            />
                        </div>
                        <div className="flex gap-6 mt-3 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                <span className="text-gray-400">Completed ({summary.completedCount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-gray-400">In Progress ({summary.inProgressCount})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-white/50" />
                                <span className="text-gray-400">Not Started ({summary.notStartedCount})</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Workbook Quick Access */}
                {assignments.length > 0 && (
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-white mb-4">Workbook Gradebooks</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {assignments.map(assignment => {
                                // Calculate completion for this assignment
                                let totalCompletion = 0;
                                let studentCount = 0;
                                let needsGrading = 0;

                                entries.forEach(entry => {
                                    const assnData = entry.assignments[assignment.id];
                                    if (assnData) {
                                        totalCompletion += assnData.percentComplete;
                                        studentCount++;
                                        if (assnData.needsGrading) needsGrading++;
                                    }
                                });

                                const avgCompletion = studentCount > 0 ? Math.round(totalCompletion / studentCount) : 0;

                                return (
                                    <div
                                        key={assignment.id}
                                        className="glass-card glass-card-hover p-5 cursor-pointer"
                                        onClick={() => router.push(`/host/class/${classId}/workbook/${assignment.id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="p-2 bg-purple-500/20 rounded-lg">
                                                <FileText className="w-5 h-5 text-purple-400" />
                                            </div>
                                            {needsGrading > 0 && (
                                                <span className="px-2 py-1 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
                                                    {needsGrading} to grade
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-semibold text-white mb-2 truncate">{assignment.title}</h4>
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <BarChart3 className="w-3.5 h-3.5" />
                                                <span>{avgCompletion}% avg</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                <span>{studentCount} students</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-700/50 mt-4 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                                                style={{ width: `${avgCompletion}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="glass-card p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-glass w-full pl-10 pr-4 py-2 text-sm"
                            />
                        </div>

                        {/* Status Filter */}
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

                {/* Gradebook Table */}
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th
                                        className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Student
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    {assignments.map(a => (
                                        <th key={a.id} className="text-center px-4 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[120px]">
                                            <div className="truncate" title={a.title}>{a.title}</div>
                                        </th>
                                    ))}
                                    <th
                                        className="text-center px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                                        onClick={() => handleSort('grade')}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            Grade
                                            <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {processedEntries.length === 0 ? (
                                    <tr>
                                        <td colSpan={assignments.length + 2} className="px-6 py-12 text-center text-white/60">
                                            {entries.length === 0
                                                ? 'No students enrolled yet'
                                                : 'No students match your filters'
                                            }
                                        </td>
                                    </tr>
                                ) : (
                                    processedEntries.map((entry, idx) => (
                                        <tr
                                            key={entry.studentId}
                                            className="hover:bg-white/5 transition-colors"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                                        {entry.studentName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{entry.studentName}</div>
                                                        <div className="text-xs text-white/60">{entry.studentEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {assignments.map(a => {
                                                const data = entry.assignments[a.id];
                                                if (!data) {
                                                    return <td key={a.id} className="px-4 py-4 text-center text-white/60">-</td>;
                                                }

                                                return (
                                                    <td key={a.id} className="px-4 py-4">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(data.status)}`}>
                                                                {data.status.replace('_', ' ')}
                                                            </span>
                                                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                                                <span>{data.pointsEarned}</span>
                                                                <span>/</span>
                                                                <span>{data.pointsPossible}</span>
                                                            </div>
                                                            {data.needsGrading && (
                                                                <span className="text-xs text-amber-400 flex items-center gap-1">
                                                                    <AlertCircle className="w-3 h-3" />
                                                                    Grade
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-6 py-4 text-center">
                                                <div className={`text-xl font-bold ${getGradeColor(entry.overallGrade)}`}>
                                                    {entry.overallGrade}%
                                                </div>
                                                <div className="text-xs text-white/60">
                                                    {entry.totalPointsEarned}/{entry.totalPointsPossible} pts
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
