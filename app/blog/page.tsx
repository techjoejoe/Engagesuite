import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog — Training Tips, Engagement Strategies & Platform Updates',
    description: 'Read the latest articles on classroom engagement, training strategies, gamification tips, and Trainer-Toolbox platform updates. Expert advice for trainers and educators.',
    keywords: ['training tips', 'classroom engagement blog', 'gamification strategies', 'education technology blog', 'trainer resources'],
};

const posts = [
    {
        slug: 'best-kahoot-alternatives',
        title: '10 Best Kahoot Alternatives for 2026',
        excerpt: 'Looking for a free Kahoot alternative? We compare the top interactive quiz platforms for trainers and educators, including pricing, features, and participant limits.',
        date: '2026-04-10',
        category: 'Comparisons',
        readTime: '8 min read',
    },
    {
        slug: 'how-to-create-interactive-training',
        title: 'How to Create Interactive Training Sessions That Actually Work',
        excerpt: 'Learn proven strategies for making training sessions more engaging with live polls, quizzes, and gamification. Backed by research on adult learning.',
        date: '2026-04-08',
        category: 'Training Tips',
        readTime: '6 min read',
    },
    {
        slug: 'gamification-in-education',
        title: 'Gamification in Education: Why It Works and How to Start',
        excerpt: 'Discover the science behind gamification in education. Learn how points, leaderboards, and rewards improve student engagement and learning outcomes.',
        date: '2026-04-05',
        category: 'Research',
        readTime: '7 min read',
    },
    {
        slug: 'live-polling-guide',
        title: 'Live Polling in the Classroom: A Complete Guide',
        excerpt: 'Everything you need to know about using live polls in your classroom or training session. From setup to best practices, this guide covers it all.',
        date: '2026-04-02',
        category: 'How-To Guides',
        readTime: '5 min read',
    },
    {
        slug: 'student-engagement-strategies',
        title: '5 Ways to Keep Students Engaged During Training',
        excerpt: 'Struggling to keep your audience engaged? These five proven strategies will transform your training sessions from passive lectures to active learning.',
        date: '2026-03-28',
        category: 'Training Tips',
        readTime: '4 min read',
    },
];

export default function BlogPage() {
    return (
        <main className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-violet/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan/15 rounded-full blur-[120px]" />
            </div>

            <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet to-violet-dark rounded-xl flex items-center justify-center text-lg shadow-lg">🚀</div>
                    <span className="text-xl font-bold text-white">Trainer-Toolbox</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/features" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors hidden sm:block">Features</Link>
                    <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white hover:text-violet-light transition-colors">Sign In</Link>
                    <Link href="/signup" className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-coral to-gold rounded-lg shadow-lg transition-all hover:-translate-y-0.5">Start Free</Link>
                </div>
            </nav>

            <div className="relative z-10 container mx-auto px-6 pt-12 pb-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
                        Trainer-Toolbox Blog
                    </h1>
                    <p className="text-xl text-white/60">
                        Training tips, engagement strategies, and platform updates for educators and trainers.
                    </p>
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-6 py-12">
                <div className="max-w-3xl mx-auto space-y-6">
                    {posts.map((post) => (
                        <article key={post.slug} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet/30 hover:bg-white/8 transition-all">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 rounded-full bg-violet/20 text-violet-light text-xs font-semibold">{post.category}</span>
                                <span className="text-white/40 text-xs">{post.date}</span>
                                <span className="text-white/40 text-xs">· {post.readTime}</span>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-violet-light transition-colors">{post.title}</h2>
                            <p className="text-white/60 text-sm leading-relaxed mb-3">{post.excerpt}</p>
                            <span className="text-violet-light text-sm font-semibold">Coming soon →</span>
                        </article>
                    ))}
                </div>
            </div>

            <div className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-white mb-4">Want to try the tools we write about?</h2>
                    <Link href="/signup" className="inline-block px-10 py-4 font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1">
                        Get Started Free
                    </Link>
                </div>
            </div>

            <footer className="relative z-10 border-t border-white/10 py-8">
                <div className="container mx-auto px-6 text-center text-white/40 text-sm">
                    <p>© 2026 Trainer-Toolbox. Making learning fun, one question at a time.</p>
                </div>
            </footer>
        </main>
    );
}
