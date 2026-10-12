import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, user: null, loading: false }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe('Login page', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockNavigate.mockReset();
  });

  it('renders the login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows a validation error for an invalid email', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('shows a validation error when the password is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login with the submitted credentials', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'client' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password1!');
    });
  });

  it('shows a backend error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce({ message: 'Invalid credentials' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('redirects a client to /gigs after successful login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'client' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/gigs');
    });
  });

  it('redirects a freelancer to /dashboard after successful login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'freelancer' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('redirects an admin to /admin after successful login', async () => {
    mockLogin.mockResolvedValueOnce({ role: 'admin' });
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });
  });
});