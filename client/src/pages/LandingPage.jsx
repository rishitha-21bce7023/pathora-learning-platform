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
      <Link to="/" className="text-lg font-bold text-white">Pathora</Link>
      <div className="flex gap-3">
        <Link to="/login" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-cyan-400">
          Login
        </Link>
        <Link to="/register" className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
          Get started
        </Link>
      </div>
    </nav>

    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Learn. Practice. Ship.</p>
        <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-tight text-white md:text-6xl">
          A focused learning workspace for mastering code one milestone at a time.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-300">
          Pathora combines roadmaps, notes, quizzes, coding challenges, compiler runs, streaks, and admin content tools in a single MERN learning platform.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300">
            Start learning
          </Link>
          <Link to="/login" className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-100 hover:border-cyan-400">
            Open dashboard
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-cyan-950/30">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-sm text-slate-300">Today’s path</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Python Learning Path</h2>
          <div className="mt-5 space-y-3">
            {['Read notes', 'Solve quiz', 'Run code', 'Submit challenge'].map((item, index) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3">
                <span className="text-sm text-slate-200">{item}</span>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-100">Step {index + 1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
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
