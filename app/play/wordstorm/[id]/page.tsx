'use client';

import React, { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { submitWord } from '@/lib/wordstorm';

export default function WordStormPlayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [word, setWord] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastWord, setLastWord] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!word.trim()) return;

        setSubmitting(true);
        try {
            await submitWord(id, word);
            setLastWord(word);
            setWord('');
            setShowSuccess(true);

            // Auto-hide success message
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (err) {
            alert('Failed to send word. Please try again.');
        }
        setSubmitting(false);
    };

    return (
        <main style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '500px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', color: '#ffffff' }}>
                    <h1 style={{
                        fontSize: '48px',
                        marginBottom: '8px'
                    }}>
                        ☁️
                    </h1>
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        marginBottom: '8px'
                    }}>
                        Word Storm
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        opacity: 0.9
                    }}>
                        Share what's on your mind
                    </p>
                </div>

                {/* Input Card */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <input
                                type="text"
                                value={word}
                                onChange={(e) => setWord(e.target.value)}
                                placeholder="Type a word..."
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    fontSize: '20px',
                                    border: '2px solid #e0e0e0',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    textAlign: 'center',
                                    fontWeight: '500',
                                    transition: 'border 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                                maxLength={20}
                                autoFocus
                                autoComplete="off"
                            />
                            <div style={{
                                textAlign: 'right',
                                fontSize: '12px',
                                color: '#999',
                                marginTop: '8px'
                            }}>
                                {word.length}/20 characters
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting || !word.trim()}
                            style={{
                                width: '100%',
                                padding: '16px',
                                fontSize: '18px',
                                fontWeight: '600',
                                backgroundColor: submitting || !word.trim() ? '#cccccc' : '#2196F3',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: submitting || !word.trim() ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: submitting || !word.trim() ? 'none' : '0 4px 16px rgba(33, 150, 243, 0.3)'
                            }}
                        >
                            {submitting ? 'Sending...' : 'Send Word ⚡'}
                        </button>
                    </form>
                </div>

                {/* Success Message */}
                {showSuccess && (
                    <div style={{
                        backgroundColor: '#4CAF50',
                        color: '#ffffff',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontWeight: '600',
                        animation: 'slideIn 0.3s ease'
                    }}>
                        ✓ Word sent successfully!
                    </div>
                )}

                {/* Last Word Display */}
                {lastWord && !showSuccess && (
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        padding: '20px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        color: '#ffffff'
                    }}>
                        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>
                            You sent:
                        </div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            {lastWord}
                        </div>
                    </div>
                )}

                {/* Instructions */}
                <div style={{
                    textAlign: 'center',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '14px',
                    lineHeight: '1.6'
                }}>
                    <p>Enter any word or phrase that comes to mind.</p>
                    <p>Words will appear on the host screen in real-time!</p>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </main>
    );
}
