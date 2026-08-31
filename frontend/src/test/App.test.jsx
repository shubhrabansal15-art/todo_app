import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Mock the API module
vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  patchTask: vi.fn(),
  deleteTask: vi.fn(),
}));

// Mock the auth API
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
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
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('shows register page when switching', async () => {
    renderUnauthenticated();
    await screen.findByText('Welcome Back');
    fireEvent.click(screen.getByText('Create one'));
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('shows dashboard when authenticated', async () => {
    renderAuthenticated([makeTask()]);
    expect(await screen.findByText('Todo Dashboard')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });

  it('shows sign out button when authenticated', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
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
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    getMe.mockResolvedValue({ id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    localStorage.setItem('todo_auth_token', 'test-token');
    localStorage.setItem('todo_auth_user', JSON.stringify({ id: 1, email: 'test@test.com', created_at: '2026-01-01' }));
    getTasks.mockRejectedValue(new Error('Network error'));
    render(<AuthProvider><App /></AuthProvider>);
    expect(await screen.findByText('Could not connect to the API')).toBeInTheDocument();
  });

  it('renders tasks from API', async () => {
    renderAuthenticated([
      makeTask({ id: 1, title: 'First task' }),
      makeTask({ id: 2, title: 'Second task' }),
    ]);
    expect(await screen.findByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows dashboard when tasks exist', async () => {
    renderAuthenticated([makeTask()]);
    expect(await screen.findByText('Total')).toBeInTheDocument();
  });

  it('does not show dashboard when no tasks', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });
  });

  it('shows task count', async () => {
    renderAuthenticated([makeTask({ id: 1 }), makeTask({ id: 2 })]);
    expect(await screen.findByText('2 total')).toBeInTheDocument();
  });

  it('renders header', async () => {
    renderAuthenticated([]);
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Todo Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your tasks and stay on track')).toBeInTheDocument();
  });
});
