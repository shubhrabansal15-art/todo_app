import { useState } from "react";

function TaskForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [showError, setShowError] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim()) {
      setShowError(true);
      return;
    }

    await onCreate({
      title: title.trim(),
      description: description.trim() || null,
      priority,
      status,
      due_date: dueDate || null,
    });

    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setDueDate("");
    setShowError(false);
    setShowDetails(false);
  }

  function handleTitleChange(e) {
    setTitle(e.target.value);
    if (showError && e.target.value.trim()) {
      setShowError(false);
    }
  }

  return (
    <div className="task-form-wrapper">
      <form onSubmit={handleSubmit} className="task-form">
        <div className="form-main-row">
          <div className="form-input-group">
            <input
              type="text"
              placeholder="What needs to be done?"
              value={title}
              onChange={handleTitleChange}
              className={showError ? "input-error" : ""}
            />
            {showError && (
              <span className="validation-error">Title is required</span>
            )}
          </div>
          <button type="submit" className="btn btn-primary">
            Add Task
          </button>
        </div>

        {!showDetails && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setShowDetails(true)}
          >
            + Add details
          </button>
        )}

        {showDetails && (
          <div className="form-details">
            <div className="form-row">
              <label className="form-label">Description</label>
              <input
                type="text"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row form-row-inline">
              <label className="form-label">
                Priority
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="form-label">
                Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </label>

              <label className="form-label">
                Due Date
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </label>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDetails(false)}
            >
              Fewer options
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export default TaskForm;