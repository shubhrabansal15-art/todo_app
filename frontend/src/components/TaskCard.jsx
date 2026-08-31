import { useState } from 'react';

function TaskCard({ task, onToggle, onDelete, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || '',
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || '',
  });
  const [saving, setSaving] = useState(false);

  function handleEditStart() {
    setEditData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || '',
    });
    setEditing(true);
  }

  function handleEditCancel() {
    setEditing(false);
  }

  async function handleEditSave() {
    if (!editData.title.trim()) return;
    setSaving(true);
    try {
      await onPatch(task.id, {
        title: editData.title.trim(),
        description: editData.description.trim() || null,
        priority: editData.priority,
        status: editData.status,
        due_date: editData.due_date || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function isOverdue() {
    if (!task.due_date || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date + 'T00:00:00');
    return due < today;
  }

  if (editing) {
    return (
      <div className="task-card task-card-editing">
        <div className="task-edit-form">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Task title"
            disabled={saving}
            className="task-edit-title"
          />
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description (optional)"
            disabled={saving}
          />
          <div className="task-edit-fields">
            <label className="form-field">
              <span>Priority</span>
              <select value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })} disabled={saving}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="form-field">
              <span>Status</span>
              <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })} disabled={saving}>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
            <label className="form-field">
              <span>Due Date</span>
              <input type="date" value={editData.due_date} onChange={(e) => setEditData({ ...editData, due_date: e.target.value })} disabled={saving} />
            </label>
          </div>
          <div className="task-edit-actions">
            <button className="btn-cancel" onClick={handleEditCancel} disabled={saving}>Cancel</button>
            <button className="btn-save" onClick={handleEditSave} disabled={saving || !editData.title.trim()}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const classNames = [
    'task-card',
    task.completed ? 'task-card-completed' : '',
    isOverdue() ? 'task-card-overdue' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className={`task-card-priority task-card-priority-${task.priority}`} />

      <input
        type="checkbox"
        className="task-card-checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
      />

      <div className="task-card-body">
        <div className="task-card-header">
          <span className="task-card-title">{task.title}</span>
          <div className="task-card-badges">
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
          </div>
        </div>

        {task.description && (
          <div className="task-card-description">{task.description}</div>
        )}

        <div className="task-card-meta">
          {task.due_date && (
            <span className={`task-card-due ${isOverdue() ? 'task-card-due-overdue' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              {formatDate(task.due_date)}
              {isOverdue() && <span className="overdue-pill">overdue</span>}
            </span>
          )}
        </div>
      </div>

      <div className="task-card-actions">
        <button className="task-card-action" onClick={handleEditStart} title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
        </button>
        <button className="task-card-action task-card-action-delete" onClick={() => onDelete(task.id)} title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TaskCard;
