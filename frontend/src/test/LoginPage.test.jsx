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

import LoginPage from '../pages/LoginPage';
import { useAuth } from '../context/AuthContext';
import { AuthProvider } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const mockLogin = vi.fn();

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({
    login: mockLogin,
    register: vi.fn(),
    logout: vi.fn(),
    user: null,
    loading: false,
    isAuthenticated: false,
  });
});

describe('LoginPage', () => {
  it('renders email and password fields', () => {
    render(<LoginPage onSwitchToRegister={vi.fn()} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('renders branding', () => {
    render(<LoginPage onSwitchToRegister={vi.fn()} />);
    expect(screen.getByText('Taskflow')).toBeInTheDocument();
    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
  });

  it('shows validation error when submitting empty form', async () => {
    render(<LoginPage onSwitchToRegister={vi.fn()} />);
    fireEvent.click(screen.getByText('Sign In'));
    expect(await screen.findByText('Please enter email and password')).toBeInTheDocument();
  });

  it('calls login on success', async () => {
    mockLogin.mockResolvedValue({ user: { id: 'abc' }, session: {} });
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('shows error when login fails', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid email or password'));
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Sign In'));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('calls onSwitchToRegister when create one is clicked', () => {
    const onSwitch = vi.fn();
    render(<LoginPage onSwitchToRegister={onSwitch} />);
    fireEvent.click(screen.getByText('Create one'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
