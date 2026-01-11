// Gradebook System - Functions for grading and analytics

import { db } from './firebase';
import {
    collection,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { AlbumProgress, ClassAlbum, AlbumTemplate, AlbumBlock } from './albums';
import { UserProfile } from './auth';

// --- Types ---

export interface GradebookEntry {
    studentId: string;
    studentName: string;
    studentEmail: string;
    assignments: {
        [assignmentId: string]: {
            status: 'not_started' | 'in_progress' | 'completed';
            percentComplete: number;
            pointsEarned: number;
            pointsPossible: number;
            lastActivity: number;
            needsGrading: boolean;
        }
    };
    totalPointsEarned: number;
    totalPointsPossible: number;
    overallGrade: number; // percentage
}

export interface GradeSummary {
    totalStudents: number;
    totalAssignments: number;
    averageCompletion: number;
    averageGrade: number;
    completedCount: number;
    inProgressCount: number;
    notStartedCount: number;
    needsGradingCount: number;
}

export interface QuestionGradeData {
    blockId: string;
    question: string;
    type: string;
    pointsPossible: number;
    answer: string | number;
    awardedPoints: number;
    isCorrect?: boolean;
    feedback?: string;
    submittedAt: number;
    needsGrading: boolean;
}

// --- Functions ---

// Get all class albums (assignments) for a class
export async function getClassAssignments(classId: string): Promise<ClassAlbum[]> {
    const q = query(
        collection(db, 'class_albums'),
        where('classId', '==', classId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
        const data = d.data() as ClassAlbum;
        return { ...data, id: data.id || d.id };
    });
}

// Get all album progress for a class (across all assignments)
export async function getAllProgressForClass(classId: string): Promise<AlbumProgress[]> {
    const q = query(
        collection(db, 'album_progress'),
        where('classId', '==', classId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as AlbumProgress);
}

// Calculate gradebook entries for all students in a class
export async function calculateGradebookData(
    students: UserProfile[],
    assignments: ClassAlbum[],
    progressRecords: AlbumProgress[]
): Promise<{ entries: GradebookEntry[], summary: GradeSummary }> {
    // Create a map of progress by student and assignment
    const progressMap: { [key: string]: AlbumProgress } = {};
    progressRecords.forEach(p => {
        const key = `${p.studentId}_${p.classAlbumId}`;
        progressMap[key] = p;
    });

    // Total possible points across all assignments
    const totalPossiblePoints = assignments.reduce((sum, a) => sum + (a.totalPointsAvailable || 0), 0);

    // Calculate entry for each student
    const entries: GradebookEntry[] = students.map(student => {
        let studentTotalEarned = 0;
        let needsGradingForStudent = false;
        const assignmentData: GradebookEntry['assignments'] = {};

        assignments.forEach(assignment => {
            const key = `${student.uid}_${assignment.id}`;
            const progress = progressMap[key];

            const pointsPossible = assignment.totalPointsAvailable || 0;
            const pointsEarned = progress?.currentPointsEarned || 0;
            const percentComplete = progress?.percentComplete || 0;

            // Check if any answers need grading
            let needsGrading = false;
            if (progress?.answers) {
                Object.values(progress.answers).forEach((ans: any) => {
                    if (ans.needsGrading || (ans.awardedPoints === undefined && ans.answer)) {
                        needsGrading = true;
                    }
                });
            }
            if (needsGrading) needsGradingForStudent = true;

            let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
            if (progress) {
                status = progress.status || (percentComplete >= 100 ? 'completed' : percentComplete > 0 ? 'in_progress' : 'not_started');
            }

            studentTotalEarned += pointsEarned;

            assignmentData[assignment.id] = {
                status,
                percentComplete,
                pointsEarned,
                pointsPossible,
                lastActivity: progress?.lastAccessedAt || 0,
                needsGrading
            };
        });

        const overallGrade = totalPossiblePoints > 0
            ? Math.round((studentTotalEarned / totalPossiblePoints) * 100)
            : 0;

        return {
            studentId: student.uid,
            studentName: student.displayName,
            studentEmail: student.email,
            assignments: assignmentData,
            totalPointsEarned: studentTotalEarned,
            totalPointsPossible: totalPossiblePoints,
            overallGrade
        };
    });

    // Calculate summary
    let totalCompletion = 0;
    let totalGrade = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let needsGradingCount = 0;

    entries.forEach(entry => {
        totalGrade += entry.overallGrade;

        Object.values(entry.assignments).forEach(a => {
            totalCompletion += a.percentComplete;
            if (a.status === 'completed') completedCount++;
            else if (a.status === 'in_progress') inProgressCount++;
            else notStartedCount++;
            if (a.needsGrading) needsGradingCount++;
        });
    });

    const totalCells = entries.length * assignments.length;

    const summary: GradeSummary = {
        totalStudents: students.length,
        totalAssignments: assignments.length,
        averageCompletion: totalCells > 0 ? Math.round(totalCompletion / totalCells) : 0,
        averageGrade: entries.length > 0 ? Math.round(totalGrade / entries.length) : 0,
        completedCount,
        inProgressCount,
        notStartedCount,
        needsGradingCount
    };

    return { entries, summary };
}

// Grade an individual answer (for open-ended questions)
export async function gradeAnswer(
    progressId: string,
    blockId: string,
    awardedPoints: number,
    feedback?: string
): Promise<void> {
    const progressRef = doc(db, 'album_progress', progressId);

    await updateDoc(progressRef, {
        [`answers.${blockId}.awardedPoints`]: awardedPoints,
        [`answers.${blockId}.feedback`]: feedback || '',
        [`answers.${blockId}.needsGrading`]: false,
        lastAccessedAt: Date.now()
    });

    // Recalculate total points earned
    const progressDoc = await getDoc(progressRef);
    if (progressDoc.exists()) {
        const data = progressDoc.data() as AlbumProgress;
        let total = 0;
        Object.values(data.answers || {}).forEach((ans: any) => {
            total += (ans.awardedPoints || 0);
        });
        await updateDoc(progressRef, { currentPointsEarned: total });
    }
}

// Get detailed question grades for a specific student's work
export async function getStudentQuestionGrades(
    progressId: string,
    template: AlbumTemplate
): Promise<QuestionGradeData[]> {
    const progressRef = doc(db, 'album_progress', progressId);
    const progressSnap = await getDoc(progressRef);

    if (!progressSnap.exists()) return [];

    const progress = progressSnap.data() as AlbumProgress;
    const grades: QuestionGradeData[] = [];

    template.pages.forEach(page => {
        page.blocks.forEach(block => {
            if (block.type === 'question') {
                const answerData = progress.answers?.[block.id];

                grades.push({
                    blockId: block.id,
                    question: block.content,
                    type: block.questionType || 'short_answer',
                    pointsPossible: block.points || 0,
                    answer: answerData?.answer ?? '',
                    awardedPoints: answerData?.awardedPoints ?? 0,
                    isCorrect: answerData?.isCorrect,
                    feedback: answerData?.feedback,
                    submittedAt: answerData?.submittedAt ?? 0,
                    needsGrading: !answerData ? false : (
                        answerData.needsGrading ||
                        (answerData.awardedPoints === undefined && !!answerData.answer)
                    )
                });
            }
        });
    });

    return grades;
}

// Export gradebook to CSV format
export function exportGradebookToCSV(
    entries: GradebookEntry[],
    assignments: ClassAlbum[]
): string {
    // Header row
    const headers = ['Student Name', 'Email'];
    assignments.forEach(a => {
        headers.push(`${a.title} (Points)`);
        headers.push(`${a.title} (Status)`);
    });
    headers.push('Total Points', 'Overall Grade %');

    const rows: string[][] = [headers];

    // Data rows
    entries.forEach(entry => {
        const row: string[] = [entry.studentName, entry.studentEmail];

        assignments.forEach(a => {
            const data = entry.assignments[a.id];
            row.push(`${data?.pointsEarned || 0}/${data?.pointsPossible || 0}`);
            row.push(data?.status || 'not_started');
        });

        row.push(`${entry.totalPointsEarned}/${entry.totalPointsPossible}`);
        row.push(`${entry.overallGrade}%`);

        rows.push(row);
    });

    // Convert to CSV string
    return rows.map(row =>
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
}

// Download CSV helper
export function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
