import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Live Word Cloud Generator — Free Real-Time Word Cloud for Presentations',
    description: 'Create beautiful live word clouds from audience responses in real time. Trainer-Toolbox word cloud generator is perfect for brainstorming, icebreakers, and interactive presentations.',
    keywords: ['word cloud generator', 'live word cloud', 'real-time word cloud', 'interactive word cloud', 'word cloud for presentations', 'brainstorming tool'],
};

const allFeatures = [
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Photo Contests', href: '/features/photo-contests', emoji: '📸' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
];

export default function WordCloudPage() {
    return (
        <FeaturePageLayout
            title="Live Word Clouds"
            subtitle="Generate beautiful word clouds from your audience's responses in real time. Perfect for brainstorming, icebreakers, and interactive presentations."
            emoji="☁️"
            description="Trainer-Toolbox Word Cloud generates a live, animated word cloud from your audience's responses. Ask a question, and as participants submit their answers, the most popular words grow larger on screen. It's a powerful visual tool for brainstorming sessions, icebreakers, feedback gathering, and training workshops. The word cloud updates in real time on the presenter screen, creating an engaging experience where every voice is represented visually."
            heroFeatures={['Real-Time Animation', 'Beautiful Visuals', 'Unlimited Responses', 'Presenter View', 'Zero Setup']}
            faqs={[
                { question: 'How do I create a live word cloud?', answer: 'Sign up free on Trainer-Toolbox, create a Word Storm from your dashboard, type your prompt question, then share the join code. Audience responses appear as a growing word cloud in real time.' },
                { question: 'What is a word cloud used for in education?', answer: 'Word clouds are used for brainstorming, activating prior knowledge, icebreakers, gauging opinions, and summarizing key concepts. They give every participant a voice and create a visual summary of group thinking.' },
                { question: 'Can I use word clouds for corporate training?', answer: 'Absolutely. Word clouds are widely used in corporate training for team brainstorming, workshop icebreakers, gathering employee feedback, and making meetings more interactive.' },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-3 gap-6 mb-16">
                {[
                    { title: 'Brainstorming', desc: 'Collect ideas from your entire group and see which themes emerge as the most popular words grow larger.', icon: '💡' },
                    { title: 'Icebreakers', desc: 'Start any session with a fun word cloud prompt like "Describe yourself in one word" to energize the group.', icon: '🧊' },
                    { title: 'Feedback', desc: 'Ask "What did you learn today?" and instantly see a visual summary of your audience\'s takeaways.', icon: '📝' },
                ].map((use, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-4xl mb-3">{use.icon}</div>
                        <h3 className="text-lg font-bold text-white mb-2">{use.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">{use.desc}</p>
                    </div>
                ))}
            </div>
        </FeaturePageLayout>
    );
}
