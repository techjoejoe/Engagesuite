'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Icons } from '@/components/picpick/Icons';
import { Spinner, Toast } from '@/components/picpick/UI';
import Button from '@/components/Button';

// Helper to format date
const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const isWithinWindow = (start: any, end: any) => {
    if (!start || !end) return false;
    const now = new Date();
    const startDate = start?.toDate ? start.toDate() : new Date(start);
    const endDate = end?.toDate ? end.toDate() : new Date(end);
    return now >= startDate && now <= endDate;
};

const generateGalleryCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function AdminDashboard() {
    const router = useRouter();
    const [galleries, setGalleries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'galleries'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const galleriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGalleries(galleriesData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '1200px' }}>
                {/* Header */}
                <div className="flex-between mb-5">
                    <div className="flex align-center gap-3">
                        <Link href="/dashboard/class">
                            <Button variant="glass" size="sm" style={{ padding: '0.5rem' }}>
                                <Icons.Back style={{ width: '20px', height: '20px' }} />
                            </Button>
                        </Link>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Icons.Fire style={{ width: '24px', height: '24px', color: 'white' }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>PicPick Admin</h1>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                Manage your photo contests
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <Icons.Plus style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                        New Gallery
                    </Button>
                </div>

                {/* Content */}
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="flex-center" style={{ padding: '4rem' }}>
                            <Spinner size="lg" />
                        </div>
                    ) : galleries.length === 0 ? (
                        <div className="card" style={{ padding: '4rem', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem auto'
                            }}>
                                <Icons.Camera style={{ width: '40px', height: '40px', opacity: 0.4 }} />
                            </div>
                            <h3 className="mb-2" style={{ fontSize: '1.5rem' }}>No galleries yet</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem auto' }}>
                                Create your first photo contest gallery to get started. You can share the code with participants to join.
                            </p>
                            <Button onClick={() => setShowCreateModal(true)} variant="primary">
                                <Icons.Plus style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                                Create Gallery
                            </Button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {galleries.map((gallery) => (
                                <GalleryCard
                                    key={gallery.id}
                                    gallery={gallery}
                                    onClick={() => router.push(`/picpick/admin/gallery/${gallery.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showCreateModal && <CreateGalleryModal onClose={() => setShowCreateModal(false)} setToast={setToast} />}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </main>
    );
}

const GalleryCard = ({ gallery, onClick }: { gallery: any, onClick: () => void }) => {
    const [copied, setCopied] = useState(false);
    const votingOpen = isWithinWindow(gallery.votingStart, gallery.votingEnd);

    const copyCode = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(gallery.code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className="card glass-hover"
            onClick={onClick}
            style={{
                padding: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
        >
            <div className="flex-between align-start">
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                    <Icons.Trophy style={{ width: '24px', height: '24px', color: '#818cf8' }} />
                </div>
                <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: votingOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    color: votingOpen ? '#4ade80' : 'rgba(255, 255, 255, 0.4)',
                    border: votingOpen ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    {votingOpen ? 'Live' : 'Closed'}
                </span>
            </div>

            <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{gallery.name}</h3>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '2.7rem'
                }}>
                    {gallery.description}
                </p>
            </div>

            <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>
                        JOIN CODE
                    </div>
                    <div style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '0.1em' }}>
                        {gallery.code || '----'}
                    </div>
                </div>
                <Button
                    variant="glass"
                    size="sm"
                    onClick={copyCode}
                    style={{ padding: '0.5rem', minWidth: 'auto' }}
                >
                    {copied ? <Icons.Check style={{ width: '16px', height: '16px', color: '#4ade80' }} /> : <Icons.Copy style={{ width: '16px', height: '16px' }} />}
                </Button>
            </div>

            <div style={{
                paddingTop: '1rem',
                marginTop: 'auto',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: 'rgba(255, 255, 255, 0.4)',
                fontFamily: 'monospace'
            }}>
                <span>Created {formatDate(gallery.createdAt)}</span>
                <span>Ends {formatDate(gallery.votingEnd)}</span>
            </div>
        </div>
    );
};

const CreateGalleryModal = ({ onClose, setToast }: { onClose: () => void, setToast: (t: any) => void }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        uploadStart: '',
        uploadEnd: '',
        votingStart: '',
        votingEnd: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const code = generateGalleryCode();

            await addDoc(collection(db, 'galleries'), {
                ...formData,
                code,
                uploadStart: new Date(formData.uploadStart),
                uploadEnd: new Date(formData.uploadEnd),
                votingStart: new Date(formData.votingStart),
                votingEnd: new Date(formData.votingEnd),
                createdAt: serverTimestamp()
            });

            setToast({ message: 'Gallery created successfully!', type: 'success' });
            onClose();
        } catch (err) {
            setError('Failed to create gallery');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card animate-fade-in" style={{
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '0',
                background: '#0f0f13',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Create New Gallery</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                        <Icons.Plus style={{ width: '24px', height: '24px', transform: 'rotate(45deg)' }} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Gallery Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g., Holiday Photo Contest"
                            className="input"
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What's this contest about?"
                            rows={3}
                            className="input"
                            style={{ resize: 'none', minHeight: '80px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Upload Opens</label>
                            <input
                                type="datetime-local"
                                value={formData.uploadStart}
                                onChange={(e) => setFormData({ ...formData, uploadStart: e.target.value })}
                                required
                                className="input"
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Upload Closes</label>
                            <input
                                type="datetime-local"
                                value={formData.uploadEnd}
                                onChange={(e) => setFormData({ ...formData, uploadEnd: e.target.value })}
                                required
                                className="input"
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Voting Opens</label>
                            <input
                                type="datetime-local"
                                value={formData.votingStart}
                                onChange={(e) => setFormData({ ...formData, votingStart: e.target.value })}
                                required
                                className="input"
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Voting Closes</label>
                            <input
                                type="datetime-local"
                                value={formData.votingEnd}
                                onChange={(e) => setFormData({ ...formData, votingEnd: e.target.value })}
                                required
                                className="input"
                                style={{ fontSize: '0.9rem' }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#f87171', fontSize: '0.875rem', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ paddingTop: '0.5rem' }}>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={loading}
                            className="full-width"
                            style={{ padding: '0.75rem', fontSize: '1rem' }}
                        >
                            {loading ? <Spinner size="sm" /> : 'Create Gallery'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
