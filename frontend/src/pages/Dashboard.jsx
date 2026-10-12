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

export default function Dashboard() {
  const { user } = useAuth();
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadGigs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/gigs/mine');
      const list = Array.isArray(data) ? data : data.gigs || [];
      setGigs(list);
    } catch (err) {
      setError(err.message || 'Failed to load your gigs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGigs();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this gig? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await api.delete(`/gigs/${id}`);
      setGigs((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete gig.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Freelancer Dashboard</h1>
          <p>Welcome back{user?.name ? `, ${user.name}` : ''}. Manage your gigs here.</p>
        </div>
        <Link to="/gigs/new" className="btn btn-primary">+ New gig</Link>
      </header>

      {loading && <div className="page-loading">Loading your gigs…</div>}

      {!loading && error && (
        <div className="banner banner-error" role="alert">{error}</div>
      )}

      {!loading && !error && gigs.length === 0 && (
        <div className="empty">
          <h3>No gigs yet</h3>
          <p>Create your first gig to start earning.</p>
          <Link to="/gigs/new" className="btn btn-primary mt-2">Create a gig</Link>
        </div>
      )}

      {!loading && !error && gigs.length > 0 && (
        <>
          <p className="text-muted mt-2">
            You have {gigs.length} gig{gigs.length === 1 ? '' : 's'}.
          </p>
          <div className="gig-grid mt-2">
            {gigs.map((gig) => (
              <article key={gig._id} className="gig-card">
                <h3>{gig.title}</h3>
                <div className="gig-meta">
                  <span>{gig.category || 'Other'}</span>
                  <span className="gig-price">{formatZAR(gig.price)}</span>
                </div>
                <p className="gig-desc">
                  {gig.description?.length > 120
                    ? `${gig.description.slice(0, 120)}…`
                    : gig.description}
                </p>
                <p className="gig-by">Status: {gig.status || 'active'}</p>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <Link to={`/gigs/${gig._id}/edit`} className="btn">Edit</Link>
                  <Link to={`/gigs/${gig._id}`} className="btn btn-ghost">View</Link>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(gig._id)}
                    disabled={deletingId === gig._id}
                  >
                    {deletingId === gig._id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}