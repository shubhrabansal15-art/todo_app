import { useState, useEffect, useCallback } from 'react';
import {
  getReminders,
  createReminder,
  patchReminder,
  deleteReminder,
} from '../api/reminders';
import { getTasks } from '../api/tasks';
import { getProjects } from '../api/projects';
import ReminderForm from '../components/ReminderForm';
import EmptyState from '../components/EmptyState';

function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('pending');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [remindersData, tasksData, projectsData] = await Promise.all([
        getReminders(),
        getTasks(),
        getProjects(),
      ]);
      setReminders(remindersData);
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') return;
      setError('Could not load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate(data) {
    try {
      const reminder = await createReminder(data);
      setReminders((prev) => [reminder, ...prev]);
      setShowCreateForm(false);
    } catch {
      setError('Failed to create reminder');
    }
  }

  async function handleUpdate(id, data) {
    try {
      const updated = await patchReminder(id, data);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingReminder(null);
    } catch {
      setError('Failed to update reminder');
    }
  }

  async function handleComplete(id) {
    await handleUpdate(id, { status: 'completed' });
  }

  async function handleDismiss(id) {
    await handleUpdate(id, { status: 'dismissed' });
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteReminder(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('Failed to delete reminder');
    }
  }

  const today = new Date().toISOString().split('T')[0];

  const overdue = reminders.filter(
    (r) => r.status === 'pending' && r.reminder_date < today
  );
  const dueToday = reminders.filter(
    (r) => r.status === 'pending' && r.reminder_date === today
  );
  const upcoming = reminders.filter(
    (r) => r.status === 'pending' && r.reminder_date > today
  );
  const completed = reminders.filter(
    (r) => r.status === 'completed' || r.status === 'dismissed'
  );

  const filteredReminders =
    filter === 'pending'
      ? [...overdue, ...dueToday, ...upcoming]
      : filter === 'overdue'
      ? overdue
      : filter === 'today'
      ? dueToday
      : filter === 'upcoming'
      ? upcoming
      : completed;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span className="loading-text">Loading reminders...</span>
      </div>
    );
  }

  return (
    <div className="reminders-page">
      <div className="view-header">
        <div className="view-header-row">
          <h2>Reminders</h2>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + New Reminder
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button className="error-banner-dismiss" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {showCreateForm && (
        <div className="reminder-form-wrapper">
          <ReminderForm
            tasks={tasks}
            projects={projects}
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingReminder && (
        <div className="reminder-form-wrapper">
          <ReminderForm
            reminder={editingReminder}
            tasks={tasks}
            projects={projects}
            onSave={(data) => handleUpdate(editingReminder.id, data)}
            onCancel={() => setEditingReminder(null)}
          />
        </div>
      )}

      <div className="reminder-status-tabs">
        {[
          { key: 'pending', label: 'Pending', count: overdue.length + dueToday.length + upcoming.length },
          { key: 'overdue', label: 'Overdue', count: overdue.length },
          { key: 'today', label: 'Today', count: dueToday.length },
          { key: 'upcoming', label: 'Upcoming', count: upcoming.length },
          { key: 'completed', label: 'Done', count: completed.length },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`project-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="project-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {filteredReminders.length === 0 && !showCreateForm && !editingReminder ? (
        <EmptyState
          title={filter === 'completed' ? 'No completed reminders' : 'All clear!'}
          description={filter === 'completed' ? 'Reminders you complete or dismiss will appear here.' : 'No reminders to show. Create one to stay on top of your tasks.'}
          icon="bell"
        />
      ) : (
        <div className="reminder-list">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              isOverdue={reminder.status === 'pending' && reminder.reminder_date < today}
              isToday={reminder.status === 'pending' && reminder.reminder_date === today}
              onEdit={() => setEditingReminder(reminder)}
              onComplete={() => handleComplete(reminder.id)}
              onDismiss={() => handleDismiss(reminder.id)}
              onDelete={() => handleDelete(reminder.id)}
              tasks={tasks}
              projects={projects}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReminderCard({ reminder, isOverdue, isToday, onEdit, onComplete, onDismiss, onDelete, tasks, projects }) {
  const linkedTask = tasks.find((t) => t.id === reminder.task_id);
  const linkedProject = projects.find((p) => p.id === reminder.project_id);
  const isCompleted = reminder.status === 'completed' || reminder.status === 'dismissed';

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  const classNames = [
    'reminder-card',
    isOverdue ? 'reminder-card-overdue' : '',
    isToday ? 'reminder-card-today' : '',
    isCompleted ? 'reminder-card-completed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="reminder-card-icon">
        {isCompleted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        ) : isOverdue ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        )}
      </div>

      <div className="reminder-card-body">
        <div className="reminder-card-header">
          <span className="reminder-card-title">{reminder.title}</span>
          {isOverdue && <span className="badge badge-urgent">overdue</span>}
          {isToday && <span className="badge badge-high">today</span>}
          {reminder.status === 'completed' && <span className="badge badge-done">completed</span>}
          {reminder.status === 'dismissed' && <span className="badge badge-medium">dismissed</span>}
        </div>

        {reminder.description && (
          <div className="reminder-card-description">{reminder.description}</div>
        )}

        <div className="reminder-card-meta">
          <span className="reminder-card-datetime">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDate(reminder.reminder_date)}
            {reminder.reminder_time && ` at ${formatTime(reminder.reminder_time)}`}
          </span>

          {linkedTask && (
            <span className="reminder-card-linked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              {linkedTask.title}
            </span>
          )}

          {linkedProject && (
            <span className="reminder-card-linked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              {linkedProject.name}
            </span>
          )}
        </div>
      </div>

      <div className="reminder-card-actions">
        {!isCompleted && (
          <>
            <button className="reminder-card-action" onClick={onComplete} title="Complete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            <button className="reminder-card-action" onClick={onDismiss} title="Dismiss">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </>
        )}
        <button className="reminder-card-action" onClick={onEdit} title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </button>
        <button className="reminder-card-action reminder-card-action-delete" onClick={onDelete} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default RemindersPage;
