import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterPage from '../pages/RegisterPage';

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

const mockSaveAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    saveAuth: mockSaveAuth,
    user: null,
    token: null,
    loading: false,
    isAuthenticated: false,
    logout: vi.fn(),
  }),
}));

import { register } from '../api/auth';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RegisterPage', () => {
  it('renders email, password, and confirm password fields', () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders branding', () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);
    expect(screen.getByText('Taskflow')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
  });

  it('shows error for short password', async () => {
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('calls register API and saveAuth on success', async () => {
    register.mockResolvedValue({
      access_token: 'abc123',
      user: { id: 1, email: 'test@test.com', created_at: '2026-01-01' },
    });
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockSaveAuth).toHaveBeenCalledWith('abc123', { id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    });
  });

  it('shows error when registration fails', async () => {
    register.mockRejectedValue(new Error('An account with this email already exists'));
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('An account with this email already exists')).toBeInTheDocument();
  });

  it('calls onSwitchToLogin when sign in is clicked', () => {
    const onSwitch = vi.fn();
    render(<RegisterPage onSwitchToLogin={onSwitch} />);
    fireEvent.click(screen.getByText('Sign in'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
