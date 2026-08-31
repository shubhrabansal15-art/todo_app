import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  patchTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

vi.mock('../api/client', () => ({
  setAuthToken: vi.fn(),
  setOnAuthExpired: vi.fn(),
  resetAuthExpiredFlag: vi.fn(),
  authFetch: vi.fn(),
  BASE_URL: 'http://127.0.0.1:8000',
}));

import { getTasks } from '../api/tasks';
import { getMe } from '../api/auth';
import { AuthProvider } from '../context/AuthContext';

const makeTask = (overrides = {}) => ({
  id: 1,
  title: 'Test Task',
  description: 'Description',
  completed: false,
  priority: 'medium',
  status: 'todo',
  due_date: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ...overrides,
});

function renderAuthenticated(taskData = []) {
  localStorage.setItem('todo_auth_token', 'test-token');
  localStorage.setItem('todo_auth_user', JSON.stringify({ id: 1, email: 'test@test.com', created_at: '2026-01-01' }));
  getMe.mockResolvedValue({ id: 1, email: 'test@test.com', created_at: '2026-01-01' });
  getTasks.mockResolvedValue(taskData);
  return render(<AuthProvider><App /></AuthProvider>);
}

function renderUnauthenticated() {
  localStorage.clear();
  getMe.mockRejectedValue(new Error('Not authenticated'));
  return render(<AuthProvider><App /></AuthProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
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
    // Register page should have the "Taskflow" heading and "Create Account" button
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
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.getByTitle('Sign out')).toBeInTheDocument();
  });

  it('clears authentication state on logout', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByTitle('Sign out'));
    await waitFor(() => {
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });
  });
});

describe('App - Authenticated Tasks', () => {
  it('shows loading state initially', async () => {
    getMe.mockResolvedValue({ id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    localStorage.setItem('todo_auth_token', 'test-token');
    localStorage.setItem('todo_auth_user', JSON.stringify({ id: 1, email: 'test@test.com', created_at: '2026-01-01' }));
    getTasks.mockReturnValue(new Promise(() => {}));
    render(<AuthProvider><App /></AuthProvider>);
    expect(await screen.findByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    renderAuthenticated([]);
    expect(await screen.findByText('All caught up!')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    getMe.mockResolvedValue({ id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    localStorage.setItem('todo_auth_token', 'test-token');
    localStorage.setItem('todo_auth_user', JSON.stringify({ id: 1, email: 'test@test.com', created_at: '2026-01-01' }));
    getTasks.mockRejectedValue(new Error('Network error'));
    render(<AuthProvider><App /></AuthProvider>);
    // Error appears in both topbar and view; use getAllByText
    const errors = await screen.findAllByText('Could not connect to the API');
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  it('renders tasks from API', async () => {
    renderAuthenticated([
      makeTask({ id: 1, title: 'First task' }),
      makeTask({ id: 2, title: 'Second task' }),
    ]);
    expect(await screen.findByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows navigation links in sidebar', async () => {
    renderAuthenticated([makeTask()]);
    await screen.findByText('Taskflow');
    // Nav labels appear in both sidebar and mobile nav, so use getAllByText
    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Upcoming').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('All Tasks').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Projects').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Settings').length).toBeGreaterThanOrEqual(1);
  });

  it('shows sidebar brand', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Taskflow')).toBeInTheDocument();
    expect(screen.getByText('Productivity Dashboard')).toBeInTheDocument();
  });

  it('does not show error for AUTH_EXPIRED', async () => {
    getMe.mockResolvedValue({ id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    localStorage.setItem('todo_auth_token', 'test-token');
    localStorage.setItem('todo_auth_user', JSON.stringify({ id: 1, email: 'test@test.com', created_at: '2026-01-01' }));
    getTasks.mockRejectedValue(new Error('AUTH_EXPIRED'));
    render(<AuthProvider><App /></AuthProvider>);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.queryByText('Could not connect to the API')).not.toBeInTheDocument();
  });
});
