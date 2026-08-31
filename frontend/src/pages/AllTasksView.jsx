import { useState } from 'react';
import TaskCard from '../components/TaskCard';
import TaskFilters from '../components/TaskFilters';
import EmptyState from '../components/EmptyState';

function AllTasksView({ tasks, loading, error, filters, onFilterChange, onToggle, onDelete, onPatch, onClearError }) {
  return (
    <>
      <div className="view-header">
        <h2>All Tasks</h2>
        <p>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
      </div>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          <button className="error-banner-dismiss" onClick={onClearError}>&times;</button>
        </div>
      )}

      <TaskFilters filters={filters} onFilterChange={onFilterChange} />

      <div className="tasks-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <span className="loading-text">Loading tasks...</span>
          </div>
        ) : tasks.length === 0 ? (
          <EmptyState
            title={filters.search || filters.status || filters.priority ? 'No matching tasks' : 'No tasks yet'}
            description={filters.search || filters.status || filters.priority
              ? 'Try adjusting your filters or search query'
              : 'Create your first task to get started'}
            icon="list"
          />
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} onPatch={onPatch} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AllTasksView;
