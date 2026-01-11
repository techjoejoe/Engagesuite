"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AlbumTemplate, AlbumPage, AlbumBlock, updateAlbumTemplate } from '@/lib/albums';
import { Save, Plus, Type, Image as ImageIcon, HelpCircle, GripVertical, Trash, ArrowLeft, MoreVertical, Layout, Globe, Lock } from 'lucide-react';

export default function AlbumEditorPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">Loading Editor...</div>}>
            <EditorContent />
        </Suspense>
    );
}

function EditorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');

    const [album, setAlbum] = useState<AlbumTemplate | null>(null);
    const [activePageId, setActivePageId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const unsubscribe = require('@/lib/auth').onAuthStateChange((u: any) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    // Load Album
    useEffect(() => {
        if (!id) return;
        const load = async () => {
            const snap = await getDoc(doc(db, 'album_templates', id));
            if (snap.exists()) {
                const data = snap.data() as AlbumTemplate;
                // Initialize draftPages if missing
                if (!data.draftPages) {
                    data.draftPages = data.pages;
                }
                setAlbum(data);
                if ((data.draftPages || []).length > 0) setActivePageId((data.draftPages || [])[0].id);
            }
        };
        load();
    }, [id]);

    // Use draftPages for editing interface
    const renderedPages = album?.draftPages || album?.pages || [];
    const activePage = renderedPages.find(p => p.id === activePageId);

    // --- Actions ---

    // --- Actions ---

    const handleSave = async (updatedAlbum: AlbumTemplate) => {
        // Fallback to getting current user directly if state isn't ready
        const currentUser = user || require('@/lib/auth').getCurrentUser();

        if (!currentUser) {
            console.error("Permission denied: No user logged in");
            return;
        }

        if (currentUser.uid !== updatedAlbum.designerId) {
            console.error("Permission denied: User ID mismatch", { expected: updatedAlbum.designerId, actual: currentUser.uid });
            return;
        }

        // --- PUBLISH LOGIC ---
        // If Published: Update BOTH draftPages and pages (Live)
        // If Draft: Update ONLY draftPages (Live pages remain untouched)
        if (updatedAlbum.isPublished) {
            updatedAlbum.pages = updatedAlbum.draftPages || updatedAlbum.pages;
        }

        // Sanitize payload to remove undefined values (firebase rejects them)
        const sanitized = JSON.parse(JSON.stringify(updatedAlbum));

        setAlbum(updatedAlbum);
        setSaving(true);
        try {
            await updateAlbumTemplate(updatedAlbum.id, sanitized);
        } catch (e) {
            console.error("Save failed", e);
            alert("Failed to save due to backend permissions or invalid data.");
        } finally {
            setTimeout(() => setSaving(false), 500);
        }
    };

    const addPage = () => {
        if (!album) return;
        const newPage: AlbumPage = {
            id: `page_${Date.now()}`,
            title: `Page ${album.pages.length + 1}`,
            order: album.pages.length,
            blocks: []
        };
        const updated = { ...album, draftPages: [...renderedPages, newPage] };
        handleSave(updated);
        setActivePageId(newPage.id);
    };

    const addBlock = (type: 'text' | 'image' | 'question', questionSubtype?: 'short_answer' | 'essay' | 'multiple_choice') => {
        if (!album || !activePage) return;

        const newBlock: AlbumBlock = {
            id: `block_${Date.now()}`,
            type,
            content: '',
            points: type === 'question' ? 10 : 0,
            questionType: (type === 'question' && questionSubtype) ? questionSubtype : (type === 'question' ? 'short_answer' : null as any),
            mediaUrl: null as any // Firebase hates undefined
        };

        // Clean up
        if (type !== 'question') delete (newBlock as any).questionType;
        if (type !== 'image') delete (newBlock as any).mediaUrl;

        const updatedPages = renderedPages.map(p => {
            if (p.id === activePage.id) {
                return { ...p, blocks: [...p.blocks, newBlock] };
            }
            return p;
        });

        handleSave({ ...album, draftPages: updatedPages });
    };

    const updateBlock = (blockId: string, updates: Partial<AlbumBlock>) => {
        if (!album || !activePage) return;

        const updatedPages = renderedPages.map(p => {
            if (p.id === activePage.id) {
                const newBlocks = p.blocks.map(b => (b.id === blockId ? { ...b, ...updates } : b));
                return { ...p, blocks: newBlocks };
            }
            return p;
        });

        handleSave({ ...album, draftPages: updatedPages });
    };

    const deleteBlock = (blockId: string) => {
        if (!album || !activePage) return;
        const updatedPages = renderedPages.map(p => {
            if (p.id === activePage.id) {
                return { ...p, blocks: p.blocks.filter(b => b.id !== blockId) };
            }
            return p;
        });
        handleSave({ ...album, draftPages: updatedPages });
    };

    if (!album) return <div className="p-10 text-center">Loading Editor...</div>;

    return (
        <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
            {/* Sidebar - Page Navigation */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col z-10">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <button onClick={() => router.back()} className="hover:bg-gray-100 p-1 rounded-md">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <h2 className="font-bold text-gray-800 truncate">{album.title}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {album.pages.map((page, idx) => (
                        <button
                            key={page.id}
                            onClick={() => setActivePageId(page.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${activePageId === page.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <span className="text-xs opacity-50 w-4">{idx + 1}.</span>
                            <span className="truncate">{page.title}</span>
                        </button>
                    ))}

                    <button
                        onClick={addPage}
                        className="w-full mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 text-sm transition-all"
                    >
                        <Plus className="w-4 h-4" /> Add Page
                    </button>
                </div>

                <div className="p-4 border-t border-gray-200 text-xs text-center text-gray-400">
                    {saving ? 'Saving changes...' : 'All changes saved'}
                </div>
            </aside>

            {/* Main Editor Area */}
            <main className="flex-1 overflow-y-auto relative">
                <div className="max-w-3xl mx-auto py-12 px-8 pb-32">

                    {/* Album Meta */}
                    <div className="mb-12 border-b border-gray-200 pb-8">
                        <div className="flex justify-between items-start mb-4">
                            <input
                                value={album.title}
                                onChange={(e) => handleSave({ ...album, title: e.target.value })}
                                className="text-4xl font-extrabold text-gray-900 w-full bg-transparent border-none focus:ring-0 placeholder-gray-300"
                                placeholder="Untitled Workbook"
                            />

                            <button
                                onClick={() => {
                                    const newStatus = !album.isPublished;
                                    const updates: any = { isPublished: newStatus };
                                    if (newStatus) {
                                        // Publishing: Sync draft to live
                                        updates.pages = album.draftPages;
                                    }
                                    handleSave({ ...album, ...updates });
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all ${album.isPublished
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                title={album.isPublished ? "Published: Edits are Live" : "Draft: Edits are Hidden"}
                            >
                                {album.isPublished ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                {album.isPublished ? "Published" : "Draft"}
                            </button>
                        </div>
                        <div className="flex gap-4 items-start mt-2">
                            <input
                                value={album.description}
                                onChange={(e) => handleSave({ ...album, description: e.target.value })}
                                className="text-lg text-gray-500 w-full bg-transparent border-none focus:ring-0 placeholder-gray-300 flex-1"
                                placeholder="Add a description for your students..."
                            />
                            <div className="bg-green-50 rounded-lg px-3 py-1 flex flex-col items-center border border-green-100 min-w-[120px]">
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Finish Bonus</span>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-green-700">+</span>
                                    <input
                                        type="number"
                                        value={album.completionPoints || 0}
                                        onChange={(e) => handleSave({ ...album, completionPoints: parseInt(e.target.value) || 0 })}
                                        className="w-12 text-center font-bold text-green-700 bg-transparent border-none focus:ring-0 p-0 text-sm"
                                        placeholder="0"
                                    />
                                    <span className="text-xs font-bold text-green-700">pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Page Content */}
                    {activePage ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 mb-6 group">
                                <input
                                    value={activePage.title}
                                    onChange={(e) => {
                                        const updatedPages = renderedPages.map(p =>
                                            p.id === activePage.id ? { ...p, title: e.target.value } : p
                                        );
                                        handleSave({ ...album, draftPages: updatedPages });
                                    }}
                                    className="text-2xl font-bold text-gray-800 bg-transparent border-none focus:ring-0 w-full"
                                />
                            </div>

                            {activePage.blocks.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
                                    Start adding content to this page
                                </div>
                            )}

                            {activePage.blocks.map((block) => (
                                <div key={block.id} className="group relative bg-white border border-transparent hover:border-gray-200 hover:shadow-sm rounded-xl p-1 transition-all">
                                    {/* Component for Loop */}
                                    <BlockEditor block={block} updateBlock={updateBlock} />

                                    {/* Hover Actions */}
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-lg p-1">
                                        <div className="text-xs font-semibold text-blue-600 px-2 bg-blue-50 rounded line-clamp-1 mr-2">
                                            {block.points > 0 ? `${block.points} pts` : ''}
                                        </div>
                                        <button className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500" onClick={() => deleteBlock(block.id)}>
                                            <Trash className="w-4 h-4" />
                                        </button>
                                        <div className="cursor-grab p-1 hover:bg-gray-100 rounded text-gray-400">
                                            <GripVertical className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Add Block Menu */}
                            <div className="mt-8 flex justify-center gap-3 flex-wrap">
                                <FloatingActionButton icon={<Type className="w-5 h-5" />} label="Text" onClick={() => addBlock('text')} />
                                <FloatingActionButton icon={<ImageIcon className="w-5 h-5" />} label="Image" onClick={() => addBlock('image')} />
                                <div className="w-px bg-gray-300 h-8 mx-2 self-center"></div>
                                <FloatingActionButton icon={<HelpCircle className="w-5 h-5" />} label="Fill-in-Blank" onClick={() => addBlock('question', 'short_answer')} />
                                <FloatingActionButton icon={<Layout className="w-5 h-5" />} label="Essay" onClick={() => addBlock('question', 'essay')} />
                                <FloatingActionButton icon={<GripVertical className="w-5 h-5" />} label="Multiple Choice" onClick={() => addBlock('question', 'multiple_choice')} />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 mt-20">Select or create a page to edit</div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Sub-components for cleaner code

function FloatingActionButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all text-gray-600 text-sm font-medium"
        >
            {icon}
            {label}
        </button>
    );
}

function BlockEditor({ block, updateBlock }: { block: AlbumBlock, updateBlock: (id: string, data: Partial<AlbumBlock>) => void }) {
    if (block.type === 'text') {
        return (
            <div className="relative group p-2 hover:bg-gray-50 rounded-xl transition-colors">
                <div className="flex justify-between items-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-0 bg-white shadow-sm border border-gray-100 rounded-lg px-2 py-1 z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Points</span>
                    <input
                        type="number"
                        value={block.points || 0}
                        onChange={(e) => updateBlock(block.id, { points: parseInt(e.target.value) || 0 })}
                        className="w-12 text-right text-xs border-none p-0 focus:ring-0 font-bold text-gray-600 bg-transparent"
                        placeholder="0"
                    />
                </div>
                <textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Type your content here..."
                    className="w-full min-h-[100px] p-2 rounded-lg border-none focus:ring-0 resize-none text-gray-700 leading-relaxed bg-transparent"
                />
            </div>
        );
    }

    if (block.type === 'question') {
        return (
            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-100 px-2 py-1 rounded">
                        Question
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-blue-400 font-bold uppercase">Points</span>
                        <input
                            type="number"
                            value={block.points}
                            onChange={(e) => updateBlock(block.id, { points: parseInt(e.target.value) || 0 })}
                            className="w-16 text-right text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                            placeholder="Points"
                        />
                    </div>
                </div>

                <input
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Enter your question here..."
                    className="w-full text-lg font-semibold bg-transparent border-none focus:ring-0 placeholder-blue-300 text-gray-800 mb-4"
                />

                <div className="flex gap-4">
                    <select
                        value={block.questionType}
                        onChange={(e) => updateBlock(block.id, { questionType: e.target.value as any })}
                        className="text-sm border-gray-200 rounded-lg bg-white text-gray-600 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="short_answer">Short Answer</option>
                        <option value="essay">Long Essay</option>
                        <option value="multiple_choice">Multiple Choice</option>
                    </select>
                </div>

                {/* Multiple Choice Editor */}
                {block.questionType === 'multiple_choice' && (
                    <div className="mt-6 space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Answer Options & Correct Answer</label>
                        {(block.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4']).map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name={`correct_${block.id}`}
                                    checked={block.correctAnswerHash === opt}
                                    onChange={() => updateBlock(block.id, { correctAnswerHash: opt })} // Storing plain text answer for now
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                        const newOptions = [...(block.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'])];
                                        newOptions[idx] = e.target.value;
                                        // If this was the correct answer, update the correct answer field too if we want to track by value
                                        // But if we track by value, changing text breaks the selection if we don't update it.
                                        // Better to track selection separate? 
                                        // For simplicity: If tracked by value (string), we update it.
                                        let updates: any = { options: newOptions };
                                        if (block.correctAnswerHash === opt) {
                                            updates.correctAnswerHash = e.target.value;
                                        }
                                        updateBlock(block.id, updates);
                                    }}
                                    className="flex-1 text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    placeholder={`Option ${idx + 1}`}
                                />
                                <button
                                    onClick={() => {
                                        const newOptions = (block.options || []).filter((_, i) => i !== idx);
                                        updateBlock(block.id, { options: newOptions });
                                    }}
                                    className="text-gray-400 hover:text-red-500"
                                    title="Remove Option"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={() => {
                                const newOptions = [...(block.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4']), `Option ${(block.options?.length || 4) + 1}`];
                                updateBlock(block.id, { options: newOptions });
                            }}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700 mt-2"
                        >
                            + Add Option
                        </button>
                    </div>
                )}
            </div>
        );
    }

    if (block.type === 'image') {
        return (
            <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 relative group">
                <div className="flex justify-between items-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 right-4 bg-white shadow-sm border border-gray-100 rounded-lg px-2 py-1 z-10">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2">Points</span>
                    <input
                        type="number"
                        value={block.points || 0}
                        onChange={(e) => updateBlock(block.id, { points: parseInt(e.target.value) || 0 })}
                        className="w-12 text-right text-xs border-none p-0 focus:ring-0 font-bold text-gray-600 bg-transparent"
                        placeholder="0"
                    />
                </div>
                <input
                    value={block.mediaUrl || ''}
                    onChange={(e) => updateBlock(block.id, { mediaUrl: e.target.value })}
                    placeholder="Paste Image URL here..."
                    className="w-full text-sm bg-transparent border-none focus:ring-0 text-blue-600 underline"
                />
                {(block.mediaUrl) && (
                    <div className="mt-4 rounded-lg overflow-hidden shadow-sm max-h-64 bg-gray-200 flex items-center justify-center">
                        <img src={block.mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                    </div>
                )}
            </div>
        );
    }

    return <div>Unknown Block</div>;
}
