import { useState } from "react";

const DEFAULT_FILTERS = {
  status: undefined,
  priority: undefined,
  completed: undefined,
  search: undefined,
  sort_by: "created_at",
  order: "desc",
};

function TaskFilters({ filters, onFilterChange }) {
  const [search, setSearch] = useState(filters.search || "");

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.completed !== undefined;

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.priority,
    filters.completed !== undefined,
  ].filter(Boolean).length;

  function handleSearchSubmit(e) {
    e.preventDefault();
    onFilterChange({ search: search.trim() || undefined });
  }

  function handleSearchClear() {
    setSearch("");
    onFilterChange({ search: undefined });
  }

  function handleChange(key, value) {
    onFilterChange({ [key]: value || undefined });
  }

  function handleResetAll() {
    setSearch("");
    onFilterChange({ ...DEFAULT_FILTERS });
  }

  return (
    <div className="task-filters">
      <div className="filters-header">
        <span className="filters-title">Filters</span>
        {hasActiveFilters && (
          <span className="active-filter-count">
            {activeFilterCount} active
          </span>
        )}
      </div>

      <form className="search-form" onSubmit={handleSearchSubmit}>
        <div className="search-input-wrapper">
          <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filters.search && (
            <button type="button" className="btn-clear-search" onClick={handleSearchClear}>
              ×
            </button>
          )}
        </div>
        <button type="submit" className="btn-search">Search</button>
      </form>

      <div className="filter-row">
        <label className="filter-label">
          <span className="filter-label-text">Status</span>
          <select
            value={filters.status || ""}
            onChange={(e) => handleChange("status", e.target.value)}
            className={filters.status ? "filter-active" : ""}
          >
            <option value="">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label className="filter-label">
          <span className="filter-label-text">Priority</span>
          <select
            value={filters.priority || ""}
            onChange={(e) => handleChange("priority", e.target.value)}
            className={filters.priority ? "filter-active" : ""}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className="filter-label">
          <span className="filter-label-text">Completed</span>
          <select
            value={filters.completed === undefined ? "" : String(filters.completed)}
            onChange={(e) => {
              const val = e.target.value;
              handleChange("completed", val === "" ? undefined : val === "true");
            }}
            className={filters.completed !== undefined ? "filter-active" : ""}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label className="filter-label">
          <span className="filter-label-text">Sort By</span>
          <select
            value={filters.sort_by || "created_at"}
            onChange={(e) => handleChange("sort_by", e.target.value)}
          >
            <option value="created_at">Created</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </label>

        <label className="filter-label">
          <span className="filter-label-text">Order</span>
          <select
            value={filters.order || "desc"}
            onChange={(e) => handleChange("order", e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
      </div>

      {hasActiveFilters && (
        <button className="btn-reset-filters" onClick={handleResetAll}>
          Reset all filters
        </button>
      )}
    </div>
  );
}

export default TaskFilters;
