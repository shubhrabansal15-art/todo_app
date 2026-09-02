import { useState } from 'react';
import { updateReminder } from '../api/reminders';

function ReminderForm({ reminder, tasks, projects, onSave, onCancel }) {
  const [title, setTitle] = useState(reminder?.title || '');
  const [description, setDescription] = useState(reminder?.description || '');
  const [reminderDate, setReminderDate] = useState(reminder?.reminder_date || new Date().toISOString().split('T')[0]);
  const [reminderTime, setReminderTime] = useState(reminder?.reminder_time ? reminder.reminder_time.slice(0, 5) : '');
  const [taskId, setTaskId] = useState(reminder?.task_id || '');
  const [projectId, setProjectId] = useState(reminder?.project_id || '');
  const [saving, setSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  const isEditing = !!reminder;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setShowError(true);
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim() || null,
        reminder_date: reminderDate,
        reminder_time: reminderTime ? reminderTime + ':00' : null,
        task_id: taskId || null,
        project_id: projectId || null,
      };

      if (isEditing) {
        const updated = await updateReminder(reminder.id, data);
        onSave(updated);
      } else {
        onSave(data);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <label className="form-label">Reminder Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (showError) setShowError(false);
          }}
          placeholder="What do you want to be reminded about?"
          disabled={saving}
          className={showError ? 'input-error' : ''}
          autoFocus
        />
        {showError && <span className="validation-error">Title is required</span>}
      </div>

      <div className="form-row">
        <label className="form-label">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional details"
          disabled={saving}
        />
      </div>

      <div className="form-row form-row-inline">
        <label className="form-field">
          <span>Date</span>
          <input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} disabled={saving} />
        </label>

        <label className="form-field">
          <span>Time</span>
          <input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} disabled={saving} />
        </label>

        {tasks && tasks.length > 0 && (
          <label className="form-field">
            <span>Link Task</span>
            <select value={taskId} onChange={(e) => setTaskId(e.target.value || '')} disabled={saving}>
              <option value="">None</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </label>
        )}

        {projects && projects.length > 0 && (
          <label className="form-field">
            <span>Link Project</span>
            <select value={projectId} onChange={(e) => setProjectId(e.target.value || '')} disabled={saving}>
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving || !title.trim()}>
          {saving ? 'Saving...' : isEditing ? 'Update Reminder' : 'Create Reminder'}
        </button>
      </div>
    </form>
  );
}

export default ReminderForm;
