import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock the useAuth hook so we can control user state per test
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../context/AuthContext';

function setup({ user = null, loading = false, allowedRoles } = {}) {
  useAuth.mockReturnValue({ user, loading });

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute allowedRoles={allowedRoles}>
              <div>Secret Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/403" element={<div>Forbidden Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows a loading state while auth is loading', () => {
    setup({ loading: true });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /login', () => {
    setup({ user: null });
    expect(screen.getByText(/login page/i)).toBeInTheDocument();
  });

  it('renders children when no role restriction is set and user is logged in', () => {
    setup({ user: { role: 'client', name: 'Test' } });
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('renders children when the user role is allowed', () => {
    setup({ user: { role: 'freelancer' }, allowedRoles: ['freelancer'] });
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('redirects to /403 when the user role is not allowed', () => {
    setup({ user: { role: 'client' }, allowedRoles: ['freelancer'] });
    expect(screen.getByText(/forbidden page/i)).toBeInTheDocument();
  });

  it('allows any role if none is specified', () => {
    setup({ user: { role: 'client' } });
    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });
});