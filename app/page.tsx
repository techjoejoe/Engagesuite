import Link from 'next/link';
import Button from '@/components/Button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-400/30 dark:bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/30 dark:bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-400/30 dark:bg-pink-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="text-4xl">🚀</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            ClassDash
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/signup">
            <Button variant="primary" className="shadow-lg shadow-indigo-500/30">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-20 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 text-sm font-bold tracking-wide uppercase animate-fade-in-up">
          ✨ The Ultimate Classroom Companion
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight text-slate-900 dark:text-white animate-fade-in-up delay-100">
          Make Learning <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x">
            Unforgettable
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Engage your students directly on their devices with live polls, quizzes, and interactive games.
          Turn every lesson into an adventure.
        </p>



        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto animate-fade-in-up delay-500">
          {[
            { icon: '⚡', title: 'QuizBattle', desc: 'Competitive trivia games', color: 'bg-yellow-500' },
            { icon: '📊', title: 'LiveVote', desc: 'Real-time polling', color: 'bg-blue-500' },
            { icon: '📸', title: 'PicPick', desc: 'Photo challenges', color: 'bg-pink-500' },
            { icon: '☁️', title: 'WordStorm', desc: 'Collaborative clouds', color: 'bg-emerald-500' }
          ].map((feature, i) => (
            <div key={i} className="group relative p-1 rounded-2xl bg-gradient-to-b from-white/50 to-white/10 dark:from-slate-800/50 dark:to-slate-800/10 backdrop-blur-md border border-white/20 dark:border-slate-700 hover:-translate-y-2 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/10 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <div className="relative h-full bg-white/50 dark:bg-slate-900/50 p-6 rounded-xl flex flex-col items-center text-center">
                <div className={`w-16 h-16 ${feature.color}/10 rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
