"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type {
    ClassAlbum,
    AlbumTemplate,
    AlbumProgress,
    AlbumBlock
} from '@/lib/albums';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Save, Send, XCircle } from 'lucide-react';

export default function AlbumPlayerContent({ id: propId }: { id?: string }) {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    // Determine ID from Prop > SearchParam > RouteParam
    const id = propId || searchParams?.get('id') || (params?.id as string);

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<ClassAlbum | null>(null);
    const [template, setTemplate] = useState<AlbumTemplate | null>(null);
    const [progress, setProgress] = useState<AlbumProgress | null>(null);
    const [activePageId, setActivePageId] = useState<string | null>(null);

    // Local state for answers before they are saved/submitted
    const [localAnswers, setLocalAnswers] = useState<{ [key: string]: string }>({});
    const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
    const [completionMessage, setCompletionMessage] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let unsub: () => void | undefined;

        async function load() {
            // Dynamically import libs to ensure they only run on client
            const { getCurrentUser, onAuthStateChange } = await import('@/lib/auth');
            const {
                getClassAlbum,
                getAlbumTemplate,
                getOrCreateAlbumProgress
            } = await import('@/lib/albums');

            // Wait for auth to be ready
            unsub = onAuthStateChange(async (user) => {
                if (!user) {
                    setLoading(false);
                    setError("Please log in to view this workbook.");
                    return;
                }

                if (!id) {
                    setError("No workbook ID provided.");
                    setLoading(false);
                    return;
                }

                try {
                    setLoading(true);
                    setError(null);

                    // 1. Fetch Assignment
                    const assignData = await getClassAlbum(id);
                    if (!assignData) throw new Error("Assignment not found (Invalid ID)");
                    setAssignment(assignData);

                    // 2. Fetch Template
                    const tempData = await getAlbumTemplate(assignData.templateId);
                    if (!tempData) throw new Error("Template not found (Source Deleted?)");
                    setTemplate(tempData);

                    // 3. Get/Create Progress
                    const progData = await getOrCreateAlbumProgress(id, assignData.classId, user.uid);
                    setProgress(progData);

                    // Load initial page
                    if (tempData.pages.length > 0) {
                        setActivePageId(tempData.pages[0].id);
                    } else {
                        throw new Error("This workbook has no pages yet.");
                    }

                } catch (err: any) {
                    console.error("Error loading album:", err);
                    setError(err.message || "Unknown error occurred");
                } finally {
                    setLoading(false);
                }
            });
        }

        load();

        return () => { if (unsub) unsub(); };
    }, [id, router]);

    // Listener for Live Class Activities (Force Redirect)
    useEffect(() => {
        if (!assignment?.classId) return;

        let unsubClass: (() => void) | undefined;
        let isRedirecting = false;

        import('@/lib/classes').then(({ onClassChange }) => {
            unsubClass = onClassChange(assignment.classId, (classData) => {
                if (isRedirecting) return;

                const activity = classData.currentActivity;
                // If there is an active activity (that isn't 'none'), redirect the student
                if (activity && activity.type && activity.type !== 'none') {
                    console.log("Live activity detected, redirecting...", activity.type);
                    isRedirecting = true;
                    // Redirect to the main class player which handles the specific activity view
                    router.push(`/play/class/${assignment.classId}`);
                }
            });
        });

        return () => {
            if (unsubClass) unsubClass();
        };
    }, [assignment?.classId, router]);

    if (loading) return <div className="p-10 text-center">Loading Workbook...</div>;

    if (error) return (
        <div className="p-10 text-center">
            <div className="text-red-500 font-bold mb-2">Error Loading Content</div>
            <div className="text-gray-600">{error}</div>
            <button onClick={() => router.back()} className="mt-4 text-blue-500 hover:underline">Go Back</button>
        </div>
    );

    if (!assignment || !template || !progress || !activePageId) return <div className="p-10 text-center">Unknown State Error</div>;

    const activePage = template.pages.find(p => p.id === activePageId);
    if (!activePage) return <div>Page not found</div>;

    const activePageIndex = template.pages.findIndex(p => p.id === activePageId);
    const isLastPage = activePageIndex === template.pages.length - 1;
    const isFirstPage = activePageIndex === 0;

    // --- Handlers ---

    const handleAnswerChange = (blockId: string, value: string) => {
        setLocalAnswers(prev => ({ ...prev, [blockId]: value }));
    };

    const saveAnswer = async (block: AlbumBlock) => {
        if (!progress) return;
        const val = localAnswers[block.id];
        if (val === undefined) return; // No change

        setSavingBlockId(block.id);
        try {
            const { submitAlbumAnswer } = await import('@/lib/albums');

            // Determine correctness (simple check for now)
            await submitAlbumAnswer(progress.id, block.id, val, block.points, false);

            // Optimistic update
            setProgress(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    answers: {
                        ...prev.answers,
                        [block.id]: {
                            answer: val,
                            submittedAt: Date.now(),
                            awardedPoints: 0, // Pending grading
                            isCorrect: false
                        }
                    }
                };
            });
        } finally {
            setSavingBlockId(null);
        }
    };

    const getSavedAnswer = (blockId: string) => {
        // Return local first, then saved, then empty
        if (localAnswers[blockId] !== undefined) return localAnswers[blockId];
        return progress.answers[blockId]?.answer?.toString() || '';
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row font-sans">

            {/* 1. Sidebar Navigation */}
            <aside className="w-full md:w-72 bg-slate-800/80 text-white border-r border-white/10 flex flex-col h-auto md:h-screen sticky top-0">
                <div className="p-6 border-b border-white/10">
                    <button onClick={() => router.back()} className="text-sm text-white/60 hover:text-white mb-4 flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back to Class
                    </button>
                    <h1 className="font-bold text-xl text-white leading-tight">{assignment.title}</h1>
                    <div className="mt-2 w-full bg-white/10 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentComplete}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.percentComplete}% Complete</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {template.pages.map((page, idx) => {
                        const isActive = activePageId === page.id;

                        return (
                            <button
                                key={page.id}
                                onClick={() => setActivePageId(page.id)}
                                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'hover:bg-white/10 text-white/60'
                                    }`}
                            >
                                <div className={`mt-0.5 ${isActive ? 'text-indigo-400' : 'text-gray-400'}`}>
                                    <Circle className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">Page {idx + 1}</div>
                                    <div className="text-xs opacity-80 truncate w-40">{page.title}</div>
                                </div>
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* 2. Main Content Area */}
            <main className="flex-1 h-screen overflow-y-auto">
                <div className="max-w-3xl mx-auto py-12 px-6 pb-32">

                    <header className="mb-10">
                        <h2 className="text-3xl font-extrabold text-white">{activePage.title}</h2>
                    </header>

                    <div className="space-y-8">
                        {activePage.blocks.map((block) => (
                            <div key={block.id} className="bg-white/5 p-6 rounded-2xl shadow-sm border border-white/10">
                                {/* Type: Text */}
                                {block.type === 'text' && (
                                    <div className="prose prose-lg text-white/80 max-w-none whitespace-pre-wrap">
                                        {block.content}
                                    </div>
                                )}

                                {/* Type: Image */}
                                {block.type === 'image' && (
                                    <div>
                                        <img src={block.content || block.mediaUrl} className="rounded-xl w-full object-cover max-h-[500px]" alt="Album content" />
                                    </div>
                                )}

                                {/* Type: Question */}
                                {block.type === 'question' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">Question</span>
                                            <span className="text-gray-400 text-xs">{block.points} pts</span>
                                        </div>

                                        <h3 className="text-lg font-medium text-white">{block.content}</h3>

                                        {/* Short Answer (Fill in the Blank) */}
                                        {(block.questionType === 'short_answer' || !block.questionType) && (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={getSavedAnswer(block.id)}
                                                    onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                    className="w-full p-4 border border-white/20 rounded-xl bg-white/5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-white"
                                                    placeholder="Type your answer here..."
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        onClick={() => saveAnswer(block)}
                                                        disabled={savingBlockId === block.id}
                                                        className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        {savingBlockId === block.id ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Long Essay (Open Text) */}
                                        {block.questionType === 'essay' && (
                                            <div className="relative">
                                                <textarea
                                                    value={getSavedAnswer(block.id)}
                                                    onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                    className="w-full p-4 border border-white/20 rounded-xl bg-white/5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[200px] leading-relaxed text-white placeholder-white/40"
                                                    placeholder="Type your detailed response here..."
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        onClick={() => saveAnswer(block)}
                                                        disabled={savingBlockId === block.id}
                                                        className="flex items-center gap-2 text-sm font-medium text-indigo-300 hover:text-indigo-200 bg-indigo-500/20 hover:bg-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                        {savingBlockId === block.id ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Multiple Choice */}
                                        {block.questionType === 'multiple_choice' && (
                                            <div className="space-y-3">
                                                {(block.options || []).map((option, optIdx) => {
                                                    const savedAnswer = getSavedAnswer(block.id);
                                                    const isSelected = savedAnswer === option;
                                                    const hasSubmitted = !!savedAnswer;
                                                    const isCorrectOption = option === block.correctAnswerHash;

                                                    // Determine styling based on state
                                                    let buttonStyle = "border-white/10 bg-white/5 text-white/70";
                                                    let icon = null;

                                                    if (hasSubmitted) {
                                                        if (isCorrectOption) {
                                                            buttonStyle = "border-green-500 bg-green-50 text-green-800 font-bold ring-1 ring-green-500";
                                                            icon = <CheckCircle className="w-5 h-5 text-green-600" />;
                                                        } else if (isSelected) {
                                                            buttonStyle = "border-red-500 bg-red-50 text-red-800 ring-1 ring-red-500";
                                                            icon = <XCircle className="w-5 h-5 text-red-600" />;
                                                        } else {
                                                            buttonStyle = "border-white/10 bg-white/5 text-white/40 opacity-60";
                                                        }
                                                    } else {
                                                        // Interactive state
                                                        buttonStyle = isSelected
                                                            ? 'border-blue-500 bg-indigo-500/20 text-indigo-300'
                                                            : 'border-white/10 bg-white/5 hover:border-indigo-400 hover:bg-white/10 text-white/70';
                                                        if (isSelected) icon = <CheckCircle className="w-5 h-5 text-blue-600" />;
                                                    }

                                                    return (
                                                        <button
                                                            key={optIdx}
                                                            disabled={hasSubmitted}
                                                            onClick={async () => {
                                                                if (hasSubmitted) return;

                                                                handleAnswerChange(block.id, option);

                                                                if (!progress) return;
                                                                const { submitAlbumAnswer } = await import('@/lib/albums');
                                                                const isCorrect = option === block.correctAnswerHash;
                                                                await submitAlbumAnswer(progress.id, block.id, option, block.points, isCorrect);

                                                                setProgress(prev => {
                                                                    if (!prev) return null;
                                                                    return {
                                                                        ...prev,
                                                                        answers: {
                                                                            ...prev.answers,
                                                                            [block.id]: {
                                                                                answer: option,
                                                                                submittedAt: Date.now(),
                                                                                awardedPoints: isCorrect ? block.points : 0,
                                                                                isCorrect
                                                                            }
                                                                        }
                                                                    };
                                                                });
                                                            }}
                                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${buttonStyle} ${hasSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                                                        >
                                                            <span className="font-medium">{option}</span>
                                                            {icon}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                    {/* Navigation Footer */}
                    <div className="mt-16 flex justify-between items-center bg-white/5 p-4 rounded-2xl shadow-sm border border-white/10">
                        <button
                            disabled={isFirstPage}
                            onClick={() => setActivePageId(template.pages[activePageIndex - 1].id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isFirstPage ? 'opacity-50 cursor-not-allowed text-white/40' : 'text-white/70 hover:bg-white/10'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>

                        <button
                            onClick={async () => {
                                // 1. Mark Page as Complete
                                const newCompletedPages = Array.from(new Set([...(progress.completedPageIds || []), activePageId]));

                                // 2. Calculate Progress
                                // Count total questions in entire album
                                let totalQuestions = 0;
                                let answeredQuestions = 0;

                                template.pages.forEach(p => {
                                    p.blocks.forEach(b => {
                                        if (b.type === 'question') {
                                            totalQuestions++;
                                            // Check if answered
                                            if (progress.answers?.[b.id] || localAnswers[b.id]) {
                                                answeredQuestions++;
                                            }
                                        }
                                    });
                                });

                                const percent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 100;

                                // 3. Update State & DB
                                const updates: any = {
                                    completedPageIds: newCompletedPages,
                                    percentComplete: percent,
                                    status: percent === 100 ? 'completed' : 'in_progress'
                                };

                                // Optimistic
                                setProgress(prev => prev ? ({ ...prev, ...updates }) : null);

                                try {
                                    const { updateAlbumProgressStats } = await import('@/lib/albums');
                                    await updateAlbumProgressStats(progress.id, updates);
                                } catch (e) {
                                    console.error("Failed to update progress stats", e);
                                }

                                // 4. Navigate
                                if (!isLastPage) {
                                    setActivePageId(template.pages[activePageIndex + 1].id);
                                } else {
                                    // Finish logic
                                    if (percent === 100) {
                                        const { completeWorkbook } = await import('@/lib/albums');
                                        await completeWorkbook(progress.id, template.id);
                                        setCompletionMessage(`🎉 Workbook Complete! You answered ${answeredQuestions}/${totalQuestions} questions and earned the completion bonus!`);
                                    } else {
                                        setCompletionMessage(`You've reached the end, but only completed ${percent}% of questions. Go back and finish the rest!`);
                                    }
                                    setTimeout(() => router.push('/student/dashboard'), 3000);
                                }
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:translate-y-[-2px]"
                        >
                            {isLastPage ? 'Finish Workbook' : 'Next Page'}
                            {!isLastPage && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                </div>

                {/* Completion Message Overlay */}
                {completionMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="glass-card p-8 max-w-md mx-4 text-center">
                            <div className="text-5xl mb-4">{completionMessage.includes('🎉') ? '🎉' : '📝'}</div>
                            <p className="text-white text-lg font-medium mb-4">{completionMessage.replace('🎉 ', '')}</p>
                            <p className="text-white/60 text-sm">Redirecting to dashboard...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
