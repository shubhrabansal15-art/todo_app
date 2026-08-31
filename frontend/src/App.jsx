import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./api/tasks";
import "./App.css";

import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadTasks() {
    try {
      setLoading(true);
      setError("");

      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      setError("Could not connect to the API");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleCreate(title, description) {
    try {
      setError("");

      const newTask = await createTask(
        title,
        description
      );

      setTasks((currentTasks) => [
        ...currentTasks,
        newTask,
      ]);
    } catch (err) {
      setError("Could not create task");
    }
  }

  async function handleToggle(task) {
    try {
      setError("");

      const updatedTask = await updateTask(
        task.id,
        task.title,
        task.description,
        !task.completed
      );

      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === updatedTask.id
            ? updatedTask
            : currentTask
        )
      );
    } catch (err) {
      setError("Could not update task");
    }
  }

  async function handleDelete(taskId) {
    try {
      setError("");

      await deleteTask(taskId);

      setTasks((currentTasks) =>
        currentTasks.filter(
          (task) => task.id !== taskId
        )
      );
    } catch (err) {
      setError("Could not delete task");
    }
  }

  return (
    <div className="app">
      <h1>My Todo App</h1>

      <TaskForm onCreate={handleCreate} />

      {error && <p>{error}</p>}

      <h2>Tasks</h2>

      {loading ? (
        <p>Loading...</p>
      ) : tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <TaskList
          tasks={tasks}
          onToggle={handleToggle}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;