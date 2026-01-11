export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                {/* Animated Logo */}
                <div className="relative mb-8">
                    <div className="text-6xl animate-bounce">🚀</div>
                    <div className="absolute inset-0 bg-[#9f28e3]/40 rounded-full blur-xl animate-pulse" />
                </div>

                {/* Loading Text */}
                <h2 className="text-2xl font-bold text-[#fefefe] mb-4">
                    Loading...
                </h2>

                {/* Progress Bar */}
                <div className="w-48 h-1.5 bg-[#9f28e3]/20 rounded-full mx-auto overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#9f28e3] via-[#b44de8] to-[#9f28e3] rounded-full animate-loading-bar" />
                </div>

                {/* Tip */}
                <p className="text-[#fefefe]/50 text-sm mt-6">
                    Preparing something awesome...
                </p>
            </div>
        </div>
    );
}
