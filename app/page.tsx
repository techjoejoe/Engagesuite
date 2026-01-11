import Link from 'next/link';
import Button from '@/components/Button';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background Blobs - Vibrant & Fun */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#7C3AED]/40 rounded-full blur-[150px] animate-blob" />
        <div className="absolute top-[30%] right-[-15%] w-[45%] h-[45%] bg-[#06B6D4]/35 rounded-full blur-[130px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-15%] left-[25%] w-[50%] h-[50%] bg-[#F472B6]/30 rounded-full blur-[140px] animate-blob animation-delay-4000" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="text-2xl font-black tracking-tighter flex items-center gap-2">
          <span className="text-4xl">🚀</span>
          <span className="text-gradient">
            ClassDash
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="glass" size="md">
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="primary" className="glow-violet">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-4 pt-12 pb-20 text-center">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-[#7C3AED]/20 border border-[#A78BFA]/40 text-[#ffffff] text-sm font-bold tracking-wide uppercase animate-fade-in-up backdrop-blur-sm">
          ✨ The Ultimate Classroom Companion
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight text-[#ffffff] animate-fade-in-up delay-100">
          Make Learning <br />
          <span className="text-gradient animate-gradient-x">
            Unforgettable
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-[#ffffff]/70 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Engage your students directly on their devices with live polls, quizzes, and interactive games.
          Turn every lesson into an adventure.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
          <Link href="/signup">
            <Button variant="secondary" size="lg" className="glow-cyan">
              🚀 Start Free
            </Button>
          </Link>
          <Link href="/join">
            <Button variant="primary" size="lg">
              🎮 Join a Game
            </Button>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto animate-fade-in-up delay-500">
          {[
            { icon: '⚡', title: 'QuizBattle', desc: 'Competitive trivia games', color: 'from-[#7C3AED] to-[#A78BFA]' },
            { icon: '📊', title: 'LiveVote', desc: 'Real-time polling', color: 'from-[#06B6D4] to-[#22D3EE]' },
            { icon: '📸', title: 'PicPick', desc: 'Photo challenges', color: 'from-[#F472B6] to-[#F9A8D4]' },
            { icon: '☁️', title: 'WordStorm', desc: 'Collaborative clouds', color: 'from-[#FBBF24] to-[#FCD34D]' }
          ].map((feature, i) => (
            <div key={i} className="group glass-card glass-card-hover p-6 flex flex-col items-center text-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-[#ffffff] mb-2">{feature.title}</h3>
              <p className="text-[#94A3B8]">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 glass-card-strong p-8 max-w-4xl mx-auto animate-fade-in-up delay-500">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-black text-gradient-violet">10K+</div>
              <div className="text-[#94A3B8] text-sm mt-1">Classrooms</div>
            </div>
            <div className="text-center border-x border-[#ffffff]/20">
              <div className="text-4xl font-black text-gradient-cyan">500K+</div>
              <div className="text-[#94A3B8] text-sm mt-1">Students Engaged</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-gradient-coral">1M+</div>
              <div className="text-[#94A3B8] text-sm mt-1">Questions Answered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#ffffff]/10 py-8 text-center text-[#94A3B8] text-sm">
        <p>© 2026 ClassDash. Making learning fun, one question at a time.</p>
      </footer>
    </main>
  );
}
