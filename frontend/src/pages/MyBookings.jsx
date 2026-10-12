import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function bookingGigTitle(b) {
  // booking.gigId may be populated (object) or a string
  if (b.gigId && typeof b.gigId === 'object') return b.gigId.title || 'Untitled gig';
  if (b.gig && typeof b.gig === 'object') return b.gig.title || 'Untitled gig';
  return b.gigTitle || 'Untitled gig';
}

function counterpartyName(b, role) {
  // For a client, show freelancer name; for a freelancer, show client name.
  const field = role === 'client' ? 'freelancerId' : 'clientId';
  const obj = b[field];
  if (obj && typeof obj === 'object') return obj.name || 'User';
  return 'User';
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/bookings');
        const list = Array.isArray(data) ? data : data.bookings || [];
        if (alive) setBookings(list);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load bookings.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const heading =
    user?.role === 'freelancer' ? 'Bookings on your gigs' : 'My Bookings';

  return (
    <div className="container">
      <header className="page-header">
        <h1>{heading}</h1>
        <p>
          {user?.role === 'freelancer'
            ? 'Clients who have booked your services.'
            : 'Gigs you have booked.'}
        </p>
      </header>

      {loading && <div className="page-loading">Loading bookings…</div>}

      {!loading && error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty">
          <h3>No bookings yet</h3>
          {user?.role === 'client' ? (
            <>
              <p>Browse gigs and book one to see it here.</p>
              <Link to="/gigs" className="btn btn-primary mt-2">Browse gigs</Link>
            </>
          ) : (
            <p>When clients book your gigs, they will appear here.</p>
          )}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="gig-grid mt-2">
          {bookings.map((b) => (
            <article key={b._id} className="gig-card">
              <h3>{bookingGigTitle(b)}</h3>

              <div className="gig-meta">
                <span>{b.status || 'confirmed'}</span>
                <span className="gig-price">{formatZAR(b.amount || b.price || 0)}</span>
              </div>

              <p className="gig-by">
                {user?.role === 'client' ? 'Freelancer' : 'Client'}:{' '}
                {counterpartyName(b, user?.role)}
              </p>

              {b.createdAt && (
                <p className="gig-by">Booked {formatDate(b.createdAt)}</p>
              )}

              {b.gigId && typeof b.gigId === 'object' && b.gigId._id && (
                <Link to={`/gigs/${b.gigId._id}`} className="btn">View gig</Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function bookingGigTitle(b) {
  // booking.gigId may be populated (object) or a string
  if (b.gigId && typeof b.gigId === 'object') return b.gigId.title || 'Untitled gig';
  if (b.gig && typeof b.gig === 'object') return b.gig.title || 'Untitled gig';
  return b.gigTitle || 'Untitled gig';
}

function counterpartyName(b, role) {
  // For a client, show freelancer name; for a freelancer, show client name.
  const field = role === 'client' ? 'freelancerId' : 'clientId';
  const obj = b[field];
  if (obj && typeof obj === 'object') return obj.name || 'User';
  return 'User';
}

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/bookings');
        const list = Array.isArray(data) ? data : data.bookings || [];
        if (alive) setBookings(list);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load bookings.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const heading =
    user?.role === 'freelancer' ? 'Bookings on your gigs' : 'My Bookings';

  return (
    <div className="container">
      <header className="page-header">
        <h1>{heading}</h1>
        <p>
          {user?.role === 'freelancer'
            ? 'Clients who have booked your services.'
            : 'Gigs you have booked.'}
        </p>
      </header>

      {loading && <div className="page-loading">Loading bookings…</div>}

      {!loading && error && <div className="banner banner-error">{error}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="empty">
          <h3>No bookings yet</h3>
          {user?.role === 'client' ? (
            <>
              <p>Browse gigs and book one to see it here.</p>
              <Link to="/gigs" className="btn btn-primary mt-2">Browse gigs</Link>
            </>
          ) : (
            <p>When clients book your gigs, they will appear here.</p>
          )}
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="gig-grid mt-2">
          {bookings.map((b) => (
            <article key={b._id} className="gig-card">
              <h3>{bookingGigTitle(b)}</h3>

              <div className="gig-meta">
                <span>{b.status || 'confirmed'}</span>
                <span className="gig-price">{formatZAR(b.amount || b.price || 0)}</span>
              </div>

              <p className="gig-by">
                {user?.role === 'client' ? 'Freelancer' : 'Client'}:{' '}
                {counterpartyName(b, user?.role)}
              </p>

              {b.createdAt && (
                <p className="gig-by">Booked {formatDate(b.createdAt)}</p>
              )}

              {b.gigId && typeof b.gigId === 'object' && b.gigId._id && (
                <Link to={`/gigs/${b.gigId._id}`} className="btn">View gig</Link>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}