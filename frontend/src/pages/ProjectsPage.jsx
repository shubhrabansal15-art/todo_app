import { useState, useEffect, useCallback } from 'react';
import { getProjects, createProject, deleteProject } from '../api/projects';
import EmptyState from '../components/EmptyState';
import ProjectForm from '../components/ProjectForm';

function ProjectsPage({ onSelectProject }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [filter, setFilter] = useState('all');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      if (err.message === 'AUTH_EXPIRED') return;
      setError('Could not load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  async function handleCreate(data) {
    try {
      const project = await createProject(data);
      setProjects((prev) => [project, ...prev]);
      setShowCreateForm(false);
    } catch (err) {
      setError('Failed to create project');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this project? Tasks will be unlinked but not deleted.')) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError('Failed to delete project');
    }
  }

  function handleEditSave(updatedProject) {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
    setEditingProject(null);
  }

  const filtered = projects.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />
        <span className="loading-text">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="view-header">
        <div className="view-header-row">
          <h2>Projects</h2>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button className="error-banner-dismiss" onClick={() => setError('')}>&times;</button>
        </div>
      )}

      {showCreateForm && (
        <div className="project-form-wrapper">
          <ProjectForm
            onSave={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        </div>
      )}

      {editingProject && (
        <div className="project-form-wrapper">
          <ProjectForm
            project={editingProject}
            onSave={handleEditSave}
            onCancel={() => setEditingProject(null)}
          />
        </div>
      )}

      <div className="project-status-tabs">
        {[
          { key: 'all', label: 'All', count: projects.length },
          { key: 'active', label: 'Active', count: activeCount },
          { key: 'completed', label: 'Completed', count: completedCount },
          { key: 'archived', label: 'Archived', count: archivedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`project-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="project-tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 && !showCreateForm && !editingProject ? (
        <EmptyState
          title={filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
          description="Create your first project to organize related tasks."
          icon="folder"
        />
      ) : (
        <div className="projects-grid">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onSelectProject(project.id)}
              onEdit={() => setEditingProject(project)}
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, onClick, onEdit, onDelete }) {
  const progress = project.task_count > 0
    ? Math.round((project.completed_task_count / project.task_count) * 100)
    : 0;

  return (
    <div className="project-card" onClick={onClick}>
      <div className="project-card-header">
        <span className="project-card-icon" style={{ background: project.color }}>
          {project.icon}
        </span>
        <div className="project-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="project-card-action" onClick={onEdit} title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
          </button>
          <button className="project-card-action project-card-action-delete" onClick={onDelete} title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            </svg>
          </button>
        </div>
      </div>

      <h3 className="project-card-name">{project.name}</h3>
      {project.description && (
        <p className="project-card-description">{project.description}</p>
      )}

      <div className="project-card-meta">
        <span className={`badge badge-${project.status === 'active' ? 'todo' : project.status === 'completed' ? 'done' : 'medium'}`}>
          {project.status}
        </span>
        <span className={`badge badge-${project.priority}`}>{project.priority}</span>
      </div>

      {project.task_count > 0 && (
        <div className="project-card-progress">
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">
            {project.completed_task_count}/{project.task_count} tasks
          </span>
        </div>
      )}

      {project.due_date && (
        <div className="project-card-due">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Due {new Date(project.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  );
}

export default ProjectsPage;
