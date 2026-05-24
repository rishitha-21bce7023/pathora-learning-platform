import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

const baseLinkClasses =
  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition';

const activeLinkClasses = 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-400/20';
const inactiveLinkClasses = 'text-slate-300 hover:bg-slate-800 hover:text-white';

const DashboardLayout = ({
  user,
  title,
  subtitle,
  navItems,
  actions,
  children,
  onLogout,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const renderNav = () => (
    <div className="space-y-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4 md:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-emerald-950/30 md:block">
          <div className="space-y-6">
            <div>
              <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-emerald-300">
                <span>Pathora</span>
                <span className="tracking-normal text-amber-200">✨</span>
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{user?.role === 'admin' ? 'Admin workspace' : 'Student workspace'}</p>
              <p className="mt-1 text-sm text-slate-300">{user?.name}</p>
            </div>

            {renderNav()}

            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
              <p className="text-sm text-slate-300">Current focus</p>
              <p className="mt-2 text-sm font-semibold text-amber-100">{actions?.focus || 'Keep learning momentum strong'}</p>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <header className="rounded-3xl border border-slate-800 bg-slate-900/90 px-4 py-4 shadow-2xl shadow-emerald-950/30 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen((current) => !current)}
                  className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-100 md:hidden"
                >
                  ☰ Menu
                </button>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">{title}</p>
                  <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">{subtitle}</h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
                  {user?.role === 'admin' ? 'Admin access' : 'Student access'}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-400 hover:text-rose-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 bg-slate-950/80 md:hidden">
              <div className="absolute inset-y-0 left-0 w-72 border-r border-slate-800 bg-slate-900 p-5">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm uppercase tracking-[0.3em] text-emerald-300">
                    <span>Pathora</span>
                    <span className="tracking-normal text-amber-200">✨</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-100"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-6">{renderNav()}</div>
              </div>
            </div>
          ) : null}

          <main className="mt-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl shadow-emerald-950/30 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
