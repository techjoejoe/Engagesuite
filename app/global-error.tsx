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
            <body>
                <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0F0A1E] via-[#1E1033] to-[#0F0A1E]">
                    <div className="bg-violet/15 backdrop-blur-xl rounded-2xl p-8 border-2 border-white/25 shadow-xl shadow-violet/20">
                        <div className="text-center max-w-md">
                            <div className="text-6xl mb-6">💥</div>
                            <h1 className="text-2xl font-black text-white mb-4">
                                Something Went Wrong
                            </h1>
                            <p className="text-white/60 mb-6">
                                An unexpected error occurred. Please try again.
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

                            <button
                                onClick={reset}
                                className="w-full py-3 px-6 bg-gradient-to-b from-violet-light to-violet text-white font-bold rounded-xl shadow-lg shadow-violet/40 hover:shadow-xl transition-all"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
