import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Interactive Digital Workbook Creator — Free Online Course Builder',
    description: 'Create interactive digital workbooks with text, images, and auto-graded questions. Trainer-Toolbox workbooks let students learn at their own pace with built-in progress tracking.',
    keywords: ['digital workbook creator', 'interactive workbook', 'online course builder', 'self-paced learning', 'training workbook', 'auto-graded workbook'],
};

const allFeatures = [
    { title: 'Gradebook', href: '/features/gradebook', emoji: '📝' },
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
];

export default function WorkbooksPage() {
    return (
        <FeaturePageLayout
            title="Interactive Workbooks"
            subtitle="Create digital workbooks with text, images, and auto-graded questions. Students complete them at their own pace."
            emoji="📚"
            description="Trainer-Toolbox Workbooks is a free digital workbook creator that lets trainers build interactive, multi-page learning materials. Each workbook can contain text content, images, short-answer questions, essay prompts, and multiple-choice questions. Students work through pages at their own pace, and their progress is automatically tracked. Short-answer and multiple-choice questions are auto-graded, while essays can be manually reviewed. Completed workbooks earn bonus points that feed into the gamification leaderboard."
            heroFeatures={['Multi-Page Content', 'Auto-Grading', 'Self-Paced', 'Progress Tracking', 'Completion Bonuses']}
            faqs={[
                { question: 'What are interactive workbooks?', answer: 'Interactive workbooks are digital learning materials that combine reading content with embedded questions. Students read, answer questions, and get immediate feedback — all from their device.' },
                { question: 'How do I create digital workbooks?', answer: 'In Trainer-Toolbox, create a new workbook from your dashboard, add pages with text, images, and questions using the drag-and-drop editor, then assign it to your class. Students access it on their devices.' },
                { question: 'Can workbooks be graded automatically?', answer: 'Yes. Multiple-choice and short-answer questions are auto-graded. Essays and open-ended responses can be manually graded by the trainer through the gradebook.' },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {[
                    { title: 'Rich Content Pages', desc: 'Build multi-page workbooks with text, images, and embedded media. Each page can mix instructional content with questions.', icon: '📄' },
                    { title: 'Self-Paced Learning', desc: 'Students work through workbooks at their own speed. Progress is saved automatically so they can continue where they left off.', icon: '🕐' },
                    { title: 'Multiple Question Types', desc: 'Include short-answer, essay, and multiple-choice questions. Each type is handled differently for grading flexibility.', icon: '❓' },
                    { title: 'Completion Rewards', desc: 'Set bonus points for workbook completion. Students who finish earn extra points that appear on the class leaderboard.', icon: '🎁' },
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
