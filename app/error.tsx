'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Page error:', error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="glass-card-strong p-8">
                    <div className="text-6xl mb-6">😕</div>
                    <h2 className="text-2xl font-black text-[#fefefe] mb-4">
                        Oops! Something went wrong
                    </h2>
                    <p className="text-[#fefefe]/60 mb-6">
                        We couldn't load this page. Please try again.
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
                            className="w-full py-3 px-6 btn-3d-primary"
                        >
                            Try Again
                        </button>
                        <a
                            href="/"
                            className="w-full py-3 px-6 btn-glass text-[#fefefe] font-semibold inline-block text-center"
                        >
                            Return Home
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
