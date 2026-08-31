import TaskItem from "./TaskItem";

function TaskList({ tasks, onToggle, onDelete, onPatch }) {
  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
          onPatch={onPatch}
        />
      ))}
    </ul>
  );
}

export default TaskList;