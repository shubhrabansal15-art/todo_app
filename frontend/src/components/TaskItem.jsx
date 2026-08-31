import { useState } from "react";

function TaskItem({ task, onToggle, onDelete, onPatch }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    due_date: task.due_date || "",
  });
  const [saving, setSaving] = useState(false);

  function handleEditStart() {
    setEditData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      due_date: task.due_date || "",
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
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function isOverdue() {
    if (!task.due_date || task.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.due_date + "T00:00:00");
    return due < today;
  }

  const priorityClass = `priority-badge priority-${task.priority}`;
  const statusClass = `status-badge status-${task.status}`;
  const statusLabel = task.status.replace("_", " ");

  if (editing) {
    return (
      <li className="task-item task-item-editing">
        <div className="priority-bar priority-bar-editing" />
        <div className="task-main">
          <div className="task-edit-form">
            <div className="edit-form-row">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task)}
                disabled={saving}
              />
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="Title"
                disabled={saving}
                className="edit-title"
              />
            </div>
            <input
              type="text"
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              placeholder="Description (optional)"
              disabled={saving}
              className="edit-description"
            />
            <div className="edit-fields">
              <label>
                Priority
                <select
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                  disabled={saving}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                  disabled={saving}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label>
                Due Date
                <input
                  type="date"
                  value={editData.due_date}
                  onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
                  disabled={saving}
                />
              </label>
            </div>
            <div className="edit-actions">
              <button className="btn-save" onClick={handleEditSave} disabled={saving || !editData.title.trim()}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button className="btn-cancel" onClick={handleEditCancel} disabled={saving}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </li>
    );
  }

  const priorityBarClass = `priority-bar priority-bar-${task.priority}`;
  const taskItemClass = [
    "task-item",
    task.completed ? "task-completed" : "",
    isOverdue() ? "task-overdue" : "",
  ].filter(Boolean).join(" ");

  return (
    <li className={taskItemClass}>
      <div className={priorityBarClass} />
      <div className="task-main">
        <div className="task-top-row">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
          />
          <div className="task-content">
            <div className="task-header">
              <span className="task-title">{task.title}</span>
              <div className="task-badges">
                <span className={priorityClass}>{task.priority}</span>
                <span className={statusClass}>{statusLabel}</span>
              </div>
            </div>

            {task.description && (
              <div className="task-description">{task.description}</div>
            )}

            {task.due_date && (
              <div className={`task-due-date ${isOverdue() ? "overdue" : ""}`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                Due {formatDate(task.due_date)}
                {isOverdue() && <span className="overdue-label">overdue</span>}
              </div>
            )}
          </div>
        </div>

        <div className="task-actions">
          <button onClick={handleEditStart} className="btn-edit">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Edit
          </button>
          <button onClick={() => onDelete(task.id)} className="btn-delete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}

export default TaskItem;