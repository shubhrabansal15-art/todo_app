import { supabase } from "../lib/supabase";

/**
 * Fetch tasks with optional filters, sorting, and search.
 * All queries are automatically scoped to the authenticated user via RLS.
 */
export async function getTasks(filters = {}) {
  let query = supabase
    .from("tasks")
    .select("*");

  // Apply filters
  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.completed !== undefined && filters.completed !== null) {
    query = query.eq("completed", filters.completed);
  }
  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Apply sorting
  const sortBy = filters.sort_by || "created_at";
  const ascending = filters.order === "asc";

  // Priority sorting needs custom ordering in JS
  if (sortBy === "priority") {
    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch tasks");

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...data].sort((a, b) => {
      const orderA = priorityOrder[a.priority] ?? 4;
      const orderB = priorityOrder[b.priority] ?? 4;
      return ascending ? orderA - orderB : orderB - orderA;
    });
    return sorted;
  }

  query = query.order(sortBy, { ascending });

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch tasks");
  return data;
}

/**
 * Create a new task.
 */
export async function createTask({ title, description, priority, status, due_date, project_id }) {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description: description || null,
      priority: priority || "medium",
      status: status || "todo",
      due_date: due_date || null,
      project_id: project_id || null,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create task");
  return data;
}

/**
 * Update a task (full update).
 */
export async function updateTask(taskId, data) {
  const { data: updated, error } = await supabase
    .from("tasks")
    .update({
      title: data.title,
      description: data.description || null,
      completed: data.completed,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw new Error("Failed to update task");
  return updated;
}

/**
 * Patch a task (partial update — only send provided fields).
 */
export async function patchTask(taskId, data) {
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.completed !== undefined) updateData.completed = data.completed;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.due_date !== undefined) updateData.due_date = data.due_date;
  if (data.project_id !== undefined) updateData.project_id = data.project_id;

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw new Error("Failed to update task");
  return updated;
}

/**
 * Delete a task.
 */
export async function deleteTask(taskId) {
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) throw new Error("Failed to delete task");
  return { message: "Task deleted" };
}
