import { useState } from 'react';
import { updateProject } from '../api/projects';

const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#3b82f6', '#6b7280', '#14b8a6', '#f97316',
];

const PROJECT_ICONS = ['📁', '🚀', '🎯', '💡', '🔧', '📊', '🏠', '🎨', '📝', '⚡', '🌟', '🛠️'];

function ProjectForm({ project, onSave, onCancel }) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [priority, setPriority] = useState(project?.priority || 'medium');
  const [startDate, setStartDate] = useState(project?.start_date || '');
  const [dueDate, setDueDate] = useState(project?.due_date || '');
  const [color, setColor] = useState(project?.color || '#6366f1');
  const [icon, setIcon] = useState(project?.icon || '📁');
  const [saving, setSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  const isEditing = !!project;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setShowError(true);
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        priority,
        start_date: startDate || null,
        due_date: dueDate || null,
        color,
        icon,
      };

      if (isEditing) {
        const updated = await updateProject(project.id, data);
        onSave(updated);
      } else {
        onSave(data);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="project-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (showError) setShowError(false);
          }}
          placeholder="My project"
          disabled={saving}
          className={showError ? 'input-error' : ''}
          autoFocus
        />
        {showError && <span className="validation-error">Name is required</span>}
      </div>

      <div className="form-row">
        <label className="form-label">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          disabled={saving}
        />
      </div>

      <div className="form-row form-row-inline">
        <label className="form-field">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={saving}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="form-field">
          <span>Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} disabled={saving}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>

        <label className="form-field">
          <span>Start Date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={saving} />
        </label>

        <label className="form-field">
          <span>Due Date</span>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving} />
        </label>
      </div>

      <div className="form-row">
        <label className="form-label">Color</label>
        <div className="color-picker">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">Icon</label>
        <div className="icon-picker">
          {PROJECT_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              className={`icon-swatch ${icon === i ? 'selected' : ''}`}
              onClick={() => setIcon(i)}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
          {saving ? 'Saving...' : isEditing ? 'Update Project' : 'Create Project'}
        </button>
      </div>
    </form>
  );
}

export default ProjectForm;
