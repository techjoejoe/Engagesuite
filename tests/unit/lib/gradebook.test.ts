/**
 * Unit Tests for Gradebook Library
 * Tests the core gradebook calculation and grading functions
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    calculateGradebookData,
    exportGradebookToCSV,
    GradebookEntry,
    GradeSummary,
} from '@/lib/gradebook';
import { ClassAlbum, AlbumProgress } from '@/lib/albums';
import { UserProfile } from '@/lib/auth';

describe('Gradebook Library', () => {
    // Mock data
    const mockStudents: UserProfile[] = [
        {
            uid: 'student1',
            email: 'student1@test.com',
            displayName: 'Alice Smith',
            role: 'player',
            lifetimePoints: 100,
            gamesPlayed: 5,
            gamesWon: 2,
            createdAt: Date.now(),
            lastActive: Date.now(),
        },
        {
            uid: 'student2',
            email: 'student2@test.com',
            displayName: 'Bob Jones',
            role: 'player',
            lifetimePoints: 80,
            gamesPlayed: 4,
            gamesWon: 1,
            createdAt: Date.now(),
            lastActive: Date.now(),
        },
        {
            uid: 'student3',
            email: 'student3@test.com',
            displayName: 'Charlie Brown',
            role: 'player',
            lifetimePoints: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            createdAt: Date.now(),
            lastActive: Date.now(),
        },
    ];

    const mockAssignments: ClassAlbum[] = [
        {
            id: 'assignment1',
            templateId: 'template1',
            classId: 'class1',
            assignedByUserId: 'host1',
            assignedAt: Date.now(),
            status: 'active',
            settings: {
                allowLateSubmissions: true,
                isGuided: false,
                showCorrectAnswersAfterSubmission: false,
            },
            title: 'Workbook 1',
            totalPointsAvailable: 100,
        },
        {
            id: 'assignment2',
            templateId: 'template2',
            classId: 'class1',
            assignedByUserId: 'host1',
            assignedAt: Date.now(),
            status: 'active',
            settings: {
                allowLateSubmissions: true,
                isGuided: false,
                showCorrectAnswersAfterSubmission: false,
            },
            title: 'Workbook 2',
            totalPointsAvailable: 50,
        },
    ];

    const mockProgress: AlbumProgress[] = [
        {
            id: 'progress1',
            classAlbumId: 'assignment1',
            studentId: 'student1',
            classId: 'class1',
            status: 'completed',
            percentComplete: 100,
            currentPointsEarned: 90,
            completedPageIds: ['page1', 'page2'],
            lastAccessedAt: Date.now(),
            answers: {
                'q1': { answer: 'A', submittedAt: Date.now(), awardedPoints: 50 },
                'q2': { answer: 'B', submittedAt: Date.now(), awardedPoints: 40 },
            },
        },
        {
            id: 'progress2',
            classAlbumId: 'assignment2',
            studentId: 'student1',
            classId: 'class1',
            status: 'in_progress',
            percentComplete: 50,
            currentPointsEarned: 25,
            completedPageIds: ['page1'],
            lastAccessedAt: Date.now(),
            answers: {
                'q1': { answer: 'C', submittedAt: Date.now(), awardedPoints: 25 },
            },
        },
        {
            id: 'progress3',
            classAlbumId: 'assignment1',
            studentId: 'student2',
            classId: 'class1',
            status: 'in_progress',
            percentComplete: 60,
            currentPointsEarned: 50,
            completedPageIds: ['page1'],
            lastAccessedAt: Date.now(),
            answers: {
                'q1': { answer: 'A', submittedAt: Date.now(), awardedPoints: 50, needsGrading: true },
            },
        },
    ];

    describe('calculateGradebookData', () => {
        it('should calculate correct gradebook entries for all students', async () => {
            const { entries, summary } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            expect(entries).toHaveLength(3);

            // Check Alice's entry (student1 - has completed work)
            const aliceEntry = entries.find(e => e.studentId === 'student1');
            expect(aliceEntry).toBeDefined();
            expect(aliceEntry?.studentName).toBe('Alice Smith');
            expect(aliceEntry?.totalPointsEarned).toBe(115); // 90 + 25
            expect(aliceEntry?.totalPointsPossible).toBe(150); // 100 + 50
            expect(aliceEntry?.overallGrade).toBe(77); // 115/150 * 100 = 76.67 rounded
        });

        it('should correctly identify students with no progress', async () => {
            const { entries } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            // Charlie has no progress records
            const charlieEntry = entries.find(e => e.studentId === 'student3');
            expect(charlieEntry).toBeDefined();
            expect(charlieEntry?.totalPointsEarned).toBe(0);
            expect(charlieEntry?.overallGrade).toBe(0);

            // Check all assignments show not_started
            Object.values(charlieEntry?.assignments || {}).forEach(a => {
                expect(a.status).toBe('not_started');
                expect(a.percentComplete).toBe(0);
            });
        });

        it('should calculate correct summary statistics', async () => {
            const { summary } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            expect(summary.totalStudents).toBe(3);
            expect(summary.totalAssignments).toBe(2);
            expect(summary.completedCount).toBe(1); // Only Alice completed assignment1
            expect(summary.inProgressCount).toBe(2); // Alice's assignment2, Bob's assignment1
            expect(summary.notStartedCount).toBe(3); // Charlie's 2 + Bob's assignment2
        });

        it('should identify items needing grading', async () => {
            const { entries, summary } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            // Bob has needsGrading flag set
            const bobEntry = entries.find(e => e.studentId === 'student2');
            expect(bobEntry?.assignments['assignment1']?.needsGrading).toBe(true);

            expect(summary.needsGradingCount).toBeGreaterThanOrEqual(1);
        });

        it('should handle empty student list', async () => {
            const { entries, summary } = await calculateGradebookData([], mockAssignments, []);

            expect(entries).toHaveLength(0);
            expect(summary.totalStudents).toBe(0);
        });

        it('should handle empty assignments list', async () => {
            const { entries, summary } = await calculateGradebookData(mockStudents, [], []);

            expect(entries).toHaveLength(3);
            entries.forEach(entry => {
                expect(entry.totalPointsPossible).toBe(0);
                expect(entry.overallGrade).toBe(0);
            });
        });
    });

    describe('exportGradebookToCSV', () => {
        it('should generate valid CSV format', async () => {
            const { entries } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            const csv = exportGradebookToCSV(entries, mockAssignments);

            // Check it's a string
            expect(typeof csv).toBe('string');

            // Check it has multiple lines
            const lines = csv.split('\n');
            expect(lines.length).toBeGreaterThan(1);

            // Check header row contains expected columns
            const header = lines[0];
            expect(header).toContain('Student Name');
            expect(header).toContain('Email');
            expect(header).toContain('Workbook 1');
            expect(header).toContain('Workbook 2');
            expect(header).toContain('Total Points');
            expect(header).toContain('Overall Grade');
        });

        it('should escape special characters in CSV', async () => {
            const studentsWithSpecialChars: UserProfile[] = [
                {
                    uid: 'special1',
                    email: 'test@test.com',
                    displayName: 'John "The Best" Doe',
                    role: 'player',
                    lifetimePoints: 0,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    createdAt: Date.now(),
                    lastActive: Date.now(),
                },
            ];

            const { entries } = await calculateGradebookData(
                studentsWithSpecialChars,
                mockAssignments,
                []
            );

            const csv = exportGradebookToCSV(entries, mockAssignments);

            // Quotes should be escaped as double quotes
            expect(csv).toContain('""The Best""');
        });

        it('should include all students in output', async () => {
            const { entries } = await calculateGradebookData(
                mockStudents,
                mockAssignments,
                mockProgress
            );

            const csv = exportGradebookToCSV(entries, mockAssignments);

            expect(csv).toContain('Alice Smith');
            expect(csv).toContain('Bob Jones');
            expect(csv).toContain('Charlie Brown');
        });
    });
});
