import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';

function UpcomingView({ tasks, loading, error, onToggle, onDelete, onPatch }) {
  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span className="loading-text">Loading tasks...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {error}
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = tasks.filter((t) => {
    if (!t.due_date || t.completed) return false;
    const due = new Date(t.due_date + 'T00:00:00');
    return due >= today;
  });

  const grouped = {};
  upcoming.forEach((task) => {
    if (!grouped[task.due_date]) grouped[task.due_date] = [];
    grouped[task.due_date].push(task);
  });

  const sortedDates = Object.keys(grouped).sort();

  return (
    <>
      <div className="view-header">
        <h2>Upcoming</h2>
        <p>{upcoming.length} task{upcoming.length !== 1 ? 's' : ''} with due dates</p>
      </div>

      {sortedDates.length === 0 ? (
        <EmptyState
          title="Nothing upcoming"
          description="No tasks with future due dates. Add due dates to see them here."
          icon="calendar"
        />
      ) : (
        <div className="tasks-section">
          {sortedDates.map((dateStr) => (
            <div key={dateStr}>
              <div className="tasks-section-header">
                <h2>{formatDayLabel(dateStr, today)}</h2>
                <span className="task-count">{grouped[dateStr].length}</span>
              </div>
              <div className="task-list">
                {grouped[dateStr].map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function formatDayLabel(dateStr, today) {
  const date = new Date(dateStr + 'T12:00:00');
  const diff = Math.round((date - today) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default UpcomingView;
