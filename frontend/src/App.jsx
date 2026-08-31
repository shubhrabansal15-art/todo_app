import { useEffect, useState, useCallback } from "react";
import {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
} from "./api/tasks";
import "./App.css";

import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import TaskFilters from "./components/TaskFilters";
import Dashboard from "./components/Dashboard";

const DEFAULT_FILTERS = {
  status: undefined,
  priority: undefined,
  completed: undefined,
  search: undefined,
  sort_by: "created_at",
  order: "desc",
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      setError("Could not connect to the API");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function handleFilterChange(newFilter) {
    setFilters((prev) => ({ ...prev, ...newFilter }));
  }

  async function handleCreate(taskData) {
    try {
      setError("");
      const newTask = await createTask(taskData);
      setTasks((currentTasks) => [...currentTasks, newTask]);
    } catch (err) {
      setError("Could not create task");
    }
  }

  async function handleToggle(task) {
    try {
      setError("");
      const updatedTask = await patchTask(task.id, { completed: !task.completed });
      setTasks((currentTasks) =>
        currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    } catch (err) {
      setError("Could not update task");
    }
  }

  async function handlePatch(taskId, data) {
    try {
      setError("");
      const updatedTask = await patchTask(taskId, data);
      setTasks((currentTasks) =>
        currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    } catch (err) {
      setError("Could not update task");
      throw err;
    }
  }

  async function handleDelete(taskId) {
    try {
      setError("");
      await deleteTask(taskId);
      setTasks((currentTasks) => currentTasks.filter((t) => t.id !== taskId));
    } catch (err) {
      setError("Could not delete task");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Todo Dashboard</h1>
        <p className="app-subtitle">Manage your tasks and stay on track</p>
      </header>

      <TaskForm onCreate={handleCreate} />

      {error && (
        <div className="error-message">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button className="btn-dismiss" onClick={() => setError("")}>×</button>
        </div>
      )}

      {!loading && tasks.length > 0 && <Dashboard tasks={tasks} />}

      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <div className="tasks-section">
        <div className="tasks-section-header">
          <h2>Tasks</h2>
          {!loading && tasks.length > 0 && (
            <span className="task-count">{tasks.length} total</span>
          )}
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p className="empty-title">
              {filters.search || filters.status || filters.priority
                ? "No matching tasks"
                : "No tasks yet"}
            </p>
            <p className="empty-subtitle">
              {filters.search || filters.status || filters.priority
                ? "Try adjusting your filters or search query"
                : "Create your first task to get started"}
            </p>
          </div>
        ) : (
          <TaskList
            tasks={tasks}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onPatch={handlePatch}
          />
        )}
      </div>
    </div>
  );
}

export default App;
