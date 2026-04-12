import type { Metadata } from 'next';
import FeaturePageLayout from '@/components/FeaturePageLayout';

export const metadata: Metadata = {
    title: 'Online Gradebook for Trainers — Free Digital Grade Tracker',
    description: 'Track student grades, progress, and performance with Trainer-Toolbox free online gradebook. Built-in analytics, auto-grading, and assignment tracking for educators and trainers.',
    keywords: ['online gradebook', 'free gradebook', 'digital grade tracker', 'student progress tracking', 'classroom grade management', 'auto grading'],
};

const allFeatures = [
    { title: 'Workbooks', href: '/features/workbooks', emoji: '📚' },
    { title: 'Trivia Games', href: '/features/trivia-games', emoji: '🎯' },
    { title: 'Leaderboard', href: '/features/leaderboard', emoji: '🏆' },
    { title: 'Live Polling', href: '/features/live-polling', emoji: '📊' },
];

export default function GradebookPage() {
    return (
        <FeaturePageLayout
            title="Digital Gradebook"
            subtitle="Track student grades, progress, and performance across all assignments. Built-in analytics to identify who needs help."
            emoji="📝"
            description="Trainer-Toolbox Gradebook is a free online gradebook that automatically tracks student scores across trivia games, workbooks, and assignments. It calculates overall grades, shows per-assignment breakdowns, and identifies students who may need extra support. Trainers can manually grade essay questions and short answers, while multiple-choice questions are auto-graded. The gradebook integrates seamlessly with all other Trainer-Toolbox features — every quiz score and workbook completion is automatically recorded."
            heroFeatures={['Auto-Grading', 'Per-Student View', 'Assignment Tracking', 'Export Grades', 'Grade Analytics']}
            faqs={[
                { question: 'How do I track student grades online?', answer: 'With Trainer-Toolbox, grades are tracked automatically. When students complete trivia games or workbooks, their scores are recorded in the gradebook. You can also manually grade essay and short-answer questions.' },
                { question: 'Is the online gradebook free?', answer: 'Yes. Trainer-Toolbox gradebook is completely free. It includes auto-grading, per-student views, assignment breakdowns, and grade analytics at no cost.' },
                { question: 'Can I export grades from Trainer-Toolbox?', answer: 'Yes. You can export grades as a CSV file for import into your school\'s LMS or for your own records.' },
            ]}
            relatedFeatures={allFeatures}
        >
            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {[
                    { title: 'Automatic Grade Tracking', desc: 'Every trivia game score and workbook completion is automatically recorded. No manual data entry needed.', icon: '⚡' },
                    { title: 'Per-Student Breakdown', desc: 'Click any student to see their individual performance across all assignments, with grades and completion status.', icon: '👤' },
                    { title: 'Manual Grading', desc: 'Grade essay questions, short answers, and open-ended responses with a simple inline grading interface.', icon: '✏️' },
                    { title: 'Identify At-Risk Students', desc: 'Quickly spot students who are falling behind with visual grade indicators and completion percentages.', icon: '🔍' },
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
