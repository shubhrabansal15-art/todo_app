import { supabase } from "../lib/supabase";

/**
 * Fetch reminders with optional filters.
 * RLS automatically scopes to the authenticated user.
 */
export async function getReminders(filters = {}) {
  let query = supabase
    .from("reminders")
    .select("*");

  if (filters.status) {
    query = query.eq("status", filters.status);
  }
  if (filters.task_id) {
    query = query.eq("task_id", filters.task_id);
  }
  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // For overdue/today filters, we need to handle them in JS after fetching
  // because Supabase .lte() with date strings needs careful handling
  const sortBy = filters.sort_by || "reminder_date";
  const ascending = filters.order !== "desc";

  query = query.order(sortBy, { ascending });

  const { data, error } = await query;
  if (error) throw new Error("Failed to fetch reminders");

  // Apply date-based filters client-side for accuracy
  const todayStr = new Date().toISOString().split("T")[0];
  let filtered = data;

  if (filters.overdue === true) {
    filtered = filtered.filter(
      (r) => r.status === "pending" && r.reminder_date < todayStr
    );
  } else if (filters.overdue === false) {
    filtered = filtered.filter(
      (r) => r.status === "pending" && r.reminder_date >= todayStr
    );
  }

  if (filters.today === true) {
    filtered = filtered.filter(
      (r) => r.status === "pending" && r.reminder_date === todayStr
    );
  }

  return filtered;
}

/**
 * Fetch a single reminder.
 */
export async function getReminder(reminderId) {
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("id", reminderId)
    .single();

  if (error) throw new Error("Failed to fetch reminder");
  return data;
}

/**
 * Create a new reminder.
 */
export async function createReminder(data) {
  const { data: created, error } = await supabase
    .from("reminders")
    .insert({
      title: data.title,
      description: data.description || null,
      reminder_date: data.reminder_date,
      reminder_time: data.reminder_time || null,
      task_id: data.task_id || null,
      project_id: data.project_id || null,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create reminder");
  return created;
}

/**
 * Update a reminder (full update).
 */
export async function updateReminder(reminderId, data) {
  const { data: updated, error } = await supabase
    .from("reminders")
    .update({
      title: data.title,
      description: data.description || null,
      reminder_date: data.reminder_date,
      reminder_time: data.reminder_time || null,
      task_id: data.task_id || null,
      project_id: data.project_id || null,
      status: data.status,
    })
    .eq("id", reminderId)
    .select()
    .single();

  if (error) throw new Error("Failed to update reminder");
  return updated;
}

/**
 * Patch a reminder (partial update).
 */
export async function patchReminder(reminderId, data) {
  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.reminder_date !== undefined) updateData.reminder_date = data.reminder_date;
  if (data.reminder_time !== undefined) updateData.reminder_time = data.reminder_time;
  if (data.task_id !== undefined) updateData.task_id = data.task_id;
  if (data.project_id !== undefined) updateData.project_id = data.project_id;
  if (data.status !== undefined) updateData.status = data.status;

  const { data: updated, error } = await supabase
    .from("reminders")
    .update(updateData)
    .eq("id", reminderId)
    .select()
    .single();

  if (error) throw new Error("Failed to update reminder");
  return updated;
}

/**
 * Delete a reminder.
 */
export async function deleteReminder(reminderId) {
  const { error } = await supabase
    .from("reminders")
    .delete()
    .eq("id", reminderId);

  if (error) throw new Error("Failed to delete reminder");
  return { message: "Reminder deleted" };
}

/**
 * Get reminder summary for dashboard.
 * Computes overdue/today/upcoming counts client-side from all pending reminders.
 */
export async function getReminderSummary() {
  const todayStr = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("status", "pending");

  if (error) throw new Error("Failed to fetch reminder summary");

  const overdue = data.filter((r) => r.reminder_date < todayStr);
  const today = data.filter((r) => r.reminder_date === todayStr);
  const upcoming = data
    .filter((r) => r.reminder_date > todayStr)
    .sort((a, b) => a.reminder_date.localeCompare(b.reminder_date));

  return {
    overdue_count: overdue.length,
    today_count: today.length,
    next_upcoming: upcoming[0] || null,
  };
}
