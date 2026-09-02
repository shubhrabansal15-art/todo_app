import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOnAuthStateChange = vi.fn();
const mockSignOut = vi.fn();
let authStateCallback = null;

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  patchTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('../api/reminders', () => ({
  getReminders: vi.fn().mockResolvedValue([]),
  getReminderSummary: vi.fn().mockResolvedValue({ overdue_count: 0, today_count: 0, next_upcoming: null }),
  createReminder: vi.fn(),
  patchReminder: vi.fn(),
  deleteReminder: vi.fn(),
}));

import App from '../App';
import { getTasks } from '../api/tasks';
import { getReminders } from '../api/reminders';
import { AuthProvider } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

const mockUser = {
  id: UUID,
  email: 'test@test.com',
  created_at: '2026-01-01T00:00:00Z',
};

const makeTask = (overrides = {}) => ({
  id: UUID,
  title: 'Test Task',
  description: 'Description',
  completed: false,
  priority: 'medium',
  status: 'todo',
  due_date: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  user_id: UUID,
  ...overrides,
});

function mockAuthenticated() {
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: mockUser, access_token: 'test-token' } },
  });
  supabase.auth.onAuthStateChange.mockImplementation((cb) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: mockUser },
  });
  // signOut triggers onAuthStateChange with null session
  supabase.auth.signOut.mockImplementation(async () => {
    if (authStateCallback) authStateCallback('SIGNED_OUT', null);
    return { error: null };
  });
}

function mockUnauthenticated() {
  supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  supabase.auth.onAuthStateChange.mockImplementation((cb) => {
    authStateCallback = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  supabase.auth.signOut.mockResolvedValue({ error: null });
}

function renderAuthenticated(taskData = []) {
  mockAuthenticated();
  getTasks.mockResolvedValue(taskData);
  getReminders.mockResolvedValue([]);
  return render(<AuthProvider><App /></AuthProvider>);
}

function renderUnauthenticated() {
  mockUnauthenticated();
  return render(<AuthProvider><App /></AuthProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  authStateCallback = null;
  localStorage.clear();
});

describe('App - Authentication', () => {
  it('shows login page when not authenticated', async () => {
    renderUnauthenticated();
    expect(await screen.findByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('shows register page when switching', async () => {
    renderUnauthenticated();
    await screen.findByText('Sign In');
    fireEvent.click(screen.getByText('Create one'));
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows sidebar when authenticated', async () => {
    renderAuthenticated([makeTask()]);
    expect(await screen.findByText('Taskflow')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('shows sign out button when authenticated', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    expect(screen.getByTitle('Sign out')).toBeInTheDocument();
  });

  it('clears authentication state on logout', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Sign out'));
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});

describe('App - Authenticated Tasks', () => {
  it('shows loading state initially', async () => {
    mockAuthenticated();
    getTasks.mockReturnValue(new Promise(() => {}));
    getReminders.mockReturnValue(new Promise(() => {}));
    render(<AuthProvider><App /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('shows empty state when no tasks', async () => {
    renderAuthenticated([]);
    expect(await screen.findByText('All caught up!')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    mockAuthenticated();
    getTasks.mockRejectedValue(new Error('Network error'));
    getReminders.mockResolvedValue([]);
    render(<AuthProvider><App /></AuthProvider>);
    const errors = await screen.findAllByText('Could not load data');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tasks from API', async () => {
    renderAuthenticated([
      makeTask({ id: '11111111-1111-1111-1111-111111111111', title: 'First task' }),
      makeTask({ id: '22222222-2222-2222-2222-222222222222', title: 'Second task' }),
    ]);
    expect(await screen.findByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows navigation links in sidebar', async () => {
    renderAuthenticated([makeTask()]);
    await screen.findByText('Taskflow');
    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('All Tasks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });

  it('shows sidebar brand', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Taskflow')).toBeInTheDocument();
    expect(screen.getByText('Productivity Dashboard')).toBeInTheDocument();
  });
});
