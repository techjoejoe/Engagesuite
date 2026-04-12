import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Live Polling Tool for Classrooms & Training — Free Real-Time Polls',
    description: 'Create live polls and see real-time results from your audience. Trainer-Toolbox live polling is a free Mentimeter alternative for classrooms, training sessions, and presentations.',
    keywords: ['live polling tool', 'real-time polling app', 'classroom polling', 'audience polling', 'mentimeter alternative', 'free polling tool'],
};

const allFeatures = [
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Word Clouds', href: '/features/word-cloud', emoji: '☁️' },
    { title: 'Photo Contests', href: '/features/photo-contests', emoji: '📸' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
];

export default function LivePollingPage() {
    return (
        <FeaturePageLayout
            title="Live Polling"
            subtitle="Create instant polls and see results in real time. Perfect for classrooms, workshops, and presentations."
            emoji="📊"
            description="Trainer-Toolbox Live Polling lets you create real-time polls that your audience answers from their phones. Results update instantly on the presenter screen, making it perfect for gathering feedback, checking understanding, and sparking discussion. Unlike Mentimeter or Slido, Trainer-Toolbox is completely free with no participant limits. Simply create a poll question, share the join code, and watch responses flow in live."
            heroFeatures={['Real-Time Results', 'Unlimited Participants', 'No App Download', 'QR Code Joining', 'Presenter View']}
            faqs={[
                {
                    question: 'What is live polling?',
                    answer: 'Live polling is a way to ask your audience a question and see their responses in real time. Participants answer from their phones or devices, and results appear instantly on the presenter screen.',
                },
                {
                    question: 'How do I create a live poll for my class?',
                    answer: 'Sign up for free on Trainer-Toolbox, create a new poll from your dashboard, add your question and answer options, then share the join code or QR code with your class. Results appear in real time.',
                },
                {
                    question: 'Is Trainer-Toolbox a free alternative to Mentimeter?',
                    answer: 'Yes. Trainer-Toolbox offers free live polling with no participant limits, real-time results, and presenter view — all features that Mentimeter charges for on their paid plans.',
                },
                {
                    question: 'Can I use live polls during a presentation?',
                    answer: 'Absolutely. Trainer-Toolbox has a full-screen presenter view that displays poll results in real time. You can project it onto a screen while participants vote from their devices.',
                },
            ]}
            relatedFeatures={allFeatures}
        >
            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {[
                    { title: 'Instant Feedback', desc: 'Get real-time responses from your entire audience. No waiting, no manual counting — results update live as people vote.', icon: '⚡' },
                    { title: 'Beautiful Visualizations', desc: 'Poll results are displayed as stunning bar charts and donut graphs on the presenter screen, making data easy to understand at a glance.', icon: '📈' },
                    { title: 'Zero Friction', desc: 'Participants join by scanning a QR code or visiting a URL. No app downloads, no account creation — just instant participation.', icon: '🔗' },
                    { title: 'Works Everywhere', desc: 'Whether you\'re running an in-person class, a virtual workshop, or a hybrid session, live polls work across all devices and environments.', icon: '🌍' },
                ].map((benefit, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-3xl mb-3">{benefit.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-white/60 leading-relaxed">{benefit.desc}</p>
                    </div>
                ))}
            </div>

            {/* How It Works */}
            <div className="mb-16">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">How Live Polling Works</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { step: '1', title: 'Create Your Poll', desc: 'Add a question and answer options from your trainer dashboard. It takes less than 30 seconds.' },
                        { step: '2', title: 'Share the Code', desc: 'Display the QR code or join link on the presenter screen. Participants scan and join instantly.' },
                        { step: '3', title: 'See Live Results', desc: 'Watch responses flow in real time. Results update instantly on your presenter view.' },
                    ].map((item, i) => (
                        <div key={i} className="text-center p-6">
                            <div className="w-12 h-12 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-violet-light font-bold text-xl mx-auto mb-4">{item.step}</div>
                            <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                            <p className="text-white/60 text-sm">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </FeaturePageLayout>
    );
}
