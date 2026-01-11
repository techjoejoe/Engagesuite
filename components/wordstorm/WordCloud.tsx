'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface WordCloudProps {
    words: { text: string; count: number }[];
    width?: number;
    height?: number;
}

interface PlacedWord {
    text: string;
    count: number;
    size: number;
    x: number;
    y: number;
    color: string;
}

export default function WordCloud({ words, width = 900, height = 550 }: WordCloudProps) {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
    ];

    const placedWords = useMemo(() => {
        if (!words.length) return [];

        // Limit to 65 words max for denser cloud
        const limitedWords = words.slice(0, 65);

        // Get count range
        const maxCount = Math.max(...limitedWords.map(w => w.count));
        const minCount = Math.min(...limitedWords.map(w => w.count));
        const countRange = maxCount - minCount || 1;

        // Calculate sizes - scale from 16px to 110px based on count
        const wordsWithSize = limitedWords.map((w, i) => {
            const normalizedCount = (w.count - minCount) / countRange;
            // Use power curve for more dramatic size differences
            const size = 16 + Math.pow(normalizedCount, 0.5) * 94;
            return {
                text: w.text,
                count: w.count,
                size: Math.round(size),
                color: colors[i % colors.length]
            };
        });

        // Sort by size descending (place big words first)
        wordsWithSize.sort((a, b) => b.size - a.size);

        // Simple grid-based placement that fills the space
        const placed: PlacedWord[] = [];
        const occupiedRects: { x: number; y: number; w: number; h: number }[] = [];

        const padding = 5; // Tighter space between words
        const margin = 20; // Reduced margin from edges

        // Helper to check if a rect overlaps with any existing rect
        const overlaps = (x: number, y: number, w: number, h: number): boolean => {
            for (const rect of occupiedRects) {
                if (!(x + w + padding < rect.x ||
                    x > rect.x + rect.w + padding ||
                    y + h + padding < rect.y ||
                    y > rect.y + rect.h + padding)) {
                    return true;
                }
            }
            return false;
        };

        // Try to place each word
        for (const word of wordsWithSize) {
            // Estimate word dimensions (rough approximation)
            const wordWidth = word.text.length * word.size * 0.6;
            const wordHeight = word.size * 1.2;

            let placed_word = false;

            // Try spiral placement from center outward
            const centerX = width / 2;
            const centerY = height / 2;

            // Smaller step (10) and angle (0.2) for tighter packing attempts
            for (let radius = 0; radius < Math.max(width, height) && !placed_word; radius += 10) {
                for (let angle = 0; angle < Math.PI * 2 && !placed_word; angle += 0.2) {
                    const x = centerX + Math.cos(angle) * radius - wordWidth / 2;
                    const y = centerY + Math.sin(angle) * radius - wordHeight / 2;

                    // Check bounds
                    if (x < margin || x + wordWidth > width - margin ||
                        y < margin || y + wordHeight > height - margin) {
                        continue;
                    }

                    // Check overlap
                    if (!overlaps(x, y, wordWidth, wordHeight)) {
                        placed.push({
                            ...word,
                            x: x + wordWidth / 2, // Center point
                            y: y + wordHeight / 2
                        });
                        occupiedRects.push({ x, y, w: wordWidth, h: wordHeight });
                        placed_word = true;
                    }
                }
            }
        }

        return placed;
    }, [words, width, height]);

    if (!words.length) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
                No words yet...
            </div>
        );
    }

    return (
        <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%', minHeight: '500px' }}
        >
            {placedWords.map((w, i) => (
                <text
                    key={`${w.text}-${i}`}
                    x={w.x}
                    y={w.y}
                    className="cursor-pointer select-none transition-all duration-300"
                    style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: `${w.size}px`,
                        fill: w.color,
                        fontWeight: '800',
                        textAnchor: 'middle',
                        dominantBaseline: 'middle',
                        opacity: 0,
                        transformBox: 'fill-box', // Needed for proper scale transform
                        transformOrigin: 'center', // Scale from center of word
                        animation: `wordFadeIn 0.5s ${i * 0.02}s forwards`,
                        textShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.2)';
                        e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.6))';
                        e.currentTarget.style.zIndex = '100';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'none';
                        e.currentTarget.style.zIndex = 'auto';
                    }}
                >
                    {w.text}
                    <title>{w.count} submissions</title>
                </text>
            ))}
            <style>{`
                @keyframes wordFadeIn {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </svg>
    );
}
