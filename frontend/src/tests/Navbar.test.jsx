import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const mockLogout = vi.fn();
let currentUser = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: currentUser, logout: mockLogout, loading: false }),
}));

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

describe('Navbar', () => {
  it('shows Log in and Sign up links when logged out', () => {
    currentUser = null;
    renderNavbar();
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  it('shows Browse Gigs to everyone', () => {
    currentUser = null;
    renderNavbar();
    expect(screen.getByRole('link', { name: /browse gigs/i })).toBeInTheDocument();
  });

  it('shows Dashboard and Income for freelancer', () => {
    currentUser = { name: 'Freelancer Test', role: 'freelancer' };
    renderNavbar();
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /income/i })).toBeInTheDocument();
    expect(screen.getByText(/freelancer test/i)).toBeInTheDocument();
  });

  it('hides Dashboard and Income for clients', () => {
    currentUser = { name: 'Client Test', role: 'client' };
    renderNavbar();
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /income/i })).not.toBeInTheDocument();
  });

  it('shows Admin link only for admins', () => {
    currentUser = { name: 'Admin Test', role: 'admin' };
    renderNavbar();
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument();
  });
});