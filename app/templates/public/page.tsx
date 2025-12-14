'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { getPublicTemplates, searchPublicTemplates } from '@/lib/cloudTemplates';
import { CloudTemplate } from '@/lib/cloudTemplates';

export default function PublicTemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<CloudTemplate[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        const data = await getPublicTemplates(50);
        setTemplates(data);
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            loadTemplates();
            return;
        }

        setLoading(true);
        const results = await searchPublicTemplates(searchTerm);
        setTemplates(results);
        setLoading(false);
    };

    const handleLoadTemplate = (template: CloudTemplate) => {
        sessionStorage.setItem('loadedTemplate', JSON.stringify({
            id: template.id,
            title: template.title,
            questions: template.questions,
        }));
        router.push('/host/create');
    };

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '1000px', paddingBottom: '4rem' }}>
                <div className="animate-fade-in">
                    <div className="flex-between mb-4">
                        <h1 className="text-gradient">📚 Template Marketplace</h1>
                        <Button variant="glass" onClick={() => router.push('/')}>
                            Home
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <Card className="mb-4" style={{ padding: '1.5rem' }}>
                        <div className="flex-between gap-3">
                            <input
                                type="text"
                                className="input"
                                placeholder="Search templates by title, description, or tags..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                style={{ flex: 1 }}
                            />
                            <Button variant="primary" onClick={handleSearch}>
                                Search
                            </Button>
                        </div>
                    </Card>

                    {loading ? (
                        <div className="flex-center" style={{ padding: '4rem' }}>
                            <div className="animate-pulse">Loading templates...</div>
                        </div>
                    ) : templates.length === 0 ? (
                        <Card style={{ padding: '3rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                            <h2 className="mb-3">No Public Templates</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                                {searchTerm
                                    ? 'No templates found matching your search.'
                                    : 'Be the first to share a template publicly!'}
                            </p>
                            <div className="flex-center gap-2">
                                <Button variant="primary" onClick={() => router.push('/host/create')}>
                                    Create Template
                                </Button>
                                {searchTerm && (
                                    <Button variant="glass" onClick={() => { setSearchTerm(''); loadTemplates(); }}>
                                        Clear Search
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ) : (
                        <>
                            <div style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                {templates.length} template{templates.length !== 1 ? 's' : ''} found
                            </div>

                            <div className="flex-col gap-3">
                                {templates.map((template) => (
                                    <Card key={template.id} className="glass-hover">
                                        <div className="flex-between mb-3">
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ marginBottom: '0.5rem' }}>
                                                    {template.title}
                                                </h3>
                                                {template.description && (
                                                    <p style={{
                                                        color: 'var(--text-secondary)',
                                                        fontSize: '0.875rem',
                                                        marginBottom: '0.5rem',
                                                    }}>
                                                        {template.description}
                                                    </p>
                                                )}
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {template.questions.length} questions •
                                                    By {template.createdByName} •
                                                    Used {template.timesUsed} times
                                                    {template.category && ` • ${template.category}`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        {template.tags && template.tags.length > 0 && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                {template.tags.map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        style={{
                                                            padding: '0.25rem 0.75rem',
                                                            background: 'rgba(99, 102, 241, 0.2)',
                                                            borderRadius: 'var(--radius-full)',
                                                            fontSize: '0.75rem',
                                                            color: 'var(--color-primary)',
                                                        }}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Preview Questions */}
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.875rem',
                                            marginBottom: '1rem',
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

                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleLoadTemplate(template)}
                                            className="full-width"
                                        >
                                            Load & Create Game
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
