"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import {
    getClassAlbum,
    getAlbumTemplate,
    getOrCreateAlbumProgress,
    submitAlbumAnswer,
    ClassAlbum,
    AlbumTemplate,
    AlbumProgress,
    AlbumBlock
} from '@/lib/albums';
import { ChevronLeft, ChevronRight, CheckCircle, Circle, Save, Send } from 'lucide-react';

export default function AlbumPlayer({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params); // Assignment ID

    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<ClassAlbum | null>(null);
    const [template, setTemplate] = useState<AlbumTemplate | null>(null);
    const [progress, setProgress] = useState<AlbumProgress | null>(null);
    const [activePageId, setActivePageId] = useState<string | null>(null);

    // Local state for answers before they are saved/submitted
    // Key: blockId, Value: answer
    const [localAnswers, setLocalAnswers] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        async function load() {
            const user = getCurrentUser();
            if (!user) {
                // Redirect to login if not authenticated (simple check)
                // router.push('/login'); 
                // For dev flow, we might need to handle this more gracefully, but keeping it simple
                return;
            }

            try {
                // 1. Fetch Assignment
                const assignData = await getClassAlbum(id);
                if (!assignData) throw new Error("Assignment not found");
                setAssignment(assignData);

                // 2. Fetch Template
                const tempData = await getAlbumTemplate(assignData.templateId);
                if (!tempData) throw new Error("Template not found");
                setTemplate(tempData);

                // 3. Get/Create Progress
                const progData = await getOrCreateAlbumProgress(id, user.uid, assignData.classId);
                setProgress(progData);

                // Load initial page
                if (tempData.pages.length > 0) {
                    // Restore last position or default to first
                    // We could use progData.lastAccessedPageId if we stored it
                    setActivePageId(tempData.pages[0].id);
                }

            } catch (err) {
                console.error("Error loading album:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, router]);

    if (loading) return <div className="p-10 text-center">Loading Workbook...</div>;
    if (!assignment || !template || !progress || !activePageId) return <div className="p-10 text-center">Error loading content</div>;

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

        // Determine correctness (simple check for now)
        // In real app, maybe check block.correctAnswerHash or block.options
        // For now, if Short Answer, assume "needs grading" unless exact match logic exists
        // We'll marked it as correct=false (neutral) for now

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
    };

    const getSavedAnswer = (blockId: string) => {
        // Return local first, then saved, then empty
        if (localAnswers[blockId] !== undefined) return localAnswers[blockId];
        return progress.answers[blockId]?.answer?.toString() || '';
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] flex flex-col md:flex-row font-sans">

            {/* 1. Sidebar Navigation */}
            <aside className="w-full md:w-72 bg-white border-r border-gray-200 flex flex-col h-auto md:h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100">
                    <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-900 mb-4 flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back to Class
                    </button>
                    <h1 className="font-bold text-xl text-gray-900 leading-tight">{assignment.title}</h1>
                    <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
                        <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progress.percentComplete}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{progress.percentComplete}% Complete</p>
                </div>

                <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                    {template.pages.map((page, idx) => {
                        const isCompleted = progress.completedPageIds.includes(page.id); // In future we track this
                        const isActive = activePageId === page.id;

                        return (
                            <button
                                key={page.id}
                                onClick={() => setActivePageId(page.id)}
                                className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-all ${isActive ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-600'
                                    }`}
                            >
                                <div className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                                    {/* Checkmark logic could go here if we tracked page completion explicitly */}
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
                        <h2 className="text-3xl font-extrabold text-gray-900">{activePage.title}</h2>
                    </header>

                    <div className="space-y-8">
                        {activePage.blocks.map((block) => (
                            <div key={block.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                {/* Render Block Content */}

                                {/* Type: Text */}
                                {block.type === 'text' && (
                                    <div className="prose prose-lg text-gray-700 max-w-none whitespace-pre-wrap">
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

                                        <h3 className="text-lg font-medium text-gray-900">{block.content}</h3>

                                        {block.questionType === 'short_answer' && (
                                            <div className="relative">
                                                <textarea
                                                    value={getSavedAnswer(block.id)}
                                                    onChange={(e) => handleAnswerChange(block.id, e.target.value)}
                                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
                                                    placeholder="Type your answer here..."
                                                />
                                                <div className="mt-2 flex justify-end">
                                                    <button
                                                        onClick={() => saveAnswer(block)}
                                                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <Save className="w-4 h-4" /> Save Answer
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>

                    {/* Navigation Footer */}
                    <div className="mt-16 flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <button
                            disabled={isFirstPage}
                            onClick={() => setActivePageId(template.pages[activePageIndex - 1].id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isFirstPage ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" /> Previous
                        </button>

                        <button
                            onClick={() => {
                                if (!isLastPage) {
                                    setActivePageId(template.pages[activePageIndex + 1].id);
                                } else {
                                    // Finish logic
                                    alert("You have reached the end!");
                                    // Update status to completed in DB
                                }
                            }}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform hover:translate-y-[-2px]"
                        >
                            {isLastPage ? 'Finish Workbook' : 'Next Page'}
                            {!isLastPage && <ChevronRight className="w-5 h-5" />}
                        </button>
                    </div>

                </div>
            </main>
        </div>
    );
}
