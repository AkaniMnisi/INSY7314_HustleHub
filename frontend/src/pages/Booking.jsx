import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function formatZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export default function Booking() {
  const { gigId } = useParams();
  const navigate = useNavigate();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmed, setConfirmed] = useState(null);

  // Load the gig being booked
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/gigs/${gigId}`);
        const loaded = data.gig || data;
        if (alive) setGig(loaded);
      } catch (err) {
        if (alive) setLoadError(err.message || 'Could not load this gig.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [gigId]);

  const onConfirm = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const { data } = await api.post('/bookings', { gigId });
      setConfirmed(data.booking || data);
    } catch (err) {
      setSubmitError(err.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading gig…</div>;

  if (loadError) {
    return (
      <div className="container">
        <div className="banner banner-error">{loadError}</div>
        <Link to="/gigs" className="btn mt-3">← Back to gigs</Link>
      </div>
    );
  }

  if (!gig) return null;

  // -------- Success screen --------
  if (confirmed) {
    return (
      <div className="container">
        <div
          className="auth-page"
          style={{ padding: 0, justifyContent: 'flex-start' }}
        >
          <div className="auth-form" style={{ maxWidth: 560 }}>
            <div className="banner banner-success">
              Booking confirmed! The freelancer will be notified.
            </div>

            <h1 style={{ marginTop: '0.5rem' }}>Booking summary</h1>

            <div className="gig-meta" style={{ justifyContent: 'space-between' }}>
              <span>Gig</span>
              <strong>{gig.title}</strong>
            </div>
            <div className="gig-meta" style={{ justifyContent: 'space-between' }}>
              <span>Amount</span>
              <strong className="gig-price">{formatZAR(gig.price)}</strong>
            </div>
            {confirmed._id && (
              <div className="gig-meta" style={{ justifyContent: 'space-between' }}>
                <span>Booking ID</span>
                <code style={{ fontSize: '0.8rem' }}>{confirmed._id}</code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Link to="/bookings" className="btn btn-primary">View my bookings</Link>
              <Link to="/gigs" className="btn">Browse more gigs</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------- Confirmation screen --------
  return (
    <div className="container">
      <Link to={`/gigs/${gig._id}`} className="btn-ghost mb-2" style={{ display: 'inline-block' }}>
        ← Back to gig
      </Link>

      <div className="auth-page" style={{ padding: 0, justifyContent: 'flex-start' }}>
        <div className="auth-form" style={{ maxWidth: 560 }}>
          <h1>Confirm your booking</h1>
          <p className="hint">
            This is a simulated payment. No real money changes hands.
          </p>

          {submitError && <div className="banner banner-error">{submitError}</div>}

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)' }}>
            <div className="gig-meta" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Gig</span>
              <strong>{gig.title}</strong>
            </div>
            <div className="gig-meta" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Category</span>
              <span>{gig.category || 'Other'}</span>
            </div>
            <div className="gig-meta" style={{ justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Amount</span>
              <strong className="gig-price">{formatZAR(gig.price)}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              className="btn btn-primary"
              onClick={onConfirm}
              disabled={submitting}
            >
              {submitting ? 'Confirming…' : 'Confirm booking'}
            </button>
            <Link to={`/gigs/${gig._id}`} className="btn">Cancel</Link>
          </div>
        </div>
      </div>
    </div>
  );
}