function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
      />

      <div>
        <strong
          style={{
            textDecoration: task.completed
              ? "line-through"
              : "none",
          }}
        >
          {task.title}
        </strong>

        {task.description && (
          <div>{task.description}</div>
        )}
      </div>

      <button onClick={() => onDelete(task.id)}>
        Delete
      </button>
    </li>
  );
}

export default TaskItem;