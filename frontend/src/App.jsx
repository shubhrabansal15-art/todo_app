import { useEffect, useState, useCallback } from "react";
import {
  getTasks,
  createTask,
  patchTask,
  deleteTask,
} from "./api/tasks";
import { getReminders } from "./api/reminders";
import { useAuth } from "./context/AuthContext";
import "./App.css";

import Dashboard from "./components/Dashboard";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";
import TaskForm from "./components/TaskForm";
import TodayView from "./pages/TodayView";
import UpcomingView from "./pages/UpcomingView";
import AllTasksView from "./pages/AllTasksView";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetail from "./pages/ProjectDetail";
import RemindersPage from "./pages/RemindersPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const { user, loading: authLoading, logout, isAuthenticated } = useAuth();
  const [authView, setAuthView] = useState("login");

  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("today");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [filters, setFilters] = useState({
    status: undefined,
    priority: undefined,
    completed: undefined,
    search: undefined,
    sort_by: "priority",
    order: "desc",
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [tasksData, remindersData] = await Promise.all([
        getTasks(filters),
        getReminders(),
      ]);
      setTasks(tasksData);
      setReminders(remindersData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Could not load data");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    } else {
      setTasks([]);
      setReminders([]);
      setLoading(false);
    }
  }, [isAuthenticated, loadData]);

  function handleFilterChange(newFilter) {
    setFilters((prev) => ({ ...prev, ...newFilter }));
  }

  async function handleCreate(taskData) {
    try {
      setError("");
      const newTask = await createTask(taskData);
      setTasks((currentTasks) => [...currentTasks, newTask]);
    } catch (err) {
      console.error("Failed to create task:", err);
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
      console.error("Failed to update task:", err);
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
      console.error("Failed to update task:", err);
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
      console.error("Failed to delete task:", err);
      setError("Could not delete task");
    }
  }

  function handleNavigate(view) {
    setCurrentView(view);
    setSelectedProjectId(null);
  }

  function handleSelectProject(projectId) {
    setSelectedProjectId(projectId);
    setCurrentView("projectDetail");
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
    reminders: "Reminders",
    projects: "Projects",
    projectDetail: "Project",
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
    reminders: <RemindersPage />,
    projects: (
      <ProjectsPage onSelectProject={handleSelectProject} />
    ),
    projectDetail: (
      <ProjectDetail
        projectId={selectedProjectId}
        onBack={() => setCurrentView("projects")}
      />
    ),
    settings: <SettingsPage user={user} onLogout={logout} />,
  };

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
            {error && (currentView === "projects" || currentView === "settings" || currentView === "projectDetail" || currentView === "reminders") && (
              <div className="error-banner" style={{ margin: 0, padding: "6px 12px", borderRadius: 9999, fontSize: "0.75rem" }}>
                {error}
                <button className="error-banner-dismiss" onClick={() => setError("")} style={{ marginLeft: 8 }}>
                  &times;
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="app-content">
          <Dashboard tasks={tasks} reminders={reminders} />
          {(currentView === "today" || currentView === "upcoming") && (
            <TaskForm onCreate={handleCreate} />
          )}

          {viewContent[currentView]}
        </div>
      </div>

      <MobileNav currentView={currentView} onNavigate={handleNavigate} />
    </div>
  );
}

export default App;
