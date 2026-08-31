import { useState } from "react";

function TaskFilters({ filters, onFilterChange }) {
  const [search, setSearch] = useState(filters.search || "");

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

  return (
    <div className="task-filters">
      <form className="search-form" onSubmit={handleSearchSubmit}>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
        {filters.search && (
          <button type="button" onClick={handleSearchClear}>
            Clear
          </button>
        )}
      </form>

      <div className="filter-row">
        <label>
          Status
          <select
            value={filters.status || ""}
            onChange={(e) => handleChange("status", e.target.value)}
          >
            <option value="">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </label>

        <label>
          Priority
          <select
            value={filters.priority || ""}
            onChange={(e) => handleChange("priority", e.target.value)}
          >
            <option value="">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label>
          Completed
          <select
            value={filters.completed === undefined ? "" : String(filters.completed)}
            onChange={(e) => {
              const val = e.target.value;
              handleChange("completed", val === "" ? undefined : val === "true");
            }}
          >
            <option value="">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label>
          Sort By
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

        <label>
          Order
          <select
            value={filters.order || "desc"}
            onChange={(e) => handleChange("order", e.target.value)}
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export default TaskFilters;
