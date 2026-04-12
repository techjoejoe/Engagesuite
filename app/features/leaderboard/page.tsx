import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Classroom Leaderboard & Gamification Tool — Free Points System',
    description: 'Motivate students with points, badges, and leaderboards. Trainer-Toolbox gamification turns any training session into an engaging, competitive experience.',
    keywords: ['classroom leaderboard', 'gamification tool', 'student points system', 'classroom gamification', 'training gamification', 'engagement leaderboard'],
};

const allFeatures = [
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Gradebook', href: '/features/gradebook', emoji: '📝' },
    { title: 'Workbooks', href: '/features/workbooks', emoji: '📚' },
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
];

export default function LeaderboardPage() {
    return (
        <FeaturePageLayout
            title="Leaderboard & Gamification"
            subtitle="Motivate participants with points, badges, and real-time leaderboards. Turn any training into a game."
            emoji="🏆"
            description="Trainer-Toolbox Leaderboard and Gamification system turns your training sessions into engaging, competitive experiences. Students earn points from trivia games, workbook completions, and other activities. Points accumulate on a class-wide leaderboard that updates in real time. The leaderboard can be displayed on a projector screen to create healthy competition and drive engagement. Combined with badges, streak bonuses, and rewards, Trainer-Toolbox gamification keeps participants motivated throughout multi-day training programs."
            heroFeatures={['Real-Time Rankings', 'Points System', 'Projector View', 'Multi-Activity Tracking', 'Badges & Rewards']}
            faqs={[
                { question: 'How do I gamify my classroom?', answer: 'With Trainer-Toolbox gamification, students earn points from trivia games, workbook completions, and participation. Points feed into a live leaderboard that you can display on a projector to create competition.' },
                { question: 'What is a classroom leaderboard?', answer: 'A classroom leaderboard ranks students by points earned from various learning activities. It creates healthy competition, motivates participation, and makes learning more engaging and fun.' },
                { question: 'Does gamification improve learning outcomes?', answer: 'Research shows that gamification increases student engagement, motivation, and retention. Leaderboards, points, and rewards create positive reinforcement loops that encourage active participation.' },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {[
                    { title: 'Unified Points System', desc: 'Points from trivia games, workbooks, and other activities all feed into one leaderboard. Students see their total ranking across everything.', icon: '⭐' },
                    { title: 'Projector-Ready Display', desc: 'A beautiful full-screen leaderboard view designed for projecting in classrooms. Animated rankings keep the energy high.', icon: '🖥️' },
                    { title: 'Healthy Competition', desc: 'Leaderboards create positive peer pressure that motivates even reluctant participants to engage and try their best.', icon: '🔥' },
                    { title: 'Multi-Session Tracking', desc: 'Points persist across multiple sessions. Perfect for multi-day training programs, semester-long courses, or ongoing engagement.', icon: '📅' },
                ].map((benefit, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <div className="text-3xl mb-3">{benefit.icon}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{benefit.title}</h3>
                        <p className="text-white/60 leading-relaxed">{benefit.desc}</p>
                    </div>
                ))}
            </div>
        </FeaturePageLayout>
    );
}
