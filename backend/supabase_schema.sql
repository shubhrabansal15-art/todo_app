-- ============================================================
-- TASKFLOW — Supabase PostgreSQL Schema (Clean Reset)
--
-- Safe to paste into Supabase SQL Editor.
-- Step 1: DROP all Taskflow objects (IF EXISTS, no errors)
-- Step 2: CREATE everything fresh in dependency order
-- ============================================================

-- =============================================
-- Step 1: CLEANUP — Drop everything safely
-- =============================================

-- Tables (CASCADE removes policies, triggers, indexes automatically)
DROP TABLE IF EXISTS reminders CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;

-- Enum types
DROP TYPE IF EXISTS reminder_status CASCADE;
DROP TYPE IF EXISTS project_priority CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;

-- Trigger function
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;

-- =============================================
-- Step 2: CREATE — Enum Types
-- =============================================
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'dismissed');

-- =============================================
-- Step 3: CREATE — Projects Table (no custom FK dependencies)
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  status project_status NOT NULL DEFAULT 'active',
  priority project_priority NOT NULL DEFAULT 'medium',
  start_date DATE,
  due_date DATE,
  color VARCHAR(7) NOT NULL DEFAULT '#6366f1',
  icon VARCHAR(10) NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_projects_user_id ON projects(user_id);

-- =============================================
-- Step 4: CREATE — Tasks Table (FK to projects is inline)
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  priority task_priority NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'todo',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_tasks_user_id ON tasks(user_id);
CREATE INDEX ix_tasks_project_id ON tasks(project_id);
CREATE INDEX ix_tasks_status ON tasks(status);
CREATE INDEX ix_tasks_priority ON tasks(priority);
CREATE INDEX ix_tasks_due_date ON tasks(due_date);

-- =============================================
-- Step 5: CREATE — Reminders Table (FKs to tasks and projects are inline)
-- =============================================
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  status reminder_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_reminders_user_id ON reminders(user_id);
CREATE INDEX ix_reminders_status ON reminders(status);
CREATE INDEX ix_reminders_task_id ON reminders(task_id);
CREATE INDEX ix_reminders_project_id ON reminders(project_id);

-- =============================================
-- Step 6: Row Level Security
-- =============================================
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- Tasks: users can only access their own tasks
CREATE POLICY "users_select_own_tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Projects: users can only access their own projects
CREATE POLICY "users_select_own_projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Reminders: users can only access their own reminders
CREATE POLICY "users_select_own_reminders" ON reminders
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_insert_own_reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users_update_own_reminders" ON reminders
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "users_delete_own_reminders" ON reminders
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Step 7: Updated_at Trigger
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
