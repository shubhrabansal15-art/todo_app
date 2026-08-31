function ProjectsPlaceholder() {
  return (
    <div className="projects-placeholder">
      <div className="view-header">
        <h2>Projects</h2>
      </div>
      <div className="placeholder-card">
        <div className="placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h3>Projects are coming soon</h3>
        <p>
          Organize your tasks into projects to better manage your work.
          Group related tasks, set project deadlines, and track progress at a glance.
        </p>
        <div className="feature-coming-soon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Coming soon
        </div>
      </div>
    </div>
  );
}

export default ProjectsPlaceholder;
