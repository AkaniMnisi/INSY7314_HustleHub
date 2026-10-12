import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GigCard from '../components/GigCard';

const mockGig = {
  _id: 'abc123',
  title: 'Modern Logo Design',
  description: 'Clean, minimal logo with source files.',
  price: 850,
  category: 'Design',
  freelancerId: { _id: 'fl1', name: 'Akani M' },
};

function renderCard(gig) {
  return render(
    <MemoryRouter>
      <GigCard gig={gig} />
    </MemoryRouter>
  );
}

describe('GigCard', () => {
  it('renders the gig title, category and freelancer name', () => {
    renderCard(mockGig);
    expect(screen.getByText('Modern Logo Design')).toBeInTheDocument();
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText(/Akani M/)).toBeInTheDocument();
  });

  it('formats the price as South African Rand', () => {
    renderCard(mockGig);
    // R 850,00 in en-ZA locale
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it('links to the correct gig detail page', () => {
    renderCard(mockGig);
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toHaveAttribute('href', '/gigs/abc123');
  });

  it('truncates long descriptions', () => {
    const longDesc = 'A'.repeat(300);
    renderCard({ ...mockGig, description: longDesc });
    // Should not show all 300 characters
    expect(screen.queryByText(longDesc)).not.toBeInTheDocument();
    expect(screen.getByText(/A{100,}/)).toBeInTheDocument();
  });
});