import Link from 'next/link';
import Button from '@/components/Button';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-white">
      {/* Professional Background - Subtle */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#6366f1]/10 rounded-full blur-[150px] animate-blob" />
        <div className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] bg-[#3b82f6]/8 rounded-full blur-[130px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-15%] left-[25%] w-[50%] h-[50%] bg-[#8b5cf6]/8 rounded-full blur-[140px] animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto backdrop-blur-sm bg-white/80 border-b border-gray-200">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="text-4xl">🚀</span>
          <span className="text-gradient">ClassDash</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="glass" size="md">Log In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" className="glow-violet">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-20 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-[#1e40af] text-sm font-bold tracking-wide uppercase animate-fade-in-up">
          ✨ The Ultimate Classroom Companion
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight text-[#0f172a] animate-fade-in-up delay-100">
          Make Learning <br />
          <span className="text-gradient animate-gradient-x">Unforgettable</span>
        </h1>

        <p className="text-xl md:text-2xl text-[#64748b] mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Engage your students directly on their devices with live polls, quizzes, and interactive games.
          Turn every lesson into an adventure.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
          <Link href="/signup">
            <Button variant="primary" size="lg" className="glow-violet">🚀 Start Free</Button>
          </Link>
          <Link href="/join">
            <Button variant="glass" size="lg">🎮 Join a Game</Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto animate-fade-in-up delay-500">
          {[
            { icon: '⚡', title: 'QuizBattle', desc: 'Competitive trivia games', color: 'from-[#6366f1] to-[#8b5cf6]' },
            { icon: '📊', title: 'LiveVote', desc: 'Real-time polling', color: 'from-[#3b82f6] to-[#06b6d4]' },
            { icon: '📸', title: 'PicPick', desc: 'Photo challenges', color: 'from-[#f59e0b] to-[#f97316]' },
            { icon: '☁️', title: 'WordStorm', desc: 'Collaborative clouds', color: 'from-[#8b5cf6] to-[#a855f7]' }
          ].map((feature, i) => (
            <div key={i} className="group glass-card glass-card-hover p-6 flex flex-col items-center text-center bg-white border-gray-200">
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] mb-2">{feature.title}</h3>
              <p className="text-[#64748b]">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 glass-card-strong p-8 max-w-4xl mx-auto animate-fade-in-up delay-500 bg-white border-gray-200">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-gradient-violet">10K+</div>
              <div className="text-[#64748b] text-sm mt-1">Classrooms</div>
            </div>
            <div className="text-center border-x border-[#e2e8f0]">
              <div className="text-4xl font-black text-gradient-cyan">500K+</div>
              <div className="text-[#64748b] text-sm mt-1">Students Engaged</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gradient-coral">1M+</div>
              <div className="text-[#64748b] text-sm mt-1">Questions Answered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#e2e8f0] py-8 text-center text-[#64748b] text-sm bg-white/80 backdrop-blur-sm">
        <p>© 2026 ClassDash. Making learning fun, one question at a time.</p>
      </footer>
    </main>
  );
}
