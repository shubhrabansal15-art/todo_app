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
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task)}
          disabled={saving}
        />
        <div className="task-edit-form">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            placeholder="Title"
            disabled={saving}
          />
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            placeholder="Description (optional)"
            disabled={saving}
          />
          <div className="edit-fields">
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
              disabled={saving}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <select
              value={editData.status}
              onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              disabled={saving}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <input
              type="date"
              value={editData.due_date}
              onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="edit-actions">
            <button onClick={handleEditSave} disabled={saving || !editData.title.trim()}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={handleEditCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="task-item">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
      />
      <div className="task-content">
        <div className="task-header">
          <strong
            style={{
              textDecoration: task.completed ? "line-through" : "none",
              opacity: task.completed ? 0.6 : 1,
            }}
          >
            {task.title}
          </strong>
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
            Due: {formatDate(task.due_date)}
            {isOverdue() && " (overdue)"}
          </div>
        )}
      </div>

      <div className="task-actions">
        <button onClick={handleEditStart}>Edit</button>
        <button onClick={() => onDelete(task.id)} className="delete-btn">
          Delete
        </button>
      </div>
    </li>
  );
}

export default TaskItem;