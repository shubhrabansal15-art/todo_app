function SettingsPage({ user, onLogout }) {
  return (
    <div className="settings-page">
      <div className="view-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-card">
        <h3>Account</h3>
        <div className="settings-row">
          <span className="settings-label">Email</span>
          <span className="settings-value">{user?.email}</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">User ID</span>
          <span className="settings-value" style={{ fontSize: "0.75rem", fontFamily: "monospace" }}>
            {user?.id?.slice(0, 8)}...
          </span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Member since</span>
          <span className="settings-value">
            {user?.created_at
              ? new Date(user.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "Unknown"}
          </span>
        </div>
      </div>

      <div className="settings-card">
        <h3>Actions</h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">Sign out of your account</div>
          </div>
          <button className="btn-danger" onClick={onLogout}>Sign Out</button>
        </div>
      </div>

      <div className="settings-card">
        <h3>About</h3>
        <div className="settings-row">
          <span className="settings-label">App</span>
          <span className="settings-value">Taskflow v4.0</span>
        </div>
        <div className="settings-row">
          <span className="settings-label">Stack</span>
          <span className="settings-value">React + Supabase</span>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
