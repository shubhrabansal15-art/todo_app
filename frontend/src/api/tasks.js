const API_URL = `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/tasks`;

export async function getTasks(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.priority) params.append("priority", filters.priority);
  if (filters.completed !== undefined && filters.completed !== null) {
    params.append("completed", filters.completed);
  }
  if (filters.search) params.append("search", filters.search);
  if (filters.sort_by) params.append("sort_by", filters.sort_by);
  if (filters.order) params.append("order", filters.order);

  const queryString = params.toString();
  const url = queryString ? `${API_URL}/?${queryString}` : `${API_URL}/`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }

  return response.json();
}

export async function createTask({ title, description, priority, status, due_date }) {
  const response = await fetch(`${API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      description: description || null,
      priority: priority || "medium",
      status: status || "todo",
      due_date: due_date || null,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create task");
  }

  return response.json();
}

export async function updateTask(taskId, data) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: data.title,
      description: data.description || null,
      completed: data.completed,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  return response.json();
}

export async function patchTask(taskId, data) {
  const body = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.completed !== undefined) body.completed = data.completed;
  if (data.priority !== undefined) body.priority = data.priority;
  if (data.status !== undefined) body.status = data.status;
  if (data.due_date !== undefined) body.due_date = data.due_date;

  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Failed to update task");
  }

  return response.json();
}

export async function deleteTask(taskId) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete task");
  }

  return response.json();
}