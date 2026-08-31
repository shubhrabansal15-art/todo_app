import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskItem from '../components/TaskItem';

const makeTask = (overrides = {}) => ({
  id: 1,
  title: 'Test Task',
  description: 'Some description',
  completed: false,
  priority: 'medium',
  status: 'todo',
  due_date: null,
  created_at: '2026-01-01T00:00:00',
  updated_at: '2026-01-01T00:00:00',
  ...overrides,
});

describe('TaskItem', () => {
  it('renders task title and description', () => {
    render(
      <TaskItem
        task={makeTask()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Some description')).toBeInTheDocument();
  });

  it('renders priority and status badges', () => {
    render(
      <TaskItem
        task={makeTask({ priority: 'high', status: 'in_progress' })}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('renders due date when present', () => {
    render(
      <TaskItem
        task={makeTask({ due_date: '2026-12-25' })}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('does not render due date when null', () => {
    render(
      <TaskItem
        task={makeTask({ due_date: null })}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', () => {
    const onToggle = vi.fn();
    const task = makeTask();
    render(
      <TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} onPatch={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith(task);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <TaskItem
        task={makeTask({ id: 42 })}
        onToggle={vi.fn()}
        onDelete={onDelete}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(42);
  });

  it('enters edit mode when edit button is clicked', () => {
    render(
      <TaskItem
        task={makeTask()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Some description')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('cancels editing without saving', () => {
    const onPatch = vi.fn();
    render(
      <TaskItem
        task={makeTask()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={onPatch}
      />
    );
    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(onPatch).not.toHaveBeenCalled();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('saves edits via onPatch', async () => {
    const onPatch = vi.fn().mockResolvedValue(undefined);
    render(
      <TaskItem
        task={makeTask()}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={onPatch}
      />
    );
    fireEvent.click(screen.getByText('Edit'));

    const titleInput = screen.getByDisplayValue('Test Task');
    fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onPatch).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Updated Task' }));
    });
  });

  it('shows overdue indicator for past due incomplete tasks', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    render(
      <TaskItem
        task={makeTask({ due_date: dateStr, completed: false })}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onPatch={vi.fn()}
      />
    );
    expect(screen.getByText('overdue')).toBeInTheDocument();
  });
});
