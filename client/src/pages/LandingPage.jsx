import { Link } from 'react-router-dom';

const features = [
  { title: 'Roadmaps', icon: '🗺️', text: 'Structured learning paths with topic progress and milestones.' },
  { title: 'Notes', icon: '📝', text: 'PDF notes attached directly to each roadmap topic.' },
  { title: 'Practice', icon: '🎯', text: 'Quizzes, explanations, and external practice links in one place.' },
  { title: 'Compiler', icon: '💻', text: 'Run Python snippets and coding challenges from the browser.' },
  { title: 'Streaks', icon: '🔥', text: 'XP, badges, goals, and streak calendars keep momentum visible.' },
];

const LandingPage = () => (
  <main className="min-h-screen bg-slate-950 text-slate-100">
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
        <span>Pathora</span>
        <span className="rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">✨</span>
      </Link>
      <div className="flex gap-3">
        <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-emerald-400">
          Login
        </Link>
        <Link to="/register" className="rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-200">
          Get started
        </Link>
      </div>
    </nav>

    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">Learn. Practice. Ship.</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl">
          A focused learning workspace for mastering code, one bright milestone at a time.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Pathora combines roadmaps, notes, quizzes, coding challenges, compiler runs, streaks, and admin content tools in a single MERN learning platform.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-xl bg-amber-300 px-5 py-3 font-semibold text-slate-950 hover:bg-amber-200">
            Start learning
          </Link>
          <Link to="/login" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 hover:border-emerald-400">
            Open dashboard
          </Link>
        </div>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
          {['⚡ 25 XP', '🌿 Daily streak', '🏆 New badges'].map((item) => (
            <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-400/20 bg-slate-900 p-5 shadow-2xl shadow-emerald-950/30">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-emerald-400/10 p-4 text-center text-3xl">🌱</div>
            <div className="rounded-2xl bg-amber-300/10 p-4 text-center text-3xl">⭐</div>
            <div className="rounded-2xl bg-cyan-400/10 p-4 text-center text-3xl">💎</div>
          </div>
          <p className="text-sm text-slate-300">Today's path</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Python Learning Path</h2>
          <div className="mt-5 space-y-3">
            {['Read notes', 'Solve quiz', 'Run code', 'Submit challenge'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <span className="text-sm text-slate-200">{item}</span>
                <span className={`rounded-full px-3 py-1 text-xs ${index % 2 === 0 ? 'bg-emerald-500/10 text-emerald-100' : 'bg-amber-300/10 text-amber-100'}`}>Step {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:border-emerald-400/50 hover:bg-slate-900/80">
            <p className="text-2xl">{feature.icon}</p>
            <h3 className="mt-4 text-lg font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">{feature.text}</p>
          </div>
        ))}
      </div>
    </section>
  </main>
);

export default LandingPage;
