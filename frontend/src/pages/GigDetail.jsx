import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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

export default function GigDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get(`/gigs/${id}`);
        const loaded = data.gig || data;
        if (alive) setGig(loaded);
      } catch (err) {
        if (alive) setError(err.message || 'Gig not found.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div className="page-loading">Loading gig…</div>;

  if (error) {
    return (
      <div className="container">
        <div className="banner banner-error" role="alert">
          {error}
        </div>
        <Link to="/gigs" className="btn mt-3">
          ← Back to gigs
        </Link>
      </div>
    );
  }

  if (!gig) return null;

  const freelancer =
    typeof gig.freelancerId === 'object' && gig.freelancerId !== null
      ? gig.freelancerId
      : null;

  const freelancerId = freelancer?._id || gig.freelancerId;
  const freelancerName =
    freelancer?.name || gig.freelancerName || 'Freelancer';

  const isOwner =
    user?._id && freelancerId && String(user._id) === String(freelancerId);

  const canBook =
    user && user.role === 'client' && !isOwner;

  return (
    <div className="container">
      <Link to="/gigs" className="btn-ghost mb-2" style={{ display: 'inline-block' }}>
        ← Back to gigs
      </Link>

      <article className="gig-detail">
        <header className="page-header">
          <h1>{gig.title}</h1>
          <p className="text-muted">
            {gig.category} · <strong className="gig-price">{formatZAR(gig.price)}</strong>
          </p>
          <p className="gig-by">Offered by {freelancerName}</p>
        </header>

        <section style={{ marginTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>About this gig</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{gig.description}</p>
        </section>

        <div className="mt-4">
          {canBook && (
            <button
              className="btn btn-primary"
              onClick={() => navigate(`/book/${gig._id}`)}
            >
              Book this gig
            </button>
          )}

          {!user && (
            <div className="banner banner-warning">
              <Link to="/login">Log in</Link> as a client to book this gig.
            </div>
          )}

          {user && user.role === 'freelancer' && !isOwner && (
            <div className="banner banner-warning">
              Only clients can book gigs. Switch to a client account to book.
            </div>
          )}

          {isOwner && (
            <div className="banner banner-success">
              This is your gig.{' '}
              <Link to={`/gigs/${gig._id}/edit`}>Edit it</Link> or view it in your{' '}
              <Link to="/dashboard">dashboard</Link>.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}