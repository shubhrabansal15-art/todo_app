import { useState, useEffect, useCallback } from 'react';
import { getProject, patchProject } from '../api/projects';
import { getTasks, createTask, patchTask, deleteTask } from '../api/tasks';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import EmptyState from '../components/EmptyState';

function ProjectDetail({ projectId, onBack }) {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [projectData, tasksData] = await Promise.all([
        getProject(projectId),
        getTasks({ project_id: projectId, sort_by: 'priority', order: 'asc' }),
      ]);
      setProject(projectData);
      setTasks(tasksData);
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') return;
      setError('Could not load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateTask(taskData) {
    try {
      const newTask = await createTask({ ...taskData, project_id: projectId });
      setTasks((prev) => [...prev, newTask]);
      // Refresh project to update task counts
      const updatedProject = await getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      setError('Could not create task');
    }
  }

  async function handleToggle(task) {
    try {
      const updated = await patchTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      const updatedProject = await getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      setError('Could not update task');
    }
  }

  async function handlePatch(taskId, data) {
    try {
      const updated = await patchTask(taskId, data);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      const updatedProject = await getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      setError('Could not update task');
      throw err;
    }
  }

  async function handleDelete(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      const updatedProject = await getProject(projectId);
      setProject(updatedProject);
    } catch (err) {
      setError('Could not delete task');
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      const updated = await patchProject(projectId, { status: newStatus });
      setProject(updated);
    } catch (err) {
      setError('Could not update project');
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span className="loading-text">Loading project...</span>
      </div>
    );
  }

  if (error && !project) {
    return <div className="error-banner">{error}</div>;
  }

  const progress = project && project.task_count > 0
    ? Math.round((project.completed_task_count / project.task_count) * 100)
    : 0;

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          &larr; Projects
        </button>

        <div className="project-detail-top">
          <span className="project-detail-icon" style={{ background: project.color }}>
            {project.icon}
          </span>
          <div>
            <h2>{project.name}</h2>
            {project.description && (
              <p className="project-detail-desc">{project.description}</p>
            )}
          </div>
        </div>

        <div className="project-detail-meta">
          <span className={`badge badge-${project.status === 'active' ? 'todo' : project.status === 'completed' ? 'done' : 'medium'}`}>
            {project.status}
          </span>
          <span className={`badge badge-${project.priority}`}>{project.priority}</span>

          {project.status === 'active' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleStatusChange('completed')}
            >
              Mark Complete
            </button>
          )}
          {project.status === 'completed' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleStatusChange('active')}
            >
              Reopen
            </button>
          )}
          {project.status !== 'archived' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => handleStatusChange('archived')}
            >
              Archive
            </button>
          )}
        </div>

        {project.task_count > 0 && (
          <div className="project-detail-progress">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">
              {project.completed_task_count}/{project.task_count} tasks completed ({progress}%)
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button className="error-banner-dismiss" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      <TaskForm onCreate={handleCreateTask} />

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this project"
          description="Add your first task to start making progress."
          icon="check"
        />
      ) : (
        <div className="tasks-section">
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onPatch={handlePatch}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDetail;
