import React, { useRef, useState } from 'react';
import { Icons } from './Icons';
import { Spinner } from './UI';

interface ImageUploadProps {
    onUpload: (blob: Blob) => void;
    uploading: boolean;
}

export const ImageUpload = ({ onUpload, uploading }: ImageUploadProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const processImage = (file: File): Promise<Blob> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = Math.min(img.width, img.height);
                    canvas.width = 800;
                    canvas.height = 800;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        const sx = (img.width - size) / 2;
                        const sy = (img.height - size) / 2;
                        ctx.drawImage(img, sx, sy, size, size, 0, 0, 800, 800);
                        canvas.toBlob((blob) => {
                            if (blob) resolve(blob);
                        }, 'image/jpeg', 0.9);
                    }
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const processedBlob = await processImage(file);
        onUpload(processedBlob);
    };

    return (
        <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-indigo-500/40 hover:border-indigo-500/80 hover:bg-indigo-500/10'}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleFiles(e.target.files)} className="hidden" />
            {uploading ? (
                <div className="flex flex-col items-center gap-4">
                    <Spinner />
                    <p className="text-white/60">Uploading...</p>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Icons.Upload />
                    </div>
                    <div>
                        <p className="text-white font-semibold">Drop your photo here</p>
                        <p className="text-white/60 text-sm mt-1">or click to browse</p>
                    </div>
                </div>
            )}
        </div>
    );
};
