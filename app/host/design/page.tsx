"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDesignerAlbums, createAlbumTemplate, AlbumTemplate } from '@/lib/albums';
import { Plus, BookOpen, Edit, Trash2 } from 'lucide-react';

export default function AlbumDesignerDashboard() {
    const router = useRouter();
    const [albums, setAlbums] = useState<AlbumTemplate[]>([]);
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

    const handleCreateNew = async () => {
        if (!user) {
            alert("You must be logged in to create an album.");
            return;
        }

        try {
            const newId = await createAlbumTemplate(user.uid, "Untitled Album");
            router.push(`/host/design/create?id=${newId}`);
        } catch (error) {
            console.error("Failed to create", error);
            alert("Failed to create new album. See console.");
        }
    };

    return (
        <div className="min-h-screen bg-[#F3F4F6] p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Designer Studio</h1>
                        <p className="text-gray-500 mt-1">Create interactive workbooks and albums for your classes.</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all transform hover:scale-105"
                    >
                        <Plus className="w-5 h-5" />
                        New Album
                    </button>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : albums.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Albums Yet</h3>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">Get started by creating your first interactive workbook. Add text, videos, and questions.</p>
                        <button
                            onClick={handleCreateNew}
                            className="text-blue-600 font-semibold hover:text-blue-800"
                        >
                            Create your first album &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {albums.map((album) => (
                            <div
                                key={album.id}
                                className="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 cursor-pointer relative overflow-hidden"
                                onClick={() => router.push(`/host/design/create?id=${album.id}`)}
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 hover:bg-red-50 text-red-500 rounded-lg">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {album.title || "Untitled Album"}
                                </h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                    {album.description || "No description added."}
                                </p>

                                <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-50 pt-4">
                                    <span>{album.pages?.length || 0} Pages</span>
                                    <span>{album.totalPointsAvailable || 0} Points Available</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
