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
  it('renders search input and filter dropdowns', () => {
    render(<TaskFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getAllByText('Priority').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Sort By')).toBeInTheDocument();
    expect(screen.getByText('Order')).toBeInTheDocument();
  });

  it('calls onFilterChange when search is submitted', () => {
    const onFilterChange = vi.fn();
    render(<TaskFilters filters={defaultFilters} onFilterChange={onFilterChange} />);

    fireEvent.change(screen.getByPlaceholderText('Search tasks...'), {
      target: { value: 'hello' },
    });
    fireEvent.click(screen.getByText('Search'));

    expect(onFilterChange).toHaveBeenCalledWith({ search: 'hello' });
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
    const priorityLabel = priorityLabels.find(el => el.classList.contains('filter-label-text'));
    const prioritySelect = priorityLabel.closest('label').querySelector('select');
    fireEvent.change(prioritySelect, { target: { value: 'high' } });

    expect(onFilterChange).toHaveBeenCalledWith({ priority: 'high' });
  });

  it('shows active filter count when filters are active', () => {
    render(
      <TaskFilters
        filters={{ ...defaultFilters, status: 'todo', search: 'test' }}
        onFilterChange={vi.fn()}
      />
    );
    expect(screen.getByText('2 active')).toBeInTheDocument();
  });

  it('shows reset button when filters are active', () => {
    const onFilterChange = vi.fn();
    render(
      <TaskFilters
        filters={{ ...defaultFilters, status: 'todo' }}
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.click(screen.getByText('Reset all filters'));
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined, priority: undefined, search: undefined })
    );
  });

  it('does not show reset button when no filters are active', () => {
    render(<TaskFilters filters={defaultFilters} onFilterChange={vi.fn()} />);
    expect(screen.queryByText('Reset all filters')).not.toBeInTheDocument();
  });

  it('clears search and calls onFilterChange', () => {
    const onFilterChange = vi.fn();
    render(
      <TaskFilters
        filters={{ ...defaultFilters, search: 'hello' }}
        onFilterChange={onFilterChange}
      />
    );

    fireEvent.click(screen.getByText('×'));
    expect(onFilterChange).toHaveBeenCalledWith({ search: undefined });
  });
});
