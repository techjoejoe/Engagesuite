"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDesignerAlbums, createAlbumTemplate, getPublishedAlbums, AlbumTemplate } from '@/lib/albums';
import { Plus, BookOpen, Edit, Trash2, Globe, Library } from 'lucide-react';

export default function AlbumDesignerDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'my' | 'library'>('my');
    const [albums, setAlbums] = useState<AlbumTemplate[]>([]);
    const [libraryAlbums, setLibraryAlbums] = useState<AlbumTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        // Listen to auth state to ensure we have a valid user for actions
        // We reuse this for loading albums too
        const unsubscribe = require('@/lib/auth').onAuthStateChange((u: any) => {
            setUser(u);
            if (u) {
                // Load albums when user is confirmed
                getDesignerAlbums(u.uid).then(setAlbums).catch(console.error).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (activeTab === 'library') {
            setLoading(true);
            getPublishedAlbums()
                .then(setLibraryAlbums)
                .catch(console.error)
                .finally(() => setLoading(false));
        } else if (user) {
            // Re-fetch my albums to ensure up to date? Or just rely on initial load?
            // Let's re-fetch briefly or just cache.
            setLoading(true);
            getDesignerAlbums(user.uid)
                .then(setAlbums)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [activeTab, user]);

    const handleCreateNew = async () => {
        if (!user) {
            alert("You must be logged in to create a workbook.");
            return;
        }

        try {
            const newId = await createAlbumTemplate(user.uid, "Untitled Workbook");
            router.push(`/host/design/create?id=${newId}`);
        } catch (error) {
            console.error("Failed to create", error);
            alert("Failed to create new workbook. See console.");
        }
    };

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
    const [myClasses, setMyClasses] = useState<any[]>([]);
    const [assigningClassId, setAssigningClassId] = useState<string | null>(null);

    const openAssignModal = async (albumId: string) => {
        setSelectedAlbumId(albumId);
        setAssignModalOpen(true);
        if (user) {
            const classes = await import('@/lib/classes').then(m => m.getHostedClasses(user.uid));
            setMyClasses(classes);
        }
    };

    const handleAssignToClass = async (classId: string) => {
        if (!selectedAlbumId || !user) return;
        setAssigningClassId(classId);
        try {
            await import('@/lib/albums').then(m => m.assignAlbumToClass(selectedAlbumId, classId, user.uid));
            alert("Workbook successfully assigned to class!");
            setAssignModalOpen(false);
        } catch (e) {
            console.error("Assign failed", e);
            alert("Failed to assign workbook.");
        } finally {
            setAssigningClassId(null);
        }
    };

    const displayedAlbums = activeTab === 'my' ? albums : libraryAlbums;

    return (
        <div className="min-h-screen bg-slate-900 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <button onClick={() => router.push('/dashboard')} className="text-sm font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1">
                            &larr; Back to Dashboard
                        </button>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Designer Studio</h1>
                        <p className="text-white/60 mt-1">Create interactive workbooks for your classes.</p>
                    </div>

                    <div className="flex bg-white/10 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                        <button
                            onClick={() => setActiveTab('my')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'my' ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:bg-white/5'
                                }`}
                        >
                            <BookOpen className="w-4 h-4" /> My Workbooks
                        </button>
                        <button
                            onClick={() => setActiveTab('library')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-blue-500/20 text-blue-400' : 'text-white/60 hover:bg-white/5'
                                }`}
                        >
                            <Globe className="w-4 h-4" /> Public Library
                        </button>
                    </div>

                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        New Workbook
                    </button>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-white/10 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : displayedAlbums.length === 0 ? (
                    <div className="text-center py-20 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/10">
                        <div className="bg-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">
                            {activeTab === 'my' ? "No Workbooks Yet" : "Library is Empty"}
                        </h3>
                        <p className="text-white/60 max-w-md mx-auto mb-8">
                            {activeTab === 'my'
                                ? "Get started by creating your first interactive workbook."
                                : "No published workbooks found from other designers."}
                        </p>
                        {activeTab === 'my' && (
                            <button
                                onClick={handleCreateNew}
                                className="text-blue-600 font-semibold hover:text-blue-800"
                            >
                                Create your first workbook &rarr;
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedAlbums.map((album) => {
                            const isMyAlbum = user && album.designerId === user.uid;
                            return (
                                <div
                                    key={album.id}
                                    className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:shadow-xl transition-all border border-white/10 relative overflow-hidden flex flex-col justify-between"
                                >
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => isMyAlbum ? router.push(`/host/design/create?id=${album.id}`) : null}
                                    >
                                        <div className={`absolute top-0 left-0 w-2 h-full opacity-0 group-hover:opacity-100 transition-opacity ${isMyAlbum ? 'bg-blue-500' : 'bg-green-500'}`} />

                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl ${isMyAlbum ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                                {isMyAlbum ? <BookOpen className="w-6 h-6" /> : <Globe className="w-6 h-6" />}
                                            </div>
                                            {isMyAlbum && (
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-gray-100 rounded-lg text-white/70">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                            {album.title || "Untitled Album"}
                                        </h3>
                                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                            {album.description || "No description added."}
                                        </p>

                                        <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-white/10 pt-4 mb-4">
                                            {isMyAlbum ? (
                                                <span className={album.isPublished ? "text-green-500" : "text-gray-400"}>
                                                    {album.isPublished ? "Published" : "Draft"}
                                                </span>
                                            ) : (
                                                <span className="text-green-600">Public Template</span>
                                            )}
                                            <span>{album.totalPointsAvailable || 0} Points</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openAssignModal(album.id);
                                        }}
                                        className="w-full py-2 bg-blue-500/20 text-blue-400 font-bold rounded-lg hover:bg-blue-500/30 transition-colors"
                                    >
                                        Assign to Class
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Simple Modal */}
            {assignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-4">Assign to Class</h3>
                        <p className="text-white/60 mb-4 text-sm">Select a class to assign this workbook to. Students will see it on their dashboard immediately.</p>

                        <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
                            {myClasses.length === 0 ? (
                                <p className="text-center text-gray-400 py-4">No classes found.</p>
                            ) : myClasses.map(cls => (
                                <button
                                    key={cls.id}
                                    onClick={() => handleAssignToClass(cls.id)}
                                    disabled={!!assigningClassId}
                                    className="w-full text-left p-3 rounded-lg border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-medium flex justify-between group"
                                >
                                    <span>{cls.name}</span>
                                    {assigningClassId === cls.id ? (
                                        <span className="text-blue-600 text-xs font-bold">Assigning...</span>
                                    ) : (
                                        <span className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs font-bold">Select &rarr;</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setAssignModalOpen(false)}
                            className="w-full py-2 text-white/60 font-medium hover:text-gray-800"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
