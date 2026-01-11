'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Global error:', error);
    }, [error]);

    return (
        <html>
            <body className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2d1b4e] to-[#0f0518] flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="bg-[#9f28e3]/15 backdrop-blur-xl rounded-2xl p-8 border-2 border-[#fefefe]/25 shadow-xl shadow-[#9f28e3]/20">
                        <div className="text-6xl mb-6">💥</div>
                        <h1 className="text-3xl font-black text-[#fefefe] mb-4">
                            Something went wrong
                        </h1>
                        <p className="text-[#fefefe]/60 mb-6">
                            An unexpected error occurred. We've been notified and are working on it.
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-left">
                                <p className="text-red-300 text-sm font-mono break-all">
                                    {error.message}
                                </p>
                                {error.digest && (
                                    <p className="text-red-300/60 text-xs mt-2">
                                        Error ID: {error.digest}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={reset}
                                className="w-full py-3 px-6 bg-gradient-to-b from-[#b44de8] to-[#9f28e3] text-[#fefefe] font-bold rounded-xl shadow-lg shadow-[#9f28e3]/40 hover:shadow-xl transition-all"
                            >
                                Try Again
                            </button>
                            <a
                                href="/"
                                className="w-full py-3 px-6 bg-[#fefefe]/10 border border-[#fefefe]/30 text-[#fefefe] font-semibold rounded-xl transition-all hover:bg-[#fefefe]/20 inline-block"
                            >
                                Return Home
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
