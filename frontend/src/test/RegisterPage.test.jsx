import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(),
  },
}));

const mockRegister = vi.fn();

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import RegisterPage from '../pages/RegisterPage';
import { useAuth } from '../context/AuthContext';

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({
    login: vi.fn(),
    register: mockRegister,
    logout: vi.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
  });
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

  it('calls register on success', async () => {
    mockRegister.mockResolvedValue({ user: { id: 'abc' }, session: {} });
    render(<RegisterPage onSwitchToLogin={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows error when registration fails', async () => {
    mockRegister.mockRejectedValue(new Error('An account with this email already exists'));
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
