const DEFAULT_FILTERS = {
  status: undefined,
  priority: undefined,
  completed: undefined,
  search: undefined,
  sort_by: "created_at",
  order: "desc",
};

function TaskFilters({ filters, onFilterChange }) {
  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.completed !== undefined;

  function handleChange(key, value) {
    onFilterChange({ [key]: value || undefined });
  }

  function handleResetAll() {
    onFilterChange({ ...DEFAULT_FILTERS });
  }

  return (
    <div className="task-filters-bar">
      <label className={`filter-pill ${filters.status ? "active" : ""}`}>
        <span>Status</span>
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

      <label className={`filter-pill ${filters.priority ? "active" : ""}`}>
        <span>Priority</span>
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

      <label className={`filter-pill ${filters.completed !== undefined ? "active" : ""}`}>
        <span>Completed</span>
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

      <label className="filter-pill">
        <span>Sort</span>
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

      <label className="filter-pill">
        <span>Order</span>
        <select
          value={filters.order || "desc"}
          onChange={(e) => handleChange("order", e.target.value)}
        >
          <option value="desc">Newest</option>
          <option value="asc">Oldest</option>
        </select>
      </label>

      {hasActiveFilters && (
        <button className="btn-reset-filters" onClick={handleResetAll}>
          Reset all
        </button>
      )}
    </div>
  );
}

export default TaskFilters;
