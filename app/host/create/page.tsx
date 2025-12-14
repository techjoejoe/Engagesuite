'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { createGame } from '@/lib/game';
import { saveGameTemplate, markTemplateAsUsed } from '@/lib/templates';
import { onAuthStateChange } from '@/lib/auth';
import { Question } from '@/types';

export default function CreateTrivia() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        timeLimit: 30,
        points: 1000,
    });
    const [loading, setLoading] = useState(false);
    const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Check authentication
    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (!user) {
                router.push('/login');
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [router]);

    // Check for loaded template from sessionStorage
    useEffect(() => {
        const loadedTemplate = sessionStorage.getItem('loadedTemplate');
        if (loadedTemplate) {
            try {
                const template = JSON.parse(loadedTemplate);
                setTitle(template.title);
                setQuestions(template.questions);
                setLoadedTemplateId(template.id);
                sessionStorage.removeItem('loadedTemplate');
            } catch (err) {
                console.error('Error loading template:', err);
            }
        }
    }, []);

    if (checkingAuth) {
        return (
            <div className="full-height flex-center" style={{
                background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            }}>
                <div className="animate-pulse">Checking authentication...</div>
            </div>
        );
    }

    const addQuestion = () => {
        if (!currentQuestion.question.trim()) {
            alert('Please enter a question');
            return;
        }

        if (currentQuestion.options.filter(o => o.trim()).length < 2) {
            alert('Please add at least 2 options');
            return;
        }

        const newQuestion: Question = {
            id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            question: currentQuestion.question,
            type: 'multiple-choice',
            options: currentQuestion.options.filter(o => o.trim()),
            correctAnswer: currentQuestion.correctAnswer,
            timeLimit: currentQuestion.timeLimit,
            points: currentQuestion.points,
        };

        setQuestions([...questions, newQuestion]);
        setCurrentQuestion({
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            timeLimit: 30,
            points: 1000,
        });
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const saveTemplateHandler = () => {
        if (!title.trim()) {
            alert('Please enter a game title');
            return;
        }

        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        try {
            saveGameTemplate(title, questions);
            alert(`Template "${title}" saved successfully!`);
        } catch (err) {
            console.error('Error saving template:', err);
            alert('Failed to save template. Please try again.');
        }
    };

    const createGameHandler = async () => {
        if (!title.trim()) {
            alert('Please enter a game title');
            return;
        }

        if (questions.length === 0) {
            alert('Please add at least one question');
            return;
        }

        setLoading(true);

        try {
            const hostId = `host_${Date.now()}`;
            const roomCode = await createGame(hostId, title, 'trivia', questions);

            // Mark template as used if this was loaded from a template
            if (loadedTemplateId) {
                markTemplateAsUsed(loadedTemplateId);
            }

            // Store host info
            localStorage.setItem('hostId', hostId);

            // Navigate to control panel
            router.push(`/host/control?room=${roomCode}`);
        } catch (err) {
            console.error('Error creating game:', err);
            alert('Failed to create game. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="full-height" style={{
            background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
            padding: '2rem',
            overflowY: 'auto',
        }}>
            <div className="container" style={{ maxWidth: '900px', paddingBottom: '4rem' }}>
                <div className="animate-fade-in">
                    <h1 className="text-gradient text-center mb-4">Create Trivia Game</h1>

                    {/* Game Title */}
                    <Card className="mb-4">
                        <label style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                        }}>
                            Game Title
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Friday Night Trivia"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </Card>

                    {/* Add Question Form */}
                    <Card className="mb-4">
                        <h3 className="mb-3">Add Question</h3>

                        <div className="flex-col gap-3">
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                }}>
                                    Question
                                </label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="What is the capital of France?"
                                    value={currentQuestion.question}
                                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                                />
                            </div>

                            {/* Options */}
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '500',
                                }}>
                                    Answer Options
                                </label>
                                {currentQuestion.options.map((option, index) => (
                                    <div key={index} className="flex-between gap-2 mb-2">
                                        <input
                                            type="text"
                                            className="input"
                                            placeholder={`Option ${index + 1}`}
                                            value={option}
                                            onChange={(e) => {
                                                const newOptions = [...currentQuestion.options];
                                                newOptions[index] = e.target.value;
                                                setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                            }}
                                            style={{ flex: 1 }}
                                        />
                                        <label className="flex-center gap-2" style={{ cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                name="correctAnswer"
                                                checked={currentQuestion.correctAnswer === index}
                                                onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: index })}
                                            />
                                            <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>Correct</span>
                                        </label>
                                    </div>
                                ))}
                            </div>

                            {/* Time and Points */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                    }}>
                                        Time Limit (seconds)
                                    </label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={currentQuestion.timeLimit}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimit: parseInt(e.target.value) })}
                                        min={5}
                                        max={120}
                                    />
                                </div>

                                <div>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '0.5rem',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                    }}>
                                        Max Points
                                    </label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={currentQuestion.points}
                                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
                                        min={100}
                                        max={5000}
                                        step={100}
                                    />
                                </div>
                            </div>

                            <Button variant="secondary" size="lg" className="full-width" onClick={addQuestion}>
                                + Add Question
                            </Button>
                        </div>
                    </Card>

                    {/* Questions List */}
                    {questions.length > 0 && (
                        <Card className="mb-4">
                            <h3 className="mb-3">Questions ({questions.length})</h3>
                            <div className="flex-col gap-2">
                                {questions.map((q, index) => (
                                    <div
                                        key={q.id}
                                        style={{
                                            padding: '1rem',
                                            background: 'var(--bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)',
                                        }}
                                    >
                                        <div className="flex-between">
                                            <div>
                                                <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                                                    {index + 1}. {q.question}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                                    {q.timeLimit}s • {q.points} points • {q.options.length} options
                                                </div>
                                            </div>
                                            <Button variant="danger" size="sm" onClick={() => removeQuestion(index)}>
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <div className="flex-col gap-3">
                        <div className="flex-between gap-3">
                            <Button variant="glass" size="lg" onClick={() => router.push('/host/templates')}>
                                📚 My Templates
                            </Button>
                            <Button
                                variant="secondary"
                                size="lg"
                                onClick={saveTemplateHandler}
                                disabled={questions.length === 0}
                            >
                                💾 Save Template
                            </Button>
                        </div>
                        <div className="flex-between gap-3">
                            <Button variant="glass" size="lg" onClick={() => router.push('/')}>
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={createGameHandler}
                                disabled={loading || questions.length === 0}
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Creating...' : `Create Game (${questions.length} questions)`}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
