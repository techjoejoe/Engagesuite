import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Free Trivia Game Maker — Best Kahoot Alternative for Trainers',
    description: 'Create live trivia games with timed questions, automatic scoring, and leaderboards. Trainer-Toolbox is the best free Kahoot alternative for classrooms and training sessions.',
    keywords: ['kahoot alternative', 'free kahoot alternative', 'trivia game maker', 'classroom quiz game', 'live quiz app', 'interactive quiz platform'],
};

const allFeatures = [
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
    { title: 'Word Clouds', href: '/features/word-cloud', emoji: '☁️' },
    { title: 'Gradebook', href: '/features/gradebook', emoji: '📝' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
];

export default function TriviaGamesPage() {
    return (
        <FeaturePageLayout
            title="Trivia Games"
            subtitle="The best free Kahoot alternative. Create live quiz games with timed questions, automatic scoring, and real-time leaderboards."
            emoji="🎯"
            description="Trainer-Toolbox Trivia Games is a free Kahoot alternative that lets you create live competitive quiz games for your classroom or training session. Build custom trivia games with timed multiple-choice questions, automatic scoring based on speed and accuracy, real-time leaderboards, and sound effects. Unlike Kahoot, Trainer-Toolbox has no participant limits on the free plan and includes features like streak bonuses, winner celebrations, and a full presenter view for projecting onto a big screen."
            heroFeatures={['Timed Questions', 'Auto-Scoring', 'Live Leaderboard', 'Sound Effects', 'Streak Bonuses', 'Free Forever']}
            faqs={[
                {
                    question: 'What is the best free Kahoot alternative?',
                    answer: 'Trainer-Toolbox is one of the best free Kahoot alternatives. It offers live trivia games with timed questions, automatic scoring, leaderboards, and sound effects — all completely free with no participant limits.',
                },
                {
                    question: 'How do I make a trivia game for my class?',
                    answer: 'Sign up for free, click "Create Trivia" on your dashboard, add questions with multiple-choice answers, set timers, then launch the game. Students join with a code and compete in real time.',
                },
                {
                    question: 'Can I use Trainer-Toolbox for corporate training?',
                    answer: 'Yes. Trainer-Toolbox trivia games work great for corporate training, onboarding, team building, and professional development. The competitive format keeps adults engaged.',
                },
                {
                    question: 'How many players can join a trivia game?',
                    answer: 'Trainer-Toolbox has no participant limits. Whether you have 5 or 500 players, everyone can join and compete in real time for free.',
                },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {[
                    { title: 'Competitive & Fun', desc: 'Timed questions with points for speed create an exciting competitive atmosphere that keeps every participant engaged from start to finish.', icon: '🔥' },
                    { title: 'Automatic Scoring', desc: 'Answers are graded instantly. Points are awarded based on accuracy and speed, with streak bonuses for consecutive correct answers.', icon: '✅' },
                    { title: 'Live Leaderboard', desc: 'A real-time leaderboard shows rankings after each question. Watch participants climb the ranks and compete for the top spot.', icon: '📊' },
                    { title: 'Presenter View', desc: 'A beautiful full-screen presenter view displays questions, answer reveals, and leaderboards — perfect for projecting in a classroom or meeting.', icon: '🖥️' },
                ].map((benefit, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-3xl mb-3">{benefit.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-white/60 leading-relaxed">{benefit.desc}</p>
                    </div>
                ))}
            </div>

            <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">Trainer-Toolbox vs Kahoot</h2>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="px-6 py-4 text-white font-bold">Feature</th>
                                <th className="px-6 py-4 text-white font-bold">Trainer-Toolbox</th>
                                <th className="px-6 py-4 text-white font-bold">Kahoot</th>
                            </tr>
                        </thead>
                        <tbody className="text-white/70 text-sm">
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Price</td><td className="px-6 py-3 text-emerald-400">Free</td><td className="px-6 py-3">$17/mo+</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Participant Limit (Free)</td><td className="px-6 py-3 text-emerald-400">Unlimited</td><td className="px-6 py-3">50 players</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Leaderboard</td><td className="px-6 py-3 text-emerald-400">✓</td><td className="px-6 py-3">✓</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Sound Effects</td><td className="px-6 py-3 text-emerald-400">✓</td><td className="px-6 py-3">✓</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Streak Bonuses</td><td className="px-6 py-3 text-emerald-400">✓</td><td className="px-6 py-3">✗</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Live Polling</td><td className="px-6 py-3 text-emerald-400">✓ Built-in</td><td className="px-6 py-3">✗ Separate tool</td></tr>
                            <tr className="border-t border-white/5"><td className="px-6 py-3">Gradebook</td><td className="px-6 py-3 text-emerald-400">✓ Built-in</td><td className="px-6 py-3">✗</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </FeaturePageLayout>
    );
}
