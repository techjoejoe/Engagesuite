'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    hover?: boolean;
    style?: React.CSSProperties;
}

export default function Card({ children, className = '', hover = true, style, ...props }: CardProps) {
    return (
        <div
            className={`glass-card ${hover ? 'glass-card-hover' : ''} p-6 ${className}`.trim()}
            style={style}
            {...props}
        >
            {children}
        </div>
    );
}
