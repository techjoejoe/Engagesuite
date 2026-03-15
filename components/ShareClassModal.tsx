'use client';

import { useState } from 'react';
import QRCode from './QRCode';

interface ShareClassModalProps {
  classCode: string;
  className: string;
  onClose: () => void;
}

export default function ShareClassModal({ classCode, className, onClose }: ShareClassModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const joinUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${classCode}`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md p-8 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Share Class Code</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors text-2xl leading-none">&times;</button>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Share this code with students so they can join <span className="text-white font-semibold">{className}</span>.
        </p>

        {/* Big Code Display */}
        <div className="bg-black/30 rounded-xl p-6 text-center mb-6 border border-white/5">
          <div className="text-xs font-semibold text-white/40 mb-2 uppercase tracking-wider">Class Code</div>
          <div className="text-4xl font-black tracking-[0.3em] text-indigo-400 mb-3">{classCode}</div>
          <button
            onClick={() => copyToClipboard(classCode, 'code')}
            className="px-4 py-2 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-indigo-300 text-sm font-medium hover:bg-indigo-500/30 transition-all"
          >
            {copied === 'code' ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <QRCode value={joinUrl} size={180} />
        </div>
        <p className="text-center text-white/40 text-xs mb-6">Students can scan this QR code to join</p>

        {/* Copy Link */}
        <div className="bg-black/20 rounded-lg p-3 flex items-center gap-3 border border-white/5">
          <input
            type="text"
            value={joinUrl}
            readOnly
            className="flex-1 bg-transparent text-white/70 text-sm outline-none truncate"
          />
          <button
            onClick={() => copyToClipboard(joinUrl, 'link')}
            className="px-3 py-1.5 bg-white/10 rounded-lg text-white text-xs font-medium hover:bg-white/20 transition-all whitespace-nowrap"
          >
            {copied === 'link' ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 font-medium hover:bg-white/10 transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
