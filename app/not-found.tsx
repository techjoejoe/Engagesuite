import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="glass-card-strong p-8">
                    {/* 404 Visual */}
                    <div className="relative mb-6">
                        <span className="text-[120px] font-black text-gradient-purple leading-none">
                            404
                        </span>
                    </div>

                    <h1 className="text-2xl font-black text-[#fefefe] mb-4">
                        Page Not Found
                    </h1>
                    <p className="text-[#fefefe]/60 mb-8">
                        Hmm, this page seems to have wandered off. Let's get you back on track!
                    </p>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/"
                            className="w-full py-3 px-6 btn-3d-primary inline-block text-center"
                        >
                            Go Home
                        </Link>
                        <Link
                            href="/join"
                            className="w-full py-3 px-6 btn-glass text-[#fefefe] font-semibold inline-block text-center"
                        >
                            Join a Game
                        </Link>
                    </div>

                    {/* Fun Element */}
                    <div className="mt-8 pt-6 border-t border-[#fefefe]/15">
                        <p className="text-[#fefefe]/50 text-sm">
                            Lost? Try checking the URL or use the navigation above.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
