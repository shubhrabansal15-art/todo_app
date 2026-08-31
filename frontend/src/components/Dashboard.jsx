function Dashboard({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const inProgress = tasks.filter((t) => t.status === "in_progress" && !t.completed).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.completed) return false;
    const due = new Date(t.due_date + "T00:00:00");
    return due < today;
  }).length;

  const todo = tasks.filter((t) => t.status === "todo" && !t.completed).length;
  const done = tasks.filter((t) => t.status === "done" || t.completed).length;

  return (
    <div className="dashboard">
      <div className="stat-card">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat-card stat-todo">
        <span className="stat-value">{todo}</span>
        <span className="stat-label">To Do</span>
      </div>
      <div className="stat-card stat-progress">
        <span className="stat-value">{inProgress}</span>
        <span className="stat-label">In Progress</span>
      </div>
      <div className="stat-card stat-done">
        <span className="stat-value">{done}</span>
        <span className="stat-label">Done</span>
      </div>
      {overdue > 0 && (
        <div className="stat-card stat-overdue">
          <span className="stat-value">{overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
