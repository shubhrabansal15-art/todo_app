import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/LoginPage';

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

import { login } from '../api/auth';

beforeEach(() => {
  vi.clearAllMocks();
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

  it('calls login API and saveAuth on success', async () => {
    login.mockResolvedValue({
      access_token: 'abc123',
      user: { id: 1, email: 'test@test.com', created_at: '2026-01-01' },
    });
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('test@test.com', 'password123');
      expect(mockSaveAuth).toHaveBeenCalledWith('abc123', { id: 1, email: 'test@test.com', created_at: '2026-01-01' });
    });
  });

  it('shows error when login fails', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    render(<LoginPage onSwitchToRegister={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('Sign In'));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(mockSaveAuth).not.toHaveBeenCalled();
  });

  it('calls onSwitchToRegister when create one is clicked', () => {
    const onSwitch = vi.fn();
    render(<LoginPage onSwitchToRegister={onSwitch} />);
    fireEvent.click(screen.getByText('Create one'));
    expect(onSwitch).toHaveBeenCalled();
  });
});
