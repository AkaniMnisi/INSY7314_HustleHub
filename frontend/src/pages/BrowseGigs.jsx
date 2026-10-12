import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import GigCard from '../components/GigCard';

export default function BrowseGigs() {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/gigs');
        // Backend may return an array directly OR { gigs: [...] }
        const list = Array.isArray(data) ? data : data.gigs || [];
        if (alive) setGigs(list);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load gigs.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    gigs.forEach((g) => g.category && set.add(g.category));
    return Array.from(set).sort();
  }, [gigs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gigs.filter((g) => {
      const matchesQuery =
        !q ||
        (g.title || '').toLowerCase().includes(q) ||
        (g.description || '').toLowerCase().includes(q);
      const matchesCategory = !category || g.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [gigs, query, category]);

  return (
    <div className="container">
      <header className="page-header">
        <h1>Browse Gigs</h1>
        <p>Discover services from skilled freelancers.</p>
      </header>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by title or description…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search gigs"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="page-loading">Loading gigs…</div>}

      {!loading && error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && gigs.length === 0 && (
        <div className="empty">
          <h3>No gigs yet</h3>
          <p>Check back soon — freelancers are still listing their services.</p>
        </div>
      )}

      {!loading && !error && gigs.length > 0 && filtered.length === 0 && (
        <div className="empty">
          <h3>No matches</h3>
          <p>Try a different search or clear the category filter.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="text-muted mt-2">
            Showing {filtered.length} of {gigs.length} gig
            {gigs.length === 1 ? '' : 's'}
          </p>
          <div className="gig-grid mt-2">
            {filtered.map((g) => (
              <GigCard key={g._id} gig={g} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}