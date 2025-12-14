'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface Word {
    text: string;
    size: number;
}

interface WordCloudProps {
    words: { text: string; count: number }[];
    width?: number;
    height?: number;
}

export default function WordCloud({ words, width = 800, height = 600 }: WordCloudProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [cloudWords, setCloudWords] = useState<any[]>([]);

    useEffect(() => {
        if (!words.length) return;

        // Normalize sizes
        const maxCount = Math.max(...words.map(w => w.count));
        const minCount = Math.min(...words.map(w => w.count));

        // Scale function: Linear scale for font size
        // Adjust range based on screen size if needed, but 20-100 is a good start
        const sizeScale = d3.scaleLinear()
            .domain([minCount, maxCount])
            .range([30, 120]);

        // Color scale: Vibrant Rainbow
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
            '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
        ];
        const colorScale = d3.scaleOrdinal(colors);

        const layout = cloud()
            .size([width, height])
            .words(words.map(d => ({ text: d.text, size: sizeScale(d.count), count: d.count })))
            .padding(15) // Increased padding
            .rotate(() => (~~(Math.random() * 2) * 90))
            .font("Inter")
            .fontSize((d: any) => d.size)
            .on("end", (computedWords: any) => {
                setCloudWords(computedWords);
            });

        layout.start();

    }, [words, width, height]);

    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
    ];
    const getColor = (i: number) => colors[i % colors.length];

    return (
        <svg
            ref={svgRef}
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ maxWidth: '100%', height: 'auto', overflow: 'visible' }}
        >
            <g transform={`translate(${width / 2},${height / 2})`}>
                {cloudWords.map((w, i) => (
                    <text
                        key={`${w.text}-${i}`}
                        className="cursor-pointer select-none"
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: `${w.size}px`,
                            fill: getColor(i),
                            fontWeight: '900',
                            textAnchor: 'middle',
                            transform: `translate(${w.x}px, ${w.y}px) rotate(${w.rotate}deg)`,
                            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            opacity: 0,
                            animation: 'fadeIn 0.6s forwards',
                            textShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = `translate(${w.x}px, ${w.y}px) rotate(${w.rotate}deg) scale(1.15)`;
                            e.currentTarget.style.filter = 'drop-shadow(0 0 10px rgba(255,255,255,0.5))';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = `translate(${w.x}px, ${w.y}px) rotate(${w.rotate}deg) scale(1)`;
                            e.currentTarget.style.filter = 'none';
                        }}
                    >
                        {w.text}
                        <title>{w.count} submissions</title>
                    </text>
                ))}
            </g>
            <style jsx>{`
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
            `}</style>
        </svg>
    );
}
