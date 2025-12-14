'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
    value: string;
    size?: number;
}

export default function QRCode({ value, size = 200 }: QRCodeProps) {
    return (
        <div style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: 'var(--radius-md)',
            display: 'inline-block',
            boxShadow: 'var(--shadow-lg)',
        }}>
            <QRCodeSVG
                value={value}
                size={size}
                level="H"
                includeMargin={true}
            />
        </div>
    );
}
