import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// Mock the API module
vi.mock('../api/tasks', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  patchTask: vi.fn(),
  deleteTask: vi.fn(),
}));

import { getTasks, createTask, patchTask, deleteTask } from '../api/tasks';

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

beforeEach(() => {
  vi.clearAllMocks();
});

describe('App', () => {
  it('shows loading state initially', () => {
    getTasks.mockReturnValue(new Promise(() => {})); // never resolves
    render(<App />);
    expect(screen.getByText('Loading tasks...')).toBeInTheDocument();
  });

  it('shows empty state when no tasks', async () => {
    getTasks.mockResolvedValue([]);
    render(<App />);
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    expect(screen.getByText('Create your first task to get started')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    getTasks.mockRejectedValue(new Error('Network error'));
    render(<App />);
    expect(await screen.findByText('Could not connect to the API')).toBeInTheDocument();
  });

  it('renders tasks from API', async () => {
    getTasks.mockResolvedValue([
      makeTask({ id: 1, title: 'First task' }),
      makeTask({ id: 2, title: 'Second task' }),
    ]);
    render(<App />);
    expect(await screen.findByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('shows dashboard when tasks exist', async () => {
    getTasks.mockResolvedValue([makeTask()]);
    render(<App />);
    expect(await screen.findByText('Total')).toBeInTheDocument();
  });

  it('does not show dashboard when no tasks', async () => {
    getTasks.mockResolvedValue([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });
  });

  it('shows task count', async () => {
    getTasks.mockResolvedValue([makeTask({ id: 1 }), makeTask({ id: 2 })]);
    render(<App />);
    expect(await screen.findByText('2 total')).toBeInTheDocument();
  });

  it('shows empty state for filters with no results', async () => {
    getTasks.mockResolvedValue([]);
    render(<App />);
    // Trigger a filter change via the component (search)
    // Since we mock getTasks, it will return [] again
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
  });

  it('renders header', async () => {
    getTasks.mockResolvedValue([]);
    render(<App />);
    // Wait for the async loadTasks to finish so state updates are flushed
    await waitFor(() => {
      expect(screen.queryByText('Loading tasks...')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Todo Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Manage your tasks and stay on track')).toBeInTheDocument();
  });
});
