import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectMatch } from '../../redux/slices/matchSlice';

const navItems = [
  { to: '/',          label: 'Setup',     icon: '⚙️' },
  { to: '/live',      label: 'Live',      icon: '🏏' },
  { to: '/scorecard', label: 'Scorecard', icon: '📋' },
  { to: '/history',   label: 'History',   icon: '📜' },
];

export default function Layout({ children }) {
  const { status } = useSelector(selectMatch);

  return (
    <div className="flex flex-col min-h-dvh bg-surface max-w-xl mx-auto w-full overflow-x-hidden">

      {/* ── Header ── */}
      <header
        className="bg-surface-2 border-b border-surface-4 px-4 flex items-center justify-between h-12 flex-shrink-0 sticky top-0 z-40 w-full"
        style={{ boxShadow: '0 0 20px rgba(0,255,136,0.08)' }}
      >
        {/* Logo — always visible */}
        <span className="font-display text-lg neon-text tracking-widest whitespace-nowrap">
          🏏 CRICKET LIVE
        </span>

        {/* Nav tabs — only on sm+ screens (≥ 640 px) */}
        <nav className="hidden sm:flex gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `nav-tab text-[13px] ${isActive ? 'active' : ''} ${
                  to === '/live' && status !== 'live' ? 'opacity-40 pointer-events-none' : ''
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 w-full overflow-x-hidden pb-16 sm:pb-0">
        {/* pb-16 reserves space for the mobile bottom bar */}
        {children}
      </main>

      {/* ── Footer (desktop only) ── */}
      <footer className="hidden sm:block bg-surface-2 border-t border-surface-4 py-2 text-center text-[10px] text-gray-600 font-display tracking-wider w-full">
        CRICKET LIVE SCORE &nbsp;·&nbsp; BALL BY BALL
      </footer>

      {/* ── Bottom Tab Bar (mobile only, < 640 px) ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch w-full max-w-xl mx-auto"
        style={{
          background: '#060f09',
          borderTop: '1px solid #152b1a',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.6), 0 -1px 0 rgba(0,255,136,0.08)',
          paddingBottom: 'var(--safe-bottom, 0px)',
        }}
      >
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-center transition-all duration-150 ${
                to === '/live' && status !== 'live'
                  ? 'opacity-30 pointer-events-none'
                  : ''
              } ${isActive ? 'tab-active' : 'tab-idle'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className="text-lg leading-none">{icon}</span>
                <span
                  className="text-[10px] font-display tracking-wider leading-none"
                  style={{ color: isActive ? 'var(--neon-green)' : '#6b7280' }}
                >
                  {label}
                </span>
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--neon-green)', boxShadow: '0 0 8px var(--neon-green)' }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
