function Dashboard({ tasks, reminders = [] }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const inProgress = tasks.filter((t) => t.status === "in_progress" && !t.completed).length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.completed) return false;
    const due = new Date(t.due_date + "T00:00:00");
    return due < today;
  }).length;

  const dueToday = tasks.filter((t) => {
    if (t.completed) return false;
    return t.due_date === todayStr;
  }).length;

  const urgent = tasks.filter((t) => t.priority === "urgent" && !t.completed).length;

  const todo = tasks.filter((t) => t.status === "todo" && !t.completed).length;
  const done = tasks.filter((t) => t.status === "done" || t.completed).length;

  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

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
        <span className="stat-value">{completionRate}%</span>
        <span className="stat-label">Done</span>
      </div>
      {overdue > 0 && (
        <div className="stat-card stat-overdue">
          <span className="stat-value">{overdue}</span>
          <span className="stat-label">Overdue</span>
        </div>
      )}
      {urgent > 0 && (
        <div className="stat-card stat-urgent">
          <span className="stat-value">{urgent}</span>
          <span className="stat-label">Urgent</span>
        </div>
      )}
      {dueToday > 0 && (
        <div className="stat-card stat-due-today">
          <span className="stat-value">{dueToday}</span>
          <span className="stat-label">Due Today</span>
        </div>
      )}
      {(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const overdueReminders = reminders.filter(
          (r) => r.status === 'pending' && r.reminder_date < todayStr
        ).length;
        const todayReminders = reminders.filter(
          (r) => r.status === 'pending' && r.reminder_date === todayStr
        ).length;
        return (
          <>
            {overdueReminders > 0 && (
              <div className="stat-card stat-overdue">
                <span className="stat-value">{overdueReminders}</span>
                <span className="stat-label">Overdue Reminders</span>
              </div>
            )}
            {todayReminders > 0 && (
              <div className="stat-card stat-due-today">
                <span className="stat-value">{todayReminders}</span>
                <span className="stat-label">Reminders Today</span>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}

export default Dashboard;
