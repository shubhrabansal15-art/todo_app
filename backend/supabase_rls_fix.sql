-- ============================================================
-- DIAGNOSTIC: Run these queries first to see the current state
-- Copy-paste each query into Supabase SQL Editor and note results
-- ============================================================

-- 1. Does the tasks table exist?
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'tasks'
) AS tasks_table_exists;

-- 2. Is RLS enabled?
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname IN ('tasks', 'projects', 'reminders');

-- 3. What policies exist on tasks?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'tasks';

-- 4. What policies exist on projects?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'projects';

-- 5. What policies exist on reminders?
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'reminders';

-- ============================================================
-- FIX: Recreate all RLS policies (run AFTER diagnostics)
-- Drop first to avoid conflicts, then recreate
-- ============================================================

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "users_select_own_tasks" ON tasks;
DROP POLICY IF EXISTS "users_insert_own_tasks" ON tasks;
DROP POLICY IF EXISTS "users_update_own_tasks" ON tasks;
DROP POLICY IF EXISTS "users_delete_own_tasks" ON tasks;

DROP POLICY IF EXISTS "users_select_own_projects" ON projects;
DROP POLICY IF EXISTS "users_insert_own_projects" ON projects;
DROP POLICY IF EXISTS "users_update_own_projects" ON projects;
DROP POLICY IF EXISTS "users_delete_own_projects" ON projects;

DROP POLICY IF EXISTS "users_select_own_reminders" ON reminders;
DROP POLICY IF EXISTS "users_insert_own_reminders" ON reminders;
DROP POLICY IF EXISTS "users_update_own_reminders" ON reminders;
DROP POLICY IF EXISTS "users_delete_own_reminders" ON reminders;

-- Ensure RLS is enabled
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "users_select_own_tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "users_select_own_projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Reminders policies
CREATE POLICY "users_select_own_reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);
