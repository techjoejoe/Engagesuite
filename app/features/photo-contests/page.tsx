import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Photo Contest App — Run Live Photo Competitions & Voting',
    description: 'Run live photo contests where participants submit and vote on photos. Trainer-Toolbox photo contest app is perfect for team building, events, and audience engagement.',
    keywords: ['photo contest app', 'photo voting app', 'live photo competition', 'audience photo contest', 'team building photo activity', 'event photo contest'],
};

const allFeatures = [
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Word Clouds', href: '/features/word-cloud', emoji: '☁️' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
];

export default function PhotoContestsPage() {
    return (
        <FeaturePageLayout
            title="Photo Contests"
            subtitle="Run live photo competitions where your audience submits and votes on photos. Perfect for team building and events."
            emoji="📸"
            description="Trainer-Toolbox Photo Contests (PicPick) is a free photo contest app that lets you run live photo competitions during events, training sessions, or team-building activities. Set a theme, let participants submit photos from their phones, and then open voting so the audience picks the winners. Photos are displayed in a beautiful gallery with real-time vote counts. It's a fun, engaging way to break the ice, encourage creativity, and get everyone participating."
            heroFeatures={['Live Photo Submission', 'Audience Voting', 'Beautiful Gallery', 'Real-Time Results', 'Theme-Based Contests']}
            faqs={[
                { question: 'How do I run a photo contest?', answer: 'Create a PicPick contest on Trainer-Toolbox, set a theme and description, then share the join code. Participants submit photos from their phones, and you open voting when ready. The audience votes and winners are announced live.' },
                { question: 'What app can I use for a photo contest?', answer: 'Trainer-Toolbox PicPick is a free app for running live photo contests. Participants submit photos from their phones, the audience votes, and winners are displayed in a beautiful gallery with real-time results.' },
                { question: 'Can I use photo contests for team building?', answer: 'Yes. Photo contests are one of the most popular team-building activities. Set creative themes like "Best Team Selfie" or "Find Something Blue" to get teams collaborating and having fun.' },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-3 gap-6 mb-16">
                {[
                    { title: 'Set a Theme', desc: 'Choose a creative theme for your contest — from "Best Selfie" to "Most Creative Workspace." Themes drive participation and fun.', icon: '🎨' },
                    { title: 'Submit & Vote', desc: 'Participants snap photos and submit from their phones. When submissions close, everyone votes for their favorites.', icon: '🗳️' },
                    { title: 'Celebrate Winners', desc: 'Winners are displayed in a beautiful gallery with vote counts. Perfect for projecting on a big screen during events.', icon: '🏆' },
                ].map((step, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-4xl mb-3">{step.icon}</div>
                        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                        <p className="text-white/60 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                ))}
            </div>
        </FeaturePageLayout>
    );
}
