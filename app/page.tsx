'use client';

import Link from 'next/link';

export default function Home() {
  const features = [
    {
      icon: '📊',
      title: 'Live Polls',
      desc: 'Create instant polls and see real-time results from your classroom.'
    },
    {
      icon: '🎯',
      title: 'Quick Quizzes',
      desc: 'Assess understanding with timed quizzes and automatic grading.'
    },
    {
      icon: '🎮',
      title: 'Game Mode',
      desc: 'Turn learning into competition with leaderboards and rewards.'
    },
    {
      icon: '📈',
      title: 'Analytics',
      desc: 'Track progress and identify students who need extra help.'
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-violet/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-cyan/15 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-gradient-to-br from-violet to-violet-dark rounded-xl flex items-center justify-center text-2xl shadow-lg">
            🚀
          </div>
          <div>
            <div className="text-2xl font-bold text-white whitespace-nowrap">Trainer-Toolbox</div>
            <div className="text-sm text-text-muted">Training Tools Platform</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold whitespace-nowrap text-white hover:text-violet-light transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-bold whitespace-nowrap text-white bg-gradient-to-r from-coral to-gold hover:from-coral-light hover:to-gold-light rounded-lg shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5"
          >
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 pt-16 pb-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet/20 border border-violet/30 text-violet-light text-sm font-semibold mb-8">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
              Trusted by 2,500+ Teachers
            </div>

            <h1 className="text-6xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Make Learning{' '}
              <span className="text-gradient">
                Unforgettable
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-text-muted mb-8 leading-relaxed">
              Engage your students with live polls, quizzes, and interactive games.
              Transform your classroom into an exciting learning experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="px-10 py-5 text-center font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-10 py-5 text-center font-semibold text-white border border-white/20 rounded-xl hover:bg-white/5 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-r from-violet/20 to-cyan/20 rounded-2xl blur-2xl"></div>
            <div className="relative bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
              {/* Mock Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-violet rounded-lg flex items-center justify-center text-white text-sm">
                    📊
                  </div>
                  <span className="text-white font-semibold">Live Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                  <span className="text-success text-sm">32 Students</span>
                </div>
              </div>

              {/* Mock Question */}
              <div className="bg-[#0f172a]/50 rounded-xl p-4 mb-4">
                <p className="text-text-muted text-xs mb-2">Current Question</p>
                <p className="text-white font-medium">What is the capital of France?</p>
              </div>

              {/* Mock Answer Options */}
              <div className="space-y-3">
                {[
                  { letter: 'A', text: 'London', votes: 2, color: 'bg-danger/20' },
                  { letter: 'B', text: 'Paris', votes: 28, color: 'bg-success/20', correct: true },
                  { letter: 'C', text: 'Berlin', votes: 1, color: 'bg-danger/20' },
                  { letter: 'D', text: 'Madrid', votes: 1, color: 'bg-danger/20' }
                ].map((option, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg ${option.color} border ${option.correct ? 'border-success/50' : 'border-transparent'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${option.correct ? 'bg-success text-white' : 'bg-white/10 text-text-muted'}`}>
                        {option.letter}
                      </span>
                      <span className={option.correct ? 'text-success' : 'text-white/80'}>
                        {option.text}
                      </span>
                    </div>
                    <span className="text-white/60 text-sm">{option.votes} votes</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-6xl font-bold text-white mb-4">
            Everything You Need to{' '}
            <span className="text-gradient-violet">
              Engage Students
            </span>
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Powerful tools designed for modern classrooms
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-violet/50 hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-20 h-20 mb-4 rounded-xl bg-gradient-to-br from-violet/20 to-cyan/20 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white whitespace-nowrap mb-2">{feature.title}</h3>
              <p className="text-white/70 text-base leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl sm:text-6xl font-black text-white mb-2">10K+</div>
              <div className="text-sm text-text-muted uppercase tracking-wide">Classrooms</div>
            </div>
            <div className="sm:border-x border-white/10">
              <div className="text-5xl sm:text-6xl font-black text-white mb-2">500K+</div>
              <div className="text-sm text-text-muted uppercase tracking-wide">Students</div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-black text-white mb-2">1M+</div>
              <div className="text-sm text-text-muted uppercase tracking-wide">Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-6xl font-bold text-white mb-6">
            Ready to Transform Your Classroom?
          </h2>
          <p className="text-text-muted text-lg mb-8">
            Join thousands of teachers who are making learning more engaging.
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet to-violet-dark rounded-xl shadow-lg shadow-violet/30 hover:shadow-violet/50 transition-all hover:-translate-y-1"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="container mx-auto px-6 text-center text-white/60 text-sm">
          <p>© 2026 Trainer-Toolbox. Making learning fun, one question at a time.</p>
        </div>
      </footer>
    </main>
  );
}
