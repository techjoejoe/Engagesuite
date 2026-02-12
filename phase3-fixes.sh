#!/bin/bash
# Phase 3 Dark Theme Fixes - Run on Codespace
cd /workspaces/Engagesuite

echo "=== Phase 3: Dark Theme Deep Fixes ==="

# 1. Fix HamburgerMenu (white menu on Tickr/WordStorm pages)
echo "Fixing HamburgerMenu..."
cat > components/HamburgerMenu.tsx << 'EOF'
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HamburgerMenu({ currentPage = '' }: { currentPage?: string }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const features = [
        { name: 'PicPick', icon: '📸', path: '/picpick/admin', color: 'bg-cyan-500' },
        { name: 'Randomizer', icon: '🎡', path: '/host/randomizer', color: 'bg-orange-500' },
        { name: 'LiveVote', icon: '📊', path: '/host/poll/create', color: 'bg-green-500' },
        { name: 'QuizBattle', icon: '⚡', path: '/host/quizbattle', color: 'bg-red-500' },
        { name: 'Tickr', icon: '⏱️', path: '/host/tickr/launch', color: 'bg-orange-600' },
        { name: 'WordStorm', icon: '☁️', path: '/host/wordstorm/launch', color: 'bg-blue-500' },
    ];

    const handleNavigate = (path: string) => {
        const classId = new URLSearchParams(window.location.search).get('classId') || 'default';
        const fullPath = path.includes('?') ? path : `${path}?classId=${classId}`;
        router.push(fullPath);
        setIsOpen(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-4 right-4 w-12 h-12 bg-slate-800 border-2 border-indigo-500 rounded-full shadow-xl flex flex-col items-center justify-center gap-1 z-[1001] hover:scale-110 transition-all duration-300 focus:outline-none"
            >
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`} />
                <div className={`w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>

            {isOpen && (
                <div
                    onClick={() => setIsOpen(false)}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] animate-fade-in"
                />
            )}

            <div
                className={`fixed top-0 right-0 w-80 h-full bg-slate-900 border-l border-white/10 shadow-2xl z-[1000] transition-transform duration-300 ease-in-out overflow-y-auto p-6 pt-20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <h2 className="text-2xl font-bold text-white mb-6">
                    Quick Navigate
                </h2>

                <div className="flex flex-col gap-4">
                    {features.map((feature) => (
                        <button
                            key={feature.name}
                            onClick={() => handleNavigate(feature.path)}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:bg-white/10 ${currentPage === feature.name ? 'bg-white/10 border-indigo-500' : 'bg-white/5 border-white/10'}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl text-white shrink-0 ${feature.color}`}>
                                {feature.icon}
                            </div>
                            <span className="text-base font-semibold text-white">
                                {feature.name}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 text-center text-white/40 text-sm">
                    Trainer-Toolbox v2.0
                </div>
            </div>
        </>
    );
}
EOF

# 2. Fix HostMenu button (remove dark: prefix)
echo "Fixing HostMenu button..."
sed -i 's/bg-white dark:bg-slate-800/bg-slate-800/g' components/HostMenu.tsx

# 3. Fix Designer Studio main page background
echo "Fixing Designer Studio..."
sed -i 's/bg-\[#F3F4F6\]/bg-slate-900/g' app/host/design/page.tsx
sed -i 's/bg-gray-200 rounded-2xl animate-pulse/bg-white\/10 rounded-2xl animate-pulse/g' app/host/design/page.tsx
sed -i 's/bg-blue-50 w-20 h-20/bg-blue-500\/20 w-20 h-20/g' app/host/design/page.tsx
sed -i "s/'bg-green-50 text-green-600'/'bg-green-500\/20 text-green-400'/g" app/host/design/page.tsx
sed -i 's/hover:bg-red-50 text-red-500/hover:bg-red-500\/20 text-red-400/g' app/host/design/page.tsx
sed -i 's/border-gray-50 pt-4/border-white\/10 pt-4/g' app/host/design/page.tsx
sed -i 's/hover:bg-blue-100 transition/hover:bg-blue-500\/30 transition/g' app/host/design/page.tsx
sed -i 's/hover:bg-blue-50 hover:border-blue-200/hover:bg-white\/10 hover:border-white\/20/g' app/host/design/page.tsx
sed -i 's/group-hover:text-blue-600/group-hover:text-blue-400/g' app/host/design/page.tsx

# 4. Fix QuizBattle Create remaining light elements
echo "Fixing QuizBattle Create..."
sed -i "s/backgroundColor: '#E3F2FD'/backgroundColor: 'rgba(255,255,255,0.08)'/g" app/host/quizbattle/create/page.tsx
sed -i "s/backgroundColor: (!userId || uploading) ? '#ccc' : '#4CAF50'/backgroundColor: (!userId || uploading) ? 'rgba(255,255,255,0.1)' : '#4CAF50'/g" app/host/quizbattle/create/page.tsx
sed -i "s/backgroundColor: giphyLoading ? '#ccc' : '#4A90E2'/backgroundColor: giphyLoading ? 'rgba(255,255,255,0.1)' : '#4A90E2'/g" app/host/quizbattle/create/page.tsx

# 5. Fix play/class page light background
echo "Fixing play/class page..."
sed -i 's/bg-\[#F3F4F6\] flex items-center justify-center/bg-slate-900 flex items-center justify-center/g' "app/play/class/[id]/page.tsx"

# 6. Fix AlbumPlayerContent
echo "Fixing AlbumPlayerContent..."
sed -i 's/bg-\[#F3F4F6\] text-gray-900/bg-slate-900 text-white/g' components/AlbumPlayerContent.tsx
sed -i 's/bg-white text-gray-900 border-r border-gray-200/bg-slate-800\/80 text-white border-r border-white\/10/g' components/AlbumPlayerContent.tsx
sed -i 's/border-b border-gray-100/border-b border-white\/10/g' components/AlbumPlayerContent.tsx
sed -i 's/text-sm text-gray-500 hover:text-gray-900/text-sm text-white\/60 hover:text-white/g' components/AlbumPlayerContent.tsx
sed -i 's/font-bold text-xl text-gray-900/font-bold text-xl text-white/g' components/AlbumPlayerContent.tsx
sed -i 's/w-full bg-gray-100 rounded-full h-2/w-full bg-white\/10 rounded-full h-2/g' components/AlbumPlayerContent.tsx
sed -i "s/bg-blue-50 text-blue-800/bg-indigo-500\/20 text-indigo-300/g" components/AlbumPlayerContent.tsx
sed -i "s/hover:bg-gray-50 text-gray-600/hover:bg-white\/10 text-white\/60/g" components/AlbumPlayerContent.tsx
sed -i 's/text-3xl font-extrabold text-gray-900/text-3xl font-extrabold text-white/g' components/AlbumPlayerContent.tsx
sed -i 's/bg-white p-6 rounded-2xl shadow-sm border border-gray-100/bg-white\/5 p-6 rounded-2xl shadow-sm border border-white\/10/g' components/AlbumPlayerContent.tsx
sed -i 's/prose prose-lg text-gray-700/prose prose-lg text-white\/80/g' components/AlbumPlayerContent.tsx
sed -i 's/text-lg font-medium text-gray-900/text-lg font-medium text-white/g' components/AlbumPlayerContent.tsx
sed -i 's/border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-gray-800/border border-white\/20 rounded-xl bg-white\/5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-white/g' components/AlbumPlayerContent.tsx
sed -i "s/border-gray-100 bg-gray-50 text-gray-700/border-white\/10 bg-white\/5 text-white\/70/g" components/AlbumPlayerContent.tsx
sed -i "s/border-gray-100 bg-gray-50 text-gray-400 opacity-60/border-white\/10 bg-white\/5 text-white\/40 opacity-60/g" components/AlbumPlayerContent.tsx
sed -i "s/border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-white text-gray-700/border-white\/10 bg-white\/5 hover:border-indigo-400 hover:bg-white\/10 text-white\/70/g" components/AlbumPlayerContent.tsx
sed -i 's/bg-white p-4 rounded-2xl shadow-sm border border-gray-100/bg-white\/5 p-4 rounded-2xl shadow-sm border border-white\/10/g' components/AlbumPlayerContent.tsx
sed -i "s/opacity-50 cursor-not-allowed text-gray-400/opacity-50 cursor-not-allowed text-white\/40/g" components/AlbumPlayerContent.tsx
sed -i "s/text-gray-700 hover:bg-gray-50/text-white\/70 hover:bg-white\/10/g" components/AlbumPlayerContent.tsx

echo ""
echo "=== All fixes applied. Building... ==="
npm run build
