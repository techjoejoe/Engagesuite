import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Features — Interactive Training Tools for Educators & Trainers',
    description: 'Explore Trainer-Toolbox features: live polling, trivia games, word clouds, gradebooks, workbooks, photo contests, and leaderboards. Free Kahoot alternative for trainers.',
    keywords: ['training tools', 'classroom engagement features', 'interactive learning tools', 'kahoot alternative features'],
};

const features = [
    {
        emoji: '📊',
        title: 'Live Polling',
        desc: 'Create instant polls and see real-time results from your audience. Perfect for gathering feedback, checking understanding, and driving discussion.',
        href: '/features/live-polling',
        keywords: 'Real-time polling, audience feedback',
    },
    {
        emoji: '🎯',
        title: 'Trivia Games',
        desc: 'Build competitive quiz games with timed questions, automatic scoring, and leaderboards. The best free Kahoot alternative for trainers.',
        href: '/features/trivia-games',
        keywords: 'Kahoot alternative, quiz games',
    },
    {
        emoji: '☁️',
        title: 'Word Clouds',
        desc: 'Generate beautiful live word clouds from audience responses. Great for brainstorming, icebreakers, and visual engagement.',
        href: '/features/word-cloud',
        keywords: 'Live word cloud, brainstorming tool',
    },
    {
        emoji: '📸',
        title: 'Photo Contests',
        desc: 'Run live photo competitions where participants submit and vote on photos. Perfect for team building and events.',
        href: '/features/photo-contests',
        keywords: 'Photo voting, live contest',
    },
    {
        emoji: '📝',
        title: 'Gradebook',
        desc: 'Track student grades, progress, and performance across all assignments. Built-in analytics to identify students who need help.',
        href: '/features/gradebook',
        keywords: 'Online grading, progress tracking',
    },
    {
        emoji: '📚',
        title: 'Workbooks',
        desc: 'Create interactive digital workbooks with text, images, and questions. Students complete at their own pace with auto-grading.',
        href: '/features/workbooks',
        keywords: 'Digital workbooks, interactive courses',
    },
    {
        emoji: '🏆',
        title: 'Leaderboard & Gamification',
        desc: 'Motivate participants with points, badges, and leaderboards. Turn any training session into a gamified experience.',
        href: '/features/leaderboard',
        keywords: 'Gamification, points system',
    },
];

export default function FeaturesPage() {
    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-violet/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan/15 rounded-full blur-[120px]" />
            </div>

            {/* Nav */}
            <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet to-violet-dark rounded-xl flex items-center justify-center text-lg shadow-lg">🚀</div>
                    <span className="text-xl font-bold text-white">Trainer-Toolbox</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/blog" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors hidden sm:block">Blog</Link>
                    <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white hover:text-violet-light transition-colors">Sign In</Link>
                    <Link href="/signup" className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-coral to-gold rounded-lg shadow-lg transition-all hover:-translate-y-0.5">Start Free</Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="relative z-10 container mx-auto px-6 pt-12 pb-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
                        All the Tools You Need to{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-light to-cyan">Engage Your Audience</span>
                    </h1>
                    <p className="text-xl text-white/60 max-w-2xl mx-auto mb-6">
                        Trainer-Toolbox is a free interactive training platform packed with features to make every session unforgettable. A complete Kahoot and Mentimeter alternative.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <Link
                            key={feature.href}
                            href={feature.href}
                            className="group p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-violet/50 hover:bg-white/10 transition-all duration-300"
                        >
                            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{feature.emoji}</div>
                            <h2 className="text-xl font-bold text-white mb-2">{feature.title}</h2>
                            <p className="text-white/60 text-sm leading-relaxed mb-3">{feature.desc}</p>
                            <span className="text-xs text-violet-light font-semibold uppercase tracking-wide">{feature.keywords}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="relative z-10 container mx-auto px-6 py-20">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Get Started?</h2>
                    <p className="text-white/60 text-lg mb-8">All features are free. No credit card required.</p>
                    <Link href="/signup" className="inline-block px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1">
                        Start Your Free Trial
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-8">
                <div className="container mx-auto px-6 text-center text-white/40 text-sm">
                    <p>© 2026 Trainer-Toolbox. Making learning fun, one question at a time.</p>
                </div>
            </footer>
        </main>
    );
}
