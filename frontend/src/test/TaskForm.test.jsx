import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskForm from '../components/TaskForm';

describe('TaskForm', () => {
  it('renders the title input and submit button', () => {
    render(<TaskForm onCreate={vi.fn()} />);
    expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
    expect(screen.getByText('Add Task')).toBeInTheDocument();
  });

  it('shows validation error on empty submit', async () => {
    render(<TaskForm onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Task'));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();
  });

  it('clears validation error when user types', async () => {
    render(<TaskForm onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText('Add Task'));
    expect(await screen.findByText('Title is required')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), {
      target: { value: 'New task' },
    });
    expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
  });

  it('calls onCreate with form data on valid submit', async () => {
    const onCreate = vi.fn();
    render(<TaskForm onCreate={onCreate} />);

    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), {
      target: { value: 'Buy milk' },
    });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith({
        title: 'Buy milk',
        description: null,
        priority: 'medium',
        status: 'todo',
        due_date: null,
      });
    });
  });

  it('clears form after successful submit', async () => {
    const onCreate = vi.fn();
    render(<TaskForm onCreate={onCreate} />);

    const input = screen.getByPlaceholderText('What needs to be done?');
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('expands to show detail fields', () => {
    render(<TaskForm onCreate={vi.fn()} />);
    expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('+ Add details'));
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
  });

  it('collapses detail fields', () => {
    render(<TaskForm onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText('+ Add details'));
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Fewer options'));
    expect(screen.queryByLabelText('Priority')).not.toBeInTheDocument();
  });

  it('sends custom priority and status', async () => {
    const onCreate = vi.fn();
    render(<TaskForm onCreate={onCreate} />);

    fireEvent.click(screen.getByText('+ Add details'));
    fireEvent.change(screen.getByPlaceholderText('What needs to be done?'), {
      target: { value: 'Urgent task' },
    });
    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'high' },
    });
    fireEvent.change(screen.getByLabelText('Status'), {
      target: { value: 'in_progress' },
    });
    fireEvent.click(screen.getByText('Add Task'));

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'high', status: 'in_progress' })
      );
    });
  });
});
