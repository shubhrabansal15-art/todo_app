function Sidebar({ currentView, onNavigate, user, tasks, onLogout }) {
  const todayCount = getTodayCount(tasks);
  const overdueCount = getOverdueCount(tasks);

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Taskflow</h1>
        <p>Productivity Dashboard</p>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Views</div>

        <button
          className={`sidebar-link ${currentView === 'today' ? 'active' : ''}`}
          onClick={() => onNavigate('today')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Today
          {todayCount > 0 && <span className="nav-badge">{todayCount}</span>}
        </button>

        <button
          className={`sidebar-link ${currentView === 'upcoming' ? 'active' : ''}`}
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
          className={`sidebar-link ${currentView === 'all' ? 'active' : ''}`}
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
          All Tasks
          <span className="nav-badge">{tasks.length}</span>
        </button>

        <button
          className={`sidebar-link ${currentView === 'reminders' ? 'active' : ''}`}
          onClick={() => onNavigate('reminders')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          Reminders
        </button>

        <div className="sidebar-section-label">Organize</div>

        <button
          className={`sidebar-link ${currentView === 'projects' ? 'active' : ''}`}
          onClick={() => onNavigate('projects')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          Projects
        </button>

        <button
          className={`sidebar-link ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
          Settings
        </button>
      </nav>

      <div className="sidebar-stats">
        {overdueCount > 0 && (
          <div className="sidebar-stat-row">
            <span>Overdue</span>
            <span style={{ color: '#C86666' }}>{overdueCount}</span>
          </div>
        )}
        {getUrgentCount(tasks) > 0 && (
          <div className="sidebar-stat-row">
            <span>Urgent</span>
            <span style={{ color: '#B95757' }}>{getUrgentCount(tasks)}</span>
          </div>
        )}
        <div className="sidebar-stat-row">
          <span>Total tasks</span>
          <span>{tasks.length}</span>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">
          {user?.email?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-email">{user?.email}</div>
          <div className="sidebar-user-label">Account</div>
        </div>
        <button className="btn-icon" onClick={onLogout} title="Sign out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

function getTodayCount(tasks) {
  const today = new Date().toISOString().split('T')[0];
  return tasks.filter(
    (t) => !t.completed && (t.due_date === today || (!t.due_date && t.status === 'todo'))
  ).length;
}

function getUrgentCount(tasks) {
  return tasks.filter((t) => t.priority === 'urgent' && !t.completed).length;
}

function getOverdueCount(tasks) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return tasks.filter((t) => {
    if (!t.due_date || t.completed) return false;
    const due = new Date(t.due_date + 'T00:00:00');
    return due < today;
  }).length;
}

export default Sidebar;
