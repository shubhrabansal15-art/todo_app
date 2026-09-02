import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

function sortByPriority(tasks) {
  return [...tasks].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4));
}

function TodayView({ tasks, loading, error, onToggle, onDelete, onPatch }) {
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

  const today = new Date().toISOString().split('T')[0];

  const overdue = sortByPriority(tasks.filter((t) => {
    if (!t.due_date || t.completed) return false;
    return t.due_date < today;
  }));

  const dueToday = sortByPriority(tasks.filter((t) => {
    if (t.completed) return false;
    return t.due_date === today;
  }));

  const urgentNoDate = sortByPriority(tasks.filter(
    (t) => !t.due_date && !t.completed && t.priority === 'urgent'
  ));

  const inProgressNoDueDate = sortByPriority(tasks.filter(
    (t) => !t.due_date && !completed(t) && t.status === 'in_progress' && t.priority !== 'urgent'
  ));

  const regularTasks = sortByPriority(tasks.filter(
    (t) => !t.due_date && !completed(t) && t.status !== 'in_progress' && t.priority !== 'urgent'
  ));

  const totalVisible = overdue.length + dueToday.length + urgentNoDate.length + inProgressNoDueDate.length + regularTasks.length;

  return (
    <>
      <div className="view-header">
        <h2>Today</h2>
        <p>{formatDate(today)} &middot; {totalVisible} task{totalVisible !== 1 ? 's' : ''}</p>
      </div>

      {totalVisible === 0 ? (
        <EmptyState
          title="All caught up!"
          description="No tasks need your attention today. Enjoy your free time or create a new task."
          icon="check"
        />
      ) : (
        <div className="tasks-section">
          {overdue.length > 0 && (
            <>
              <div className="tasks-section-header">
                <h2>Overdue</h2>
                <span className="task-count" style={{ color: 'var(--color-danger)' }}>{overdue.length}</span>
              </div>
              <div className="task-list">
                {overdue.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </>
          )}

          {dueToday.length > 0 && (
            <>
              <div className="tasks-section-header">
                <h2>Due Today</h2>
                <span className="task-count">{dueToday.length}</span>
              </div>
              <div className="task-list">
                {dueToday.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </>
          )}

          {urgentNoDate.length > 0 && (
            <>
              <div className="tasks-section-header">
                <h2>Urgent</h2>
                <span className="task-count" style={{ color: 'var(--priority-urgent)' }}>{urgentNoDate.length}</span>
              </div>
              <div className="task-list">
                {urgentNoDate.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </>
          )}

          {inProgressNoDueDate.length > 0 && (
            <>
              <div className="tasks-section-header">
                <h2>In Progress</h2>
                <span className="task-count">{inProgressNoDueDate.length}</span>
              </div>
              <div className="task-list">
                {inProgressNoDueDate.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </>
          )}

          {regularTasks.length > 0 && (
            <>
              <div className="tasks-section-header">
                <h2>Tasks</h2>
                <span className="task-count">{regularTasks.length}</span>
              </div>
              <div className="task-list">
                {regularTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function completed(task) {
  return task.completed || task.status === 'done';
}

export default TodayView;
