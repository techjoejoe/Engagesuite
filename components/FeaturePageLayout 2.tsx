import Link from 'next/link';
import { ReactNode } from 'react';

interface FAQ {
    question: string;
    answer: string;
}

interface FeaturePageLayoutProps {
    title: string;
    subtitle: string;
    description: string;
    emoji: string;
    heroFeatures: string[];
    children: ReactNode;
    faqs: FAQ[];
    relatedFeatures: { title: string; href: string; emoji: string }[];
}

export default function FeaturePageLayout({
    title,
    subtitle,
    description,
    emoji,
    heroFeatures,
    children,
    faqs,
    relatedFeatures,
}: FeaturePageLayoutProps) {
    const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer,
            },
        })),
    };

    return (
        <main className="min-h-screen relative overflow-hidden">
            {/* JSON-LD FAQ Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
            />

            {/* Background */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-violet/20 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan/15 rounded-full blur-[120px]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet to-violet-dark rounded-xl flex items-center justify-center text-lg shadow-lg">
                        🚀
                    </div>
                    <span className="text-xl font-bold text-white">Trainer-Toolbox</span>
                </Link>
                <div className="flex items-center gap-4">
                    <Link href="/features" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors hidden sm:block">
                        Features
                    </Link>
                    <Link href="/blog" className="px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors hidden sm:block">
                        Blog
                    </Link>
                    <Link href="/login" className="px-4 py-2 text-sm font-semibold text-white hover:text-violet-light transition-colors">
                        Sign In
                    </Link>
                    <Link
                        href="/signup"
                        className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-coral to-gold rounded-lg shadow-lg transition-all hover:-translate-y-0.5"
                    >
                        Start Free
                    </Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="relative z-10 container mx-auto px-6 pt-12 pb-16">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-6xl mb-6">{emoji}</div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                        {title}
                    </h1>
                    <p className="text-xl md:text-2xl text-white/60 mb-8 max-w-2xl mx-auto leading-relaxed">
                        {subtitle}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {heroFeatures.map((feature, i) => (
                            <span key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white/80 text-sm font-medium">
                                ✓ {feature}
                            </span>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="px-10 py-4 font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1"
                        >
                            Get Started Free
                        </Link>
                        <Link
                            href="/features"
                            className="px-10 py-4 font-semibold text-white border border-white/20 rounded-xl hover:bg-white/5 transition-all"
                        >
                            View All Features
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-5xl mx-auto">
                    {/* Answer-ready description paragraph for AI/Google */}
                    <div className="mb-16 p-8 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-lg text-white/80 leading-relaxed">{description}</p>
                    </div>

                    {children}
                </div>
            </div>

            {/* FAQ Section */}
            <section className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, i) => (
                            <details key={i} className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                <summary className="flex items-center justify-between cursor-pointer text-lg font-semibold text-white list-none">
                                    {faq.question}
                                    <span className="text-white/40 group-open:rotate-45 transition-transform text-2xl">+</span>
                                </summary>
                                <p className="mt-4 text-white/70 leading-relaxed">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Related Features */}
            <section className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl font-bold text-white mb-8 text-center">Explore More Features</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {relatedFeatures.map((feature) => (
                            <Link
                                key={feature.href}
                                href={feature.href}
                                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-violet/50 hover:bg-white/10 transition-all text-center group"
                            >
                                <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{feature.emoji}</div>
                                <div className="text-sm font-semibold text-white">{feature.title}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative z-10 container mx-auto px-6 py-16">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Ready to Transform Your Training?
                    </h2>
                    <p className="text-white/60 text-lg mb-8">
                        Join thousands of trainers and educators using Trainer-Toolbox.
                    </p>
                    <Link
                        href="/signup"
                        className="inline-block px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1"
                    >
                        Start Your Free Trial
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-12">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-white font-bold mb-4">Features</h3>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li><Link href="/features/live-polling" className="hover:text-white transition-colors">Live Polling</Link></li>
                                <li><Link href="/features/trivia-games" className="hover:text-white transition-colors">Trivia Games</Link></li>
                                <li><Link href="/features/word-cloud" className="hover:text-white transition-colors">Word Clouds</Link></li>
                                <li><Link href="/features/photo-contests" className="hover:text-white transition-colors">Photo Contests</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Tools</h3>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li><Link href="/features/gradebook" className="hover:text-white transition-colors">Gradebook</Link></li>
                                <li><Link href="/features/workbooks" className="hover:text-white transition-colors">Workbooks</Link></li>
                                <li><Link href="/features/leaderboard" className="hover:text-white transition-colors">Leaderboard</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Resources</h3>
                            <ul className="space-y-2 text-sm text-white/60">
                                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up Free</Link></li>
                                <li><Link href="/join" className="hover:text-white transition-colors">Join a Class</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-4">Trainer-Toolbox</h3>
                            <p className="text-sm text-white/60">The free interactive training platform. A better alternative to Kahoot and Mentimeter for trainers and educators.</p>
                        </div>
                    </div>
                    <div className="text-center text-white/40 text-sm border-t border-white/10 pt-8">
                        <p>© 2026 Trainer-Toolbox. Making learning fun, one question at a time.</p>
                    </div>
                </div>
            </footer>
        </main>
    );
}
