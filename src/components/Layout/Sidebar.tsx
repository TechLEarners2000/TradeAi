import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: 'show_chart', label: 'Market' },
  { to: '/watchlist', icon: 'visibility', label: 'Watchlist' },
  { to: '/assistant', icon: 'smart_toy', label: 'AI Assistant' },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-surface-container-low border-r border-outline-variant flex flex-col py-stack-lg z-50">
      <div className="px-6 mb-8">
        <h1 className="text-headline-md font-bold text-secondary">AI Trader</h1>
        <p className="text-body-sm text-on-surface-variant">NSE/BSE Insights</p>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary font-bold bg-primary-container/30 border-r-2 border-primary'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 mb-1">
        <p className="px-3 text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">Resources</p>
      </div>
      <nav className="px-3 space-y-1 mb-4">
        {[
          { to: '/stocks', icon: 'dataset', label: 'All Stocks' },
          { to: '/faqs', icon: 'help', label: 'FAQs' },
        ].map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-body-sm ${
                isActive
                  ? 'text-primary font-bold bg-primary-container/30 border-r-2 border-primary'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-high'
              }`
            }
          >
            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-6 space-y-4">
        <div className="flex flex-col gap-1 pt-4">
          <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
          <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-primary transition-colors text-body-sm" href="#">
            <span className="material-symbols-outlined">help</span>
            <span>Support</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
