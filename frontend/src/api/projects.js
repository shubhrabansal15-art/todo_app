import { supabase } from "../lib/supabase";

/**
 * Fetch projects with optional filters and sorting.
 * RLS automatically scopes to the authenticated user.
 */
export async function getProjects(filters = {}) {
  let query = supabase
    .from("projects")
    .select("*, tasks(id, completed)");

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  const sortBy = filters.sort_by || "created_at";
  const ascending = filters.order === "asc";

  if (sortBy === "priority") {
    const { data, error } = await query;
    if (error) throw new Error("Failed to fetch projects");

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...data].sort((a, b) => {
      const orderA = priorityOrder[a.priority] ?? 4;
      const orderB = priorityOrder[b.priority] ?? 4;
      return ascending ? orderA - orderB : orderB - orderA;
    });
    return sorted.map(enrichProject);
  }

  query = query.order(sortBy, { ascending });

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch projects");
  return data.map(enrichProject);
}

/**
 * Add task_count and completed_task_count to a project.
 */
function enrichProject(project) {
  const tasks = project.tasks || [];
  return {
    ...project,
    task_count: tasks.length,
    completed_task_count: tasks.filter((t) => t.completed).length,
    tasks: undefined, // Remove the raw tasks array from response
  };
}

/**
 * Fetch a single project with task counts.
 */
export async function getProject(projectId) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, tasks(id, completed)")
    .eq("id", projectId)
    .single();

  if (error) throw new Error("Failed to fetch project");
  return enrichProject(data);
}

/**
 * Create a new project.
 */
export async function createProject(data) {
  const { data: created, error } = await supabase
    .from("projects")
    .insert({
      name: data.name,
      description: data.description || null,
      status: data.status || "active",
      priority: data.priority || "medium",
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      color: data.color || "#6366f1",
      icon: data.icon || "📁",
    })
    .select("*, tasks(id, completed)")
    .single();

  if (error) throw new Error("Failed to create project");
  return enrichProject(created);
}

/**
 * Update a project (full update).
 */
export async function updateProject(projectId, data) {
  const { data: updated, error } = await supabase
    .from("projects")
    .update({
      name: data.name,
      description: data.description || null,
      status: data.status,
      priority: data.priority,
      start_date: data.start_date || null,
      due_date: data.due_date || null,
      color: data.color || "#6366f1",
      icon: data.icon || "📁",
    })
    .eq("id", projectId)
    .select("*, tasks(id, completed)")
    .single();

  if (error) throw new Error("Failed to update project");
  return enrichProject(updated);
}

/**
 * Patch a project (partial update).
 */
export async function patchProject(projectId, data) {
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.start_date !== undefined) updateData.start_date = data.start_date;
  if (data.due_date !== undefined) updateData.due_date = data.due_date;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.icon !== undefined) updateData.icon = data.icon;

  const { data: updated, error } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId)
    .select("*, tasks(id, completed)")
    .single();

  if (error) throw new Error("Failed to update project");
  return enrichProject(updated);
}

/**
 * Delete a project. Tasks are unlinked via ON DELETE SET NULL.
 */
export async function deleteProject(projectId) {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw new Error("Failed to delete project");
  return { message: "Project deleted" };
}

/**
 * Fetch tasks belonging to a specific project.
 */
export async function getProjectTasks(projectId) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw new Error("Failed to fetch project tasks");
  return data;
}
