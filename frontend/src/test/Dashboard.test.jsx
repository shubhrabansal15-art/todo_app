import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Dashboard from '../components/Dashboard';

const makeTask = (overrides = {}) => ({
  id: 1,
  title: 'Task',
  description: null,
  completed: false,
  priority: 'medium',
  status: 'todo',
  due_date: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ...overrides,
});

describe('Dashboard', () => {
  it('shows total count', () => {
    render(<Dashboard tasks={[makeTask({ id: 1 }), makeTask({ id: 2 })]} />);
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('counts todo tasks', () => {
    const tasks = [
      makeTask({ id: 1, status: 'todo', completed: false }),
      makeTask({ id: 2, status: 'done', completed: true }),
    ];
    render(<Dashboard tasks={tasks} />);
    expect(screen.getAllByText('To Do').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
  });

  it('counts in-progress tasks', () => {
    const tasks = [
      makeTask({ id: 1, status: 'in_progress', completed: false }),
      makeTask({ id: 2, status: 'todo', completed: false }),
    ];
    render(<Dashboard tasks={tasks} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('counts overdue tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const tasks = [
      makeTask({ id: 1, due_date: dateStr, completed: false }),
      makeTask({ id: 2, due_date: null, completed: false }),
    ];
    render(<Dashboard tasks={tasks} />);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('does not show overdue card when no overdue tasks', () => {
    const tasks = [makeTask({ id: 1, due_date: '2099-12-31', completed: false })];
    render(<Dashboard tasks={tasks} />);
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });

  it('does not count completed tasks as overdue', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    const tasks = [makeTask({ id: 1, due_date: dateStr, completed: true })];
    render(<Dashboard tasks={tasks} />);
    expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
  });
});
