import { useEffect, useState, useCallback } from "react";
import {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
} from "./api/tasks";
import { useAuth } from "./context/AuthContext";
import "./App.css";

import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import TaskForm from "./components/TaskForm";
import TodayView from "./pages/TodayView";
import UpcomingView from "./pages/UpcomingView";
import AllTasksView from "./pages/AllTasksView";
import ProjectsPlaceholder from "./pages/ProjectsPlaceholder";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState("login");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("today");

  const [filters, setFilters] = useState({
    status: undefined,
    priority: undefined,
    completed: undefined,
    search: undefined,
    sort_by: "created_at",
    order: "desc",
  });

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getTasks(filters);
      setTasks(data);
    } catch (err) {
      if (err.message === "AUTH_EXPIRED") return;
      setError("Could not connect to the API");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    } else {
      setTasks([]);
      setLoading(false);
    }
  }, [isAuthenticated, loadTasks]);

  function handleFilterChange(newFilter) {
    setFilters((prev) => ({ ...prev, ...newFilter }));
  }

  async function handleCreate(taskData) {
    try {
      setError("");
      const newTask = await createTask(taskData);
      setTasks((currentTasks) => [...currentTasks, newTask]);
    } catch (err) {
      if (err.message === "AUTH_EXPIRED") return;
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
      if (err.message === "AUTH_EXPIRED") return;
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
      if (err.message === "AUTH_EXPIRED") return;
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
      if (err.message === "AUTH_EXPIRED") return;
      setError("Could not delete task");
    }
  }

  function handleNavigate(view) {
    setCurrentView(view);
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <span className="loading-text">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === "register" ? (
      <RegisterPage onSwitchToLogin={() => setAuthView("login")} />
    ) : (
      <LoginPage onSwitchToRegister={() => setAuthView("register")} />
    );
  }

  const viewTitle = {
    today: "Today",
    upcoming: "Upcoming",
    all: "All Tasks",
    projects: "Projects",
    settings: "Settings",
  }[currentView];

  const viewContent = {
    today: (
      <TodayView
        tasks={tasks}
        loading={loading}
        error={error}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onPatch={handlePatch}
      />
    ),
    upcoming: (
      <UpcomingView
        tasks={tasks}
        loading={loading}
        error={error}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onPatch={handlePatch}
      />
    ),
    all: (
      <AllTasksView
        tasks={tasks}
        loading={loading}
        error={error}
        filters={filters}
        onFilterChange={handleFilterChange}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onPatch={handlePatch}
        onClearError={() => setError("")}
      />
    ),
    projects: <ProjectsPlaceholder />,
    settings: <SettingsPage user={user} onLogout={logout} />,
  }[currentView];

  return (
    <div className="app-shell">
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        tasks={tasks}
        onLogout={logout}
      />

      <div className="app-main">
        <div className="topbar">
          <span className="topbar-title">{viewTitle}</span>

          {(currentView === "today" || currentView === "upcoming") && (
            <div className="topbar-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search tasks..."
                value={filters.search || ""}
                onChange={(e) =>
                  handleFilterChange({ search: e.target.value.trim() || undefined })
                }
              />
            </div>
          )}

          <div className="topbar-actions">
            {error && (currentView === 'projects' || currentView === 'settings') && (
              <div
                className="error-banner"
                style={{ margin: 0, padding: '6px 12px', borderRadius: 9999, fontSize: '0.75rem' }}
              >
                {error}
                <button
                  className="error-banner-dismiss"
                  onClick={() => setError('')}
                  style={{ marginLeft: 8 }}
                >
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="app-content">
          {(currentView === "today" || currentView === "upcoming") && (
            <TaskForm onCreate={handleCreate} />
          )}

          {viewContent}
        </div>
      </div>

      <MobileNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
