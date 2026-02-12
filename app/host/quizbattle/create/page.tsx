'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createQuiz, getQuiz, updateQuiz, Question, Answer } from '@/lib/quizbattle';
import { onAuthStateChange } from '@/lib/auth';
import Button from '@/components/Button';
import HostMenu from '@/components/HostMenu';
import * as XLSX from 'xlsx';

function CreateQuizContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const quizId = searchParams.get('quizId');
    const classIdParam = searchParams.get('classId');

    const [title, setTitle] = useState('Untitled Quiz');
    const [description, setDescription] = useState('');
    const [questions, setQuestions] = useState<Question[]>([
        {
            id: '1',
            text: '',
            type: 'multiple-choice',
            timeLimit: 20,
            points: 1000,
            answers: [
                { id: '1', text: '' },
                { id: '2', text: '' },
                { id: '3', text: '' },
                { id: '4', text: '' }
            ],
            correctAnswerIndex: 0
        }
    ]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [showGiphySearch, setShowGiphySearch] = useState(false);
    const [giphyQuery, setGiphyQuery] = useState('');
    const [giphyResults, setGiphyResults] = useState<any[]>([]);
    const [giphyLoading, setGiphyLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [loadingQuiz, setLoadingQuiz] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const excelInputRef = useRef<HTMLInputElement>(null);

    const currentQuestion = questions[activeQuestionIndex];

    const updateCurrentQuestion = (updates: Partial<Question>) => {
        const updated = [...questions];
        updated[activeQuestionIndex] = { ...currentQuestion, ...updates };
        setQuestions(updated);
    };

    const updateAnswer = (answerIndex: number, text: string) => {
        const newAnswers = [...currentQuestion.answers];
        newAnswers[answerIndex] = { ...newAnswers[answerIndex], text };
        updateCurrentQuestion({ answers: newAnswers });
    };

    const setCorrectAnswer = (index: number) => {
        updateCurrentQuestion({ correctAnswerIndex: index });
    };

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            text: '',
            type: 'multiple-choice',
            timeLimit: 20,
            points: 1000,
            answers: [
                { id: '0', text: '' },
                { id: '1', text: '' },
                { id: '2', text: '' },
                { id: '3', text: '' }
            ],
            correctAnswerIndex: 0
        };
        setQuestions([...questions, newQuestion]);
        setActiveQuestionIndex(questions.length);
    };

    const deleteQuestion = (index: number) => {
        if (questions.length === 1) {
            alert('You must have at least one question');
            return;
        }
        const updated = questions.filter((_, i) => i !== index);
        setQuestions(updated);
        if (activeQuestionIndex >= updated.length) {
            setActiveQuestionIndex(updated.length - 1);
        }
    };

    // Image Upload - Convert to base64 to avoid Firebase Storage issues
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5000000) { // 5MB limit
            alert('Image must be less than 5MB');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateCurrentQuestion({ mediaUrl: base64String });
                setUploading(false);
            };
            reader.onerror = () => {
                alert('Failed to read image');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Failed to upload image');
            setUploading(false);
        }
    };

    // Giphy Search
    const searchGiphy = async () => {
        if (!giphyQuery.trim()) return;

        setGiphyLoading(true);
        try {
            // Use production Giphy API key
            const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'pLVE9ntIGo2YOOOQBjaj8AmvJ7p6aEQM';
            console.log(`Searching Giphy for: "${giphyQuery}"`);

            const response = await fetch(
                `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(giphyQuery)}&limit=12&rating=g`
            );

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Giphy API Error:', errorData);

                // Show user-friendly error message
                if (response.status === 401) {
                    throw new Error('Giphy API key is invalid. Please update your API key.');
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please try again in a moment.');
                } else {
                    throw new Error(errorData.meta?.msg || `API Error: ${response.status}`);
                }
            }

            const data = await response.json();
            console.log('Giphy Results:', data.data?.length);
            setGiphyResults(data.data || []);

            if (data.data?.length === 0) {
                alert('No GIFs found for your search. Try different keywords!');
            }
        } catch (error: any) {
            console.error('Error searching Giphy:', error);
            alert(`Failed to search Giphy: ${error.message}`);
            setGiphyResults([]);
        } finally {
            setGiphyLoading(false);
        }
    };

    const selectGif = (gifUrl: string) => {
        updateCurrentQuestion({ mediaUrl: gifUrl });
        setShowGiphySearch(false);
        setGiphyQuery('');
        setGiphyResults([]);
    };

    // Excel Import
    const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                console.log('Imported Excel data:', jsonData);

                const importedQuestions: Question[] = jsonData.map((row: any, index) => {
                    // Find correct answer index
                    const correctAnswerLetter = row['Correct Answer']?.toString().trim().toUpperCase();
                    let correctIndex = 0;
                    if (correctAnswerLetter === 'A') correctIndex = 0;
                    else if (correctAnswerLetter === 'B') correctIndex = 1;
                    else if (correctAnswerLetter === 'C') correctIndex = 2;
                    else if (correctAnswerLetter === 'D') correctIndex = 3;

                    const question = {
                        id: (Date.now() + index).toString(),
                        text: row['Question']?.toString() || '',
                        type: 'multiple-choice' as const,
                        timeLimit: parseInt(row['Time (seconds)']?.toString() || '20') || 20,
                        points: parseInt(row['Points']?.toString() || '1000') || 1000,
                        answers: [
                            { id: '0', text: row['Answer A']?.toString() || '' },
                            { id: '1', text: row['Answer B']?.toString() || '' },
                            { id: '2', text: row['Answer C']?.toString() || '' },
                            { id: '3', text: row['Answer D']?.toString() || '' }
                        ],
                        correctAnswerIndex: correctIndex
                    };

                    console.log('Imported question:', question);
                    return question;
                });

                setQuestions(importedQuestions);
                setActiveQuestionIndex(0);
                alert(`Successfully imported ${importedQuestions.length} questions!`);
            } catch (error) {
                console.error('Error importing Excel:', error);
                alert('Failed to import Excel file. Make sure it has the correct format.');
            }
        };
        reader.readAsBinaryString(file);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            if (user) {
                setUserId(user.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    // Load quiz data if editing
    useEffect(() => {
        const loadQuizData = async () => {
            if (!quizId) return;

            setLoadingQuiz(true);
            try {
                const quiz = await getQuiz(quizId);
                if (quiz) {
                    setTitle(quiz.title);
                    setDescription(quiz.description);
                    setQuestions(quiz.questions);
                    // Ensure active question index is valid
                    if (quiz.questions.length > 0) {
                        setActiveQuestionIndex(0);
                    }
                } else {
                    alert('Quiz not found');
                    router.push('/host/quizbattle');
                }
            } catch (error) {
                console.error('Error loading quiz:', error);
                alert('Failed to load quiz');
            } finally {
                setLoadingQuiz(false);
            }
        };

        loadQuizData();
    }, [quizId, router]);

    // Save Quiz
    const handleSaveQuiz = async () => {
        if (!title || questions.some(q => !q.text || q.answers.some(a => !a.text))) {
            alert('Please fill in all questions and answers');
            return;
        }

        if (!userId) {
            alert('You must be logged in to save a quiz');
            return;
        }

        setUploading(true);
        try {
            const classId = classIdParam || 'default';

            if (quizId) {
                // Update existing quiz
                await updateQuiz(quizId, {
                    title,
                    description,
                    questions,
                    settings: {
                        timePerQuestion: 20,
                        showAnswersImmediately: true,
                        pointsPerQuestion: 1000
                    }
                });
            } else {
                // Create new quiz
                await createQuiz({
                    title,
                    description,
                    classId,
                    createdBy: userId,
                    questions,
                    settings: {
                        timePerQuestion: 20,
                        showAnswersImmediately: true,
                        pointsPerQuestion: 1000
                    }
                });
            }

            router.push(`/host/quizbattle?classId=${classId}`);
        } catch (error: any) {
            console.error('Error saving quiz:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert(`Failed to save quiz: ${error.message || 'Unknown error'}`);
            setUploading(false);
        }
    };

    const answerStyles = [
        { bg: '#FF8C42', label: 'A' },
        { bg: '#E44446', label: 'B' },
        { bg: '#374151', label: 'C' },
        { bg: '#4CAF50', label: 'D' }
    ];

    return (
        <main className="min-h-screen bg-transparent transition-colors duration-300">
            <HostMenu currentPage="QuizBattle" classId={classIdParam || undefined} />
            {/* Top Navigation */}
            <div style={{ backgroundColor: '#4A90E2', padding: '12px 24px', borderBottom: '1px solid #3a7bc8', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={() => {
                        const classId = new URLSearchParams(window.location.search).get('classId') || 'default';
                        router.push(`/host/quizbattle?classId=${classId}`);
                    }}
                    style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                    }}
                    title="Back to My Games"
                >
                    <span style={{ fontSize: '18px' }}>←</span>
                    My Games
                </button>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Quiz Title"
                    style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        borderRadius: '8px',
                        outline: 'none',
                        padding: '8px 16px',
                        flex: 1,
                        maxWidth: '600px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
                {/* Excel Import Button */}
                <div style={{ marginBottom: '16px' }}>
                    <input
                        ref={excelInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelImport}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => excelInputRef.current?.click()}
                        style={{
                            backgroundColor: '#4CAF50',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '12px 24px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        📊 Import from Excel
                    </button>
                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#666' }}>
                        Upload .xlsx with columns: Question, Answer A, Answer B, Answer C, Answer D, Correct Answer, Time (seconds), Points
                    </span>
                </div>

                {/* Question Tabs - Above Question Input */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '8px 8px 0 0', padding: '12px 16px', marginBottom: '0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                        {questions.map((q, index) => (
                            <button
                                key={q.id}
                                onClick={() => setActiveQuestionIndex(index)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    backgroundColor: activeQuestionIndex === index ? '#4A90E2' : '#f5f5f5',
                                    color: activeQuestionIndex === index ? '#ffffff' : '#666'
                                }}
                            >
                                Q{index + 1}
                            </button>
                        ))}
                        <button
                            onClick={addQuestion}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '6px',
                                backgroundColor: '#4CAF50',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold'
                            }}
                        >
                            + Add Question
                        </button>
                    </div>
                </div>

                {/* Question Header */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: '0 0 8px 8px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{
                            backgroundColor: '#f0f0f0',
                            borderRadius: '50%',
                            width: '64px',
                            height: '64px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#555' }}>Q{activeQuestionIndex + 1}</span>
                        </div>
                        <input
                            type="text"
                            value={currentQuestion.text}
                            onChange={(e) => updateCurrentQuestion({ text: e.target.value })}
                            placeholder="Type your question here..."
                            style={{
                                flex: 1,
                                fontSize: '24px',
                                border: 'none',
                                outline: 'none',
                                color: '#333',
                                backgroundColor: 'transparent'
                            }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                padding: '8px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1976D2'
                            }}>
                                Multiple-Choice
                            </span>
                            {questions.length > 1 && (
                                <button
                                    onClick={() => deleteQuestion(activeQuestionIndex)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#E44446',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        padding: '4px'
                                    }}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                    {/* Left Column - Settings & Answers */}
                    <div>
                        {/* Settings */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Question Settings</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Time Limit (seconds)</label>
                                    <input
                                        type="number"
                                        value={currentQuestion.timeLimit}
                                        onChange={(e) => updateCurrentQuestion({ timeLimit: parseInt(e.target.value) || 20 })}
                                        style={{
                                            width: '100%',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '10px 12px',
                                            fontSize: '16px',
                                            color: '#333',
                                            backgroundColor: '#fff',
                                            outline: 'none'
                                        }}
                                        min="5"
                                        max="120"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Points</label>
                                    <input
                                        type="number"
                                        value={currentQuestion.points}
                                        onChange={(e) => updateCurrentQuestion({ points: parseInt(e.target.value) || 1000 })}
                                        style={{
                                            width: '100%',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '10px 12px',
                                            fontSize: '16px',
                                            color: '#333',
                                            backgroundColor: '#fff',
                                            outline: 'none'
                                        }}
                                        min="100"
                                        max="2000"
                                        step="100"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Multiple-Choice Answers */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Multiple-Choice Answers</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {currentQuestion.answers.map((answer, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: answerStyles[index].bg,
                                            borderRadius: '8px',
                                            padding: '16px',
                                            color: '#ffffff',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>{answerStyles[index].label}.</span>
                                            <input
                                                type="text"
                                                value={answer.text}
                                                onChange={(e) => updateAnswer(index, e.target.value)}
                                                placeholder={`Answer ${answerStyles[index].label}`}
                                                style={{
                                                    flex: 1,
                                                    backgroundColor: 'rgba(255,255,255,0.25)',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '10px 12px',
                                                    color: '#ffffff',
                                                    outline: 'none',
                                                    fontSize: '16px'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>0%</div>
                                                <div style={{ fontSize: '14px' }}>0 votes</div>
                                            </div>
                                            <button
                                                onClick={() => setCorrectAnswer(index)}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '20px',
                                                    backgroundColor: currentQuestion.correctAnswerIndex === index ? '#ffffff' : 'rgba(255,255,255,0.25)',
                                                    color: currentQuestion.correctAnswerIndex === index ? '#4CAF50' : '#ffffff'
                                                }}
                                            >
                                                {currentQuestion.correctAnswerIndex === index ? '✓' : '○'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Media & Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Current Media Preview */}
                        {currentQuestion.mediaUrl && (
                            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <div style={{ position: 'relative' }}>
                                    <img
                                        src={currentQuestion.mediaUrl}
                                        alt="Question media"
                                        style={{ width: '100%', borderRadius: '8px' }}
                                    />
                                    <button
                                        onClick={() => updateCurrentQuestion({ mediaUrl: undefined })}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            cursor: 'pointer',
                                            fontSize: '18px'
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Question Media */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Question Media</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                                <button
                                    onClick={() => setShowGiphySearch(true)}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: '#f5f5f5',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px'
                                    }}
                                >
                                    <span style={{ fontSize: '24px', marginBottom: '4px', color: '#333' }}>GIF</span>
                                    <span style={{ fontSize: '11px', color: '#666' }}>Search Giphy</span>
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        aspectRatio: '1',
                                        backgroundColor: '#f5f5f5',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '12px'
                                    }}
                                >
                                    <span style={{ fontSize: '24px', marginBottom: '4px' }}>🖼️</span>
                                    <span style={{ fontSize: '11px', color: '#666' }}>Upload Image</span>
                                </button>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                style={{ display: 'none' }}
                            />

                            {uploading && (
                                <div style={{ textAlign: 'center', padding: '16px', color: '#666' }}>
                                    Uploading...
                                </div>
                            )}
                        </div>

                        {/* Question Notes */}
                        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>Question Notes</h3>
                            <textarea
                                value={currentQuestion.notes || ''}
                                onChange={(e) => updateCurrentQuestion({ notes: e.target.value })}
                                placeholder="Add notes for this question..."
                                className="text-black placeholder-gray-500"
                                style={{
                                    width: '100%',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    padding: '12px',
                                    fontSize: '14px',
                                    outline: 'none',
                                    minHeight: '120px',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    color: '#000000',
                                    backgroundColor: '#ffffff'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div style={{
                    marginTop: '32px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => router.back()}
                        style={{
                            padding: '12px 24px',
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: '#f5f5f5',
                            color: '#666',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSaveQuiz}
                        disabled={!userId || uploading}
                        style={{
                            padding: '12px 32px',
                            fontSize: '16px',
                            fontWeight: '600',
                            backgroundColor: (!userId || uploading) ? 'rgba(255,255,255,0.1)' : '#4CAF50',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: (!userId || uploading) ? 'not-allowed' : 'pointer',
                            boxShadow: (!userId || uploading) ? 'none' : '0 2px 8px rgba(76, 175, 80, 0.3)'
                        }}
                    >
                        {uploading ? 'Saving...' : 'Save Quiz'}
                    </button>
                </div>
            </div>

            {/* Giphy Search Modal */}
            {showGiphySearch && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '800px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>Search Giphy</h2>
                            <button
                                onClick={() => {
                                    setShowGiphySearch(false);
                                    setGiphyResults([]);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <input
                                type="text"
                                value={giphyQuery}
                                onChange={(e) => setGiphyQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchGiphy()}
                                placeholder="Search for GIFs..."
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '1px solid #ddd',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    color: '#333',
                                    backgroundColor: '#fff',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={searchGiphy}
                                disabled={giphyLoading}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: giphyLoading ? 'rgba(255,255,255,0.1)' : '#4A90E2',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: giphyLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {giphyLoading ? 'Searching...' : 'Search'}
                            </button>
                        </div>

                        {giphyResults.length === 0 && !giphyLoading && giphyQuery && (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                                No GIFs found. Try a different search term.
                            </div>
                        )}

                        {giphyLoading && (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                                Searching Giphy...
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                            {giphyResults.map((gif) => (
                                <div
                                    key={gif.id}
                                    onClick={() => selectGif(gif.images.fixed_height.url)}
                                    style={{
                                        cursor: 'pointer',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        border: '2px solid transparent',
                                        transition: 'border 0.2s'
                                    }}
                                >
                                    <img
                                        src={gif.images.fixed_height.url}
                                        alt={gif.title}
                                        style={{ width: '100%', display: 'block' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

export default function CreateQuizPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', color: '#666' }}>
                Loading...
            </div>
        }>
            <CreateQuizContent />
        </Suspense>
    );
}
