"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    getClassAlbum,
    getAlbumTemplate,
    getAlbumProgressForClass,
    ClassAlbum,
    AlbumTemplate,
    AlbumProgress
} from '@/lib/albums';
import { getClassMembers } from '@/lib/classes';
import { UserProfile } from '@/lib/auth';
import { ArrowLeft, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

export default function WorkbookGradebook({ params }: { params: Promise<{ classId: string, assignmentId: string }> }) {
    const router = useRouter();
    const { classId, assignmentId } = use(params);

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<ClassAlbum | null>(null);
    const [template, setTemplate] = useState<AlbumTemplate | null>(null);
    const [students, setStudents] = useState<UserProfile[]>([]);
    const [progressMap, setProgressMap] = useState<{ [studentId: string]: AlbumProgress }>({});

    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                // 1. Fetch Metadata
                const assignData = await getClassAlbum(assignmentId);
                if (!assignData) throw new Error("Assignment not found");
                setAssignment(assignData);

                const tempData = await getAlbumTemplate(assignData.templateId);
                setTemplate(tempData);

                // 2. Fetch Class Roster
                const roster = await getClassMembers(classId);
                setStudents(roster);

                // 3. Fetch All Progress
                const allProgress = await getAlbumProgressForClass(assignmentId);
                const pMap: any = {};
                allProgress.forEach(p => pMap[p.studentId] = p);
                setProgressMap(pMap);

            } catch (error) {
                console.error("Failed to load gradebook", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [classId, assignmentId]);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Gradebook...</div>;
    if (!assignment || !template) return <div className="p-10 text-center text-red-500">Error loading data.</div>;

    // --- Detail View (Single Student) ---
    if (selectedStudentId) {
        const student = students.find(s => s.uid === selectedStudentId);
        const studentProgress = progressMap[selectedStudentId];

        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <button
                    onClick={() => setSelectedStudentId(null)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Summary
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-4xl mx-auto">
                    <header className="mb-8 border-b border-gray-100 pb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{student?.displayName || 'Unknown Student'}</h1>
                        <p className="text-gray-500">{assignment.title}</p>
                        <div className="flex gap-4 mt-4">
                            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium">
                                Progress: {studentProgress?.percentComplete || 0}%
                            </div>
                            <div className="bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                                Points: {studentProgress?.currentPointsEarned || 0} / {assignment.totalPointsAvailable}
                            </div>
                        </div>
                    </header>

                    <div className="space-y-8">
                        {template.pages.map((page, pIdx) => (
                            <div key={page.id} className="space-y-4">
                                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider border-b border-gray-100 pb-2">
                                    Page {pIdx + 1}: {page.title}
                                </h3>

                                {page.blocks.filter(b => b.type === 'question').map(block => {
                                    const answerData = studentProgress?.answers?.[block.id];
                                    const hasAnswer = !!answerData;

                                    return (
                                        <div key={block.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm font-bold text-gray-700">Question ({block.points} pts)</span>
                                                <span className="text-xs text-gray-400">
                                                    {hasAnswer ? new Date(answerData.submittedAt).toLocaleTimeString() : 'Not Answered'}
                                                </span>
                                            </div>
                                            <p className="text-gray-900 font-medium mb-4">{block.content}</p>

                                            {hasAnswer ? (
                                                <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-800">
                                                    {answerData.answer}
                                                </div>
                                            ) : (
                                                <div className="text-gray-400 italic text-sm">No answer submitted yet.</div>
                                            )}

                                            {/* Grading UI would go here (Accept/Reject/Comment) */}
                                        </div>
                                    );
                                })}

                                {page.blocks.filter(b => b.type === 'question').length === 0 && (
                                    <div className="text-xs text-gray-400 italic px-4">No questions on this page.</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Main Table View ---

    return (
        <div className="min-h-screen bg-[#F3F4F6] p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                            <span onClick={() => router.back()} className="cursor-pointer hover:underline">Class Dashboard</span>
                            <span>/</span>
                            <span>Workbooks</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">{assignment.title}</h1>
                        <p className="text-gray-500">Gradebook & Progress Report</p>
                    </div>

                    <div className="bg-white px-6 py-4 rounded-xl shadow-sm border border-gray-200 flex gap-8">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{students.length}</div>
                            <div className="text-xs text-gray-400 font-bold uppercase">Students</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {Math.round(Object.values(progressMap).reduce((acc, p) => acc + (p.percentComplete || 0), 0) / (students.length || 1))}%
                            </div>
                            <div className="text-xs text-gray-400 font-bold uppercase">Avg. Completion</div>
                        </div>
                    </div>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Student</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Completion</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Last Active</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {students.map(student => {
                                const prog = progressMap[student.uid];
                                const status = prog?.percentComplete === 100 ? 'Completed' : (prog?.percentComplete > 0 ? 'In Progress' : 'Not Started');

                                return (
                                    <tr key={student.uid} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                                                    {student.displayName?.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900">{student.displayName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 max-w-[150px]">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${prog?.percentComplete || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 text-right">{prog?.percentComplete || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {prog?.lastAccessedAt ? <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(prog.lastAccessedAt).toLocaleDateString()}</div> : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedStudentId(student.uid)}
                                                className="text-blue-600 font-medium text-sm hover:underline"
                                            >
                                                View Answers
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    if (status === 'Completed') {
        return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-green-100"><CheckCircle className="w-3 h-3" /> Completed</span>;
    }
    if (status === 'In Progress') {
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-bold border border-blue-100"><Clock className="w-3 h-3" /> In Progress</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200">Not Started</span>;
}
