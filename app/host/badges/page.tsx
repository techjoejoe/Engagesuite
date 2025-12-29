'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { createBadge, getHostBadges, softDeleteBadge, updateBadge, Badge } from '@/lib/badges';
import HostMenu from '@/components/HostMenu';
import Button from '@/components/Button';
import { ImageUpload } from '@/components/picpick/ImageUpload';
import Card from '@/components/Card';

export default function BadgeLibrary() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    // Create Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [uploading, setUploading] = useState(false);

    // Edit Form State
    const [editingBadge, setEditingBadge] = useState<Badge | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((u) => {
            if (u) {
                setUser(u);
                loadBadges(u.uid);
            } else {
                router.push('/login');
            }
        });
        return () => unsubscribe();
    }, [router]);

    const loadBadges = async (hostId: string) => {
        try {
            const list = await getHostBadges(hostId);
            setBadges(list);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBadge = async (blob: Blob) => {
        if (!newName.trim()) {
            alert('Please enter a badge name first');
            return;
        }

        setUploading(true);
        try {
            await createBadge(user.uid, newName, newDesc, blob);
            await loadBadges(user.uid);
            setShowCreateModal(false);
            setNewName('');
            setNewDesc('');
        } catch (e) {
            console.error(e);
            alert('Failed to create badge');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteBadge = async (id: string) => {
        if (confirm('Are you sure you want to delete this badge? Users who have already earned it will keep it.')) {
            try {
                await softDeleteBadge(id);
                setBadges(badges.filter(b => b.id !== id));
            } catch (error) {
                console.error('Error deleting badge:', error);
                alert('Failed to delete badge');
            }
        }
    };

    const handleUpdateBadge = async () => {
        if (!editingBadge || !editingBadge.name.trim()) return;

        try {
            await updateBadge(editingBadge.id, {
                name: editingBadge.name,
                description: editingBadge.description
            });
            await loadBadges(user.uid);
            setShowEditModal(false);
            setEditingBadge(null);
        } catch (error) {
            console.error('Error updating badge:', error);
            alert('Failed to update badge');
        }
    };

    if (loading) return <div className="text-center p-8 text-white">Loading...</div>;

    return (
        <main className="min-h-screen bg-slate-900 text-white p-6 pb-24">
            <HostMenu currentPage="badges" />

            <div className="container mx-auto max-w-6xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Badge Library</h1>
                        <p className="text-gray-400">Create & Manage your custom badges</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        + Create Badge
                    </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {badges.map(badge => (
                        <Card key={badge.id} className="bg-slate-800 border-slate-700 p-4 flex flex-col items-center text-center group relative">
                            {/* Management Overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingBadge(badge);
                                        setShowEditModal(true);
                                    }}
                                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white"
                                    title="Edit"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBadge(badge.id);
                                    }}
                                    className="p-1.5 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-400 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    🗑️
                                </button>
                            </div>

                            <div className="w-24 h-24 mb-4 relative drop-shadow-lg transition-transform group-hover:scale-105">
                                <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-contain" />
                            </div>
                            <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
                        </Card>
                    ))}

                    {badges.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl">
                            <p>No badges created yet. Click "Create Badge" to start.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full bg-slate-800 border-slate-700 p-6 relative">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >✕</button>

                        <h2 className="text-2xl font-bold mb-6">Create New Badge</h2>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">Badge Name</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full p-2 rounded bg-slate-900 border border-slate-600 focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Speed Demon"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea
                                    value={newDesc}
                                    onChange={e => setNewDesc(e.target.value)}
                                    className="w-full p-2 rounded bg-slate-900 border border-slate-600 focus:border-indigo-500 outline-none resize-none h-20"
                                    placeholder="Awarded for..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2">Badge Image (PNG)</label>
                                <ImageUpload onUpload={handleCreateBadge} uploading={uploading} />
                                <p className="text-xs text-gray-400 mt-2 text-center">Upload starts immediately upon selection</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingBadge && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="max-w-md w-full bg-slate-800 border-slate-700 p-6 relative">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >✕</button>

                        <h2 className="text-2xl font-bold mb-6">Edit Badge</h2>

                        <div className="flex justify-center mb-6 bg-slate-900/50 p-4 rounded-xl">
                            <img src={editingBadge.imageUrl} alt="Badge" className="w-24 h-24 object-contain" />
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-bold mb-2">Badge Name</label>
                                <input
                                    type="text"
                                    value={editingBadge.name}
                                    onChange={e => setEditingBadge({ ...editingBadge, name: e.target.value })}
                                    className="w-full p-2 rounded bg-slate-900 border border-slate-600 focus:border-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea
                                    value={editingBadge.description}
                                    onChange={e => setEditingBadge({ ...editingBadge, description: e.target.value })}
                                    className="w-full p-2 rounded bg-slate-900 border border-slate-600 focus:border-indigo-500 outline-none resize-none h-20"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleUpdateBadge}>Save Changes</Button>
                        </div>
                    </Card>
                </div>
            )}
        </main>
    );
}
