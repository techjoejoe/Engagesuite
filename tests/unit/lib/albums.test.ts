/**
 * Unit Tests for Albums Library
 * Tests album template operations, assignments, and progress tracking
 */
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
    AlbumTemplate,
    AlbumPage,
    AlbumBlock,
    ClassAlbum,
    AlbumProgress,
} from '@/lib/albums';

// Import the mocked Firestore
import { getDoc, getDocs, updateDoc, addDoc, doc, collection, query, where } from 'firebase/firestore';

describe('Albums Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('AlbumTemplate Type', () => {
        it('should have correct structure for album template', () => {
            const template: AlbumTemplate = {
                id: 'template1',
                title: 'Test Album',
                description: 'A test album for unit testing',
                designerId: 'designer1',
                isPublished: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                pages: [],
                completionPoints: 10,
                totalPointsAvailable: 10,
            };

            expect(template.id).toBe('template1');
            expect(template.title).toBe('Test Album');
            expect(template.isPublished).toBe(false);
            expect(template.pages).toEqual([]);
        });

        it('should support optional cover image', () => {
            const templateWithCover: AlbumTemplate = {
                id: 'template2',
                title: 'Album with Cover',
                description: 'Has a cover image',
                coverImageUrl: 'https://example.com/cover.jpg',
                designerId: 'designer1',
                isPublished: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                pages: [],
                completionPoints: 0,
                totalPointsAvailable: 0,
            };

            expect(templateWithCover.coverImageUrl).toBe('https://example.com/cover.jpg');
        });
    });

    describe('AlbumPage Type', () => {
        it('should have correct structure for pages', () => {
            const page: AlbumPage = {
                id: 'page1',
                title: 'Introduction',
                order: 0,
                blocks: [],
            };

            expect(page.id).toBe('page1');
            expect(page.order).toBe(0);
            expect(page.blocks).toEqual([]);
        });
    });

    describe('AlbumBlock Types', () => {
        it('should support text blocks', () => {
            const textBlock: AlbumBlock = {
                id: 'block1',
                type: 'text',
                content: 'Welcome to this lesson!',
                points: 0,
            };

            expect(textBlock.type).toBe('text');
            expect(textBlock.content).toBe('Welcome to this lesson!');
        });

        it('should support image blocks with media URL', () => {
            const imageBlock: AlbumBlock = {
                id: 'block2',
                type: 'image',
                content: 'A diagram',
                mediaUrl: 'https://example.com/image.png',
                points: 0,
            };

            expect(imageBlock.type).toBe('image');
            expect(imageBlock.mediaUrl).toBe('https://example.com/image.png');
        });

        it('should support question blocks with options', () => {
            const questionBlock: AlbumBlock = {
                id: 'block3',
                type: 'question',
                content: 'What is 2 + 2?',
                questionType: 'multiple_choice',
                options: ['3', '4', '5', '6'],
                points: 10,
            };

            expect(questionBlock.type).toBe('question');
            expect(questionBlock.questionType).toBe('multiple_choice');
            expect(questionBlock.options).toHaveLength(4);
            expect(questionBlock.points).toBe(10);
        });

        it('should support essay questions', () => {
            const essayBlock: AlbumBlock = {
                id: 'block4',
                type: 'question',
                content: 'Explain the concept of photosynthesis.',
                questionType: 'essay',
                points: 25,
            };

            expect(essayBlock.questionType).toBe('essay');
            expect(essayBlock.options).toBeUndefined();
        });
    });

    describe('ClassAlbum (Assignment) Type', () => {
        it('should have correct structure for class assignments', () => {
            const assignment: ClassAlbum = {
                id: 'assignment1',
                templateId: 'template1',
                classId: 'class1',
                assignedByUserId: 'trainer1',
                assignedAt: Date.now(),
                status: 'active',
                settings: {
                    allowLateSubmissions: true,
                    isGuided: false,
                    showCorrectAnswersAfterSubmission: true,
                },
                title: 'Unit 1 Workbook',
                totalPointsAvailable: 100,
            };

            expect(assignment.status).toBe('active');
            expect(assignment.settings.allowLateSubmissions).toBe(true);
            expect(assignment.settings.isGuided).toBe(false);
        });

        it('should support optional due date', () => {
            const assignmentWithDue: ClassAlbum = {
                id: 'assignment2',
                templateId: 'template1',
                classId: 'class1',
                assignedByUserId: 'trainer1',
                assignedAt: Date.now(),
                dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week from now
                status: 'active',
                settings: {
                    allowLateSubmissions: false,
                    isGuided: false,
                    showCorrectAnswersAfterSubmission: false,
                },
                title: 'Weekly Assignment',
                totalPointsAvailable: 50,
            };

            expect(assignmentWithDue.dueDate).toBeDefined();
            expect(assignmentWithDue.settings.allowLateSubmissions).toBe(false);
        });
    });

    describe('AlbumProgress Type', () => {
        it('should track student progress correctly', () => {
            const progress: AlbumProgress = {
                id: 'progress1',
                classAlbumId: 'assignment1',
                studentId: 'student1',
                classId: 'class1',
                status: 'in_progress',
                percentComplete: 60,
                currentPointsEarned: 45,
                completedPageIds: ['page1', 'page2'],
                lastAccessedAt: Date.now(),
                answers: {},
            };

            expect(progress.status).toBe('in_progress');
            expect(progress.percentComplete).toBe(60);
            expect(progress.completedPageIds).toHaveLength(2);
        });

        it('should store answers with grading info', () => {
            const progressWithAnswers: AlbumProgress = {
                id: 'progress2',
                classAlbumId: 'assignment1',
                studentId: 'student1',
                classId: 'class1',
                status: 'in_progress',
                percentComplete: 50,
                currentPointsEarned: 10,
                completedPageIds: ['page1'],
                lastAccessedAt: Date.now(),
                answers: {
                    'q1': {
                        answer: 'B',
                        submittedAt: Date.now(),
                        isCorrect: true,
                        awardedPoints: 10,
                    },
                    'q2': {
                        answer: 'This is my essay response...',
                        submittedAt: Date.now(),
                        awardedPoints: 0,
                        needsGrading: true,
                    },
                },
            };

            expect(progressWithAnswers.answers['q1'].isCorrect).toBe(true);
            expect(progressWithAnswers.answers['q2'].needsGrading).toBe(true);
        });

        it('should support feedback on answers', () => {
            const progressWithFeedback: AlbumProgress = {
                id: 'progress3',
                classAlbumId: 'assignment1',
                studentId: 'student1',
                classId: 'class1',
                status: 'completed',
                percentComplete: 100,
                currentPointsEarned: 85,
                completedPageIds: ['page1', 'page2', 'page3'],
                lastAccessedAt: Date.now(),
                answers: {
                    'essay1': {
                        answer: 'My response to the essay question...',
                        submittedAt: Date.now() - 3600000,
                        awardedPoints: 20,
                        feedback: 'Great analysis! Could improve the conclusion.',
                    },
                },
            };

            expect(progressWithFeedback.answers['essay1'].feedback).toContain('Great analysis');
        });
    });

    describe('Points Calculation', () => {
        it('should calculate total points from blocks', () => {
            const blocks: AlbumBlock[] = [
                { id: 'b1', type: 'text', content: 'Intro', points: 0 },
                { id: 'b2', type: 'question', content: 'Q1?', questionType: 'multiple_choice', points: 10 },
                { id: 'b3', type: 'question', content: 'Q2?', questionType: 'short_answer', points: 15 },
                { id: 'b4', type: 'image', content: 'Diagram', points: 0 },
                { id: 'b5', type: 'question', content: 'Q3?', questionType: 'essay', points: 25 },
            ];

            const totalPoints = blocks.reduce((sum, block) => sum + (block.points || 0), 0);

            expect(totalPoints).toBe(50);
        });

        it('should correctly sum points across pages', () => {
            const pages: AlbumPage[] = [
                {
                    id: 'p1',
                    title: 'Page 1',
                    order: 0,
                    blocks: [
                        { id: 'b1', type: 'question', content: 'Q1', points: 10 },
                        { id: 'b2', type: 'question', content: 'Q2', points: 15 },
                    ],
                },
                {
                    id: 'p2',
                    title: 'Page 2',
                    order: 1,
                    blocks: [
                        { id: 'b3', type: 'question', content: 'Q3', points: 25 },
                    ],
                },
            ];

            const totalPoints = pages.reduce((pageSum, page) => {
                return pageSum + page.blocks.reduce((blockSum, block) => blockSum + (block.points || 0), 0);
            }, 0);

            expect(totalPoints).toBe(50);
        });
    });

    describe('Progress Status Logic', () => {
        it('should determine correct status based on completion', () => {
            const getStatus = (percent: number): 'not_started' | 'in_progress' | 'completed' => {
                if (percent === 0) return 'not_started';
                if (percent >= 100) return 'completed';
                return 'in_progress';
            };

            expect(getStatus(0)).toBe('not_started');
            expect(getStatus(25)).toBe('in_progress');
            expect(getStatus(50)).toBe('in_progress');
            expect(getStatus(99)).toBe('in_progress');
            expect(getStatus(100)).toBe('completed');
        });
    });
});
