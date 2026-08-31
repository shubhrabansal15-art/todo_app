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
      <h1>My Todo App</h1>

      <TaskForm onCreate={handleCreate} />

      {error && <p className="error-message">{error}</p>}

      <TaskFilters filters={filters} onFilterChange={handleFilterChange} />

      <h2>Tasks</h2>

      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : tasks.length === 0 ? (
        <p className="empty-message">
          {filters.search || filters.status || filters.priority
            ? "No tasks match your filters."
            : "No tasks yet."}
        </p>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
          onPatch={handlePatch}
        />
      )}
    </div>
  );
}

export default App;
