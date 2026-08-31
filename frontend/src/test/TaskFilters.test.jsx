import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TaskFilters from '../components/TaskFilters';

const defaultFilters = {
  status: undefined,
  priority: undefined,
  completed: undefined,
  search: undefined,
  sort_by: 'created_at',
  order: 'desc',
};

describe('TaskFilters', () => {
  it('renders filter dropdowns for status, priority, completed, sort, and order', () => {
    render(<TaskFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getAllByText('Priority').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('Order')).toBeInTheDocument();
  });

  it('calls onFilterChange with status filter', () => {
    const onFilterChange = vi.fn();
    render(<TaskFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    const statusSelect = screen.getByText('Status').closest('label').querySelector('select');
    fireEvent.change(statusSelect, { target: { value: 'todo' } });

    expect(onFilterChange).toHaveBeenCalledWith({ status: 'todo' });
  });

  it('calls onFilterChange with priority filter', () => {
    const onFilterChange = vi.fn();
    render(<TaskFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    const priorityLabels = screen.getAllByText('Priority');
    const priorityLabel = priorityLabels.find(el => el.closest('label'));
    const prioritySelect = priorityLabel.closest('label').querySelector('select');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(onFilterChange).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('shows reset button when filters are active', () => {
    const onFilterChange = vi.fn();
    render(
      <TaskFilters
        filters={{ ...defaultFilters, status: 'todo' }}
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.click(screen.getByText('Reset all'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined, priority: undefined, search: undefined })
    );
  });

  it('does not show reset button when no filters are active', () => {
    render(<TaskFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.queryByText('Reset all')).not.toBeInTheDocument();
  });
});
