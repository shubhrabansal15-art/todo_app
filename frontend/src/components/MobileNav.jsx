function MobileNav({ currentView, onNavigate }) {
  return (
    <nav className="mobile-nav">
      <div className="mobile-nav-inner">
        <button
          className={`mobile-nav-btn ${currentView === 'today' ? 'active' : ''}`}
          onClick={() => onNavigate('today')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Today
        </button>

        <button
          className={`mobile-nav-btn ${currentView === 'upcoming' ? 'active' : ''}`}
          onClick={() => onNavigate('upcoming')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Upcoming
        </button>

        <button
          className={`mobile-nav-btn ${currentView === 'all' ? 'active' : ''}`}
          onClick={() => onNavigate('all')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          All
        </button>

        <button
          className={`mobile-nav-btn ${currentView === 'reminders' ? 'active' : ''}`}
          onClick={() => onNavigate('reminders')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Reminders
        </button>

        <button
          className={`mobile-nav-btn ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => onNavigate('projects')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projects
        </button>
      </div>
    </nav>
  );
}

export default MobileNav;
