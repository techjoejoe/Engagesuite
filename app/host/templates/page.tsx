'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { getGameTemplates, deleteGameTemplate } from '@/lib/templates';
import { onAuthStateChange } from '@/lib/auth';
import { GameTemplate } from '@/lib/templates';

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<GameTemplate[]>([]);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (!user) {
                router.push('/login');
            } else {
                setCheckingAuth(false);
                loadTemplates();
            }
        });
        return () => unsubscribe();
    }, [router]);

    const loadTemplates = () => {
        const saved = getGameTemplates();
        // Sort by most recently created
        saved.sort((a, b) => b.createdAt - a.createdAt);
        setTemplates(saved);
    };

    const handleDelete = (id: string, title: string) => {
        if (confirm(`Are you sure you want to delete "${title}"?`)) {
            deleteGameTemplate(id);
            loadTemplates();
        }
    };

    const handleLoadTemplate = (template: GameTemplate) => {
        // Store template data in sessionStorage to be loaded by create page
        sessionStorage.setItem('loadedTemplate', JSON.stringify(template));
        router.push('/host/create');
    };

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '4rem' }}>
                <div className="animate-fade-in">
                    <div className="flex-between mb-4">
                        <h1 className="text-gradient">My Templates</h1>
                        <Button variant="glass" onClick={() => router.push('/host/create')}>
                            ← Back
                        </Button>
                    </div>

                    {templates.length === 0 ? (
                        <Card style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                            <h2 className="mb-3">No Templates Yet</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                Create a trivia game and save it as a template to reuse questions later.
                            </p>
                            <Button variant="primary" size="lg" onClick={() => router.push('/host/create')}>
                                Create First Template
                            </Button>
                        </Card>
                    ) : (
                        <div className="flex-col gap-3">
                            {templates.map((template) => (
                                <Card key={template.id} className="glass-hover">
                                    <div className="flex-between mb-3">
                                        <div>
                                            <h3 style={{ marginBottom: '0.5rem' }}>
                                                {template.title}
                                            </h3>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                {template.questions.length} questions • Created {new Date(template.createdAt).toLocaleDateString()}
                                                {template.lastUsed && (
                                                    <> • Last used {new Date(template.lastUsed).toLocaleDateString()}</>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Preview Questions */}
                                    <div style={{
                                        marginBottom: '1rem',
                                        padding: '1rem',
                                        background: 'var(--bg-secondary)',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                    }}>
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                                            Questions Preview:
                                        </div>
                                        {template.questions.slice(0, 3).map((q, i) => (
                                            <div key={i} style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                {i + 1}. {q.question}
                                            </div>
                                        ))}
                                        {template.questions.length > 3 && (
                                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                ...and {template.questions.length - 3} more
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-between gap-2">
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleLoadTemplate(template)}
                                        >
                                            Load Template
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(template.id, template.title)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
