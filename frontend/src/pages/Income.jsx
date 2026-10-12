import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ---------- helpers ---------- */

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
  return d.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Normalise the backend response into a stable shape regardless of
 * minor field-name differences.
 */
function normaliseIncome(raw) {
  const r = raw || {};
  const totalIncome = Number(r.totalIncome ?? r.total ?? r.grossIncome ?? 0);
  const taxRate =
    r.taxRate !== undefined
      ? Number(r.taxRate)
      : r.taxPercentage !== undefined
      ? Number(r.taxPercentage) / 100
      : 0.15;
  const taxOwed = Number(r.taxOwed ?? r.tax ?? totalIncome * taxRate);
  const netIncome = Number(r.netIncome ?? r.net ?? totalIncome - taxOwed);
  const breakdown = Array.isArray(r.breakdown)
    ? r.breakdown
    : Array.isArray(r.transactions)
    ? r.transactions
    : [];
  const transactionCount = Number(
    r.transactionCount ?? r.count ?? breakdown.length
  );

  return { totalIncome, taxRate, taxOwed, netIncome, breakdown, transactionCount };
}

/* ---------- component ---------- */

export default function Income() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notReady, setNotReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get('/income');
        if (alive) setData(normaliseIncome(res.data));
      } catch (err) {
        if (!alive) return;
        // 404 = endpoint not built yet (Sibusiso still working on it)
        if (err.status === 404) {
          setNotReady(true);
        } else {
          setError(err.message || 'Failed to load income data.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="container">
      <header className="page-header">
        <h1>Income &amp; Estimated Tax</h1>
        <p>
          Track earnings from bookings
          {user?.name ? ` for ${user.name}` : ''} and view an estimate of your
          tax obligation.
        </p>
      </header>

      {loading && <div className="page-loading">Loading income data…</div>}

      {!loading && notReady && (
        <div className="empty">
          <h3>Income tracking is coming soon</h3>
          <p>
            The backend income endpoint hasn&apos;t been deployed yet. Your
            totals will appear here as soon as the booking API is live.
          </p>
          <Link to="/dashboard" className="btn btn-primary mt-2">
            Back to dashboard
          </Link>
        </div>
      )}

      {!loading && error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Top summary cards */}
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            <SummaryCard
              label="Total earned"
              value={formatZAR(data.totalIncome)}
              hint={`${data.transactionCount} booking${
                data.transactionCount === 1 ? '' : 's'
              }`}
              accent="primary"
            />
            <SummaryCard
              label={`Estimated tax (${Math.round(data.taxRate * 100)}%)`}
              value={formatZAR(data.taxOwed)}
              hint="Approximate — verify with a tax professional"
              accent="warning"
            />
            <SummaryCard
              label="Net after tax"
              value={formatZAR(data.netIncome)}
              hint="What you take home"
              accent="success"
            />
          </section>

          {/* Breakdown table */}
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              Transaction breakdown
            </h2>

            {data.breakdown.length === 0 ? (
              <div className="empty">
                <h3>No transactions yet</h3>
                <p>
                  Once a client books one of your gigs, the transaction will
                  appear here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Gig</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Tax</th>
                      <th style={{ textAlign: 'right' }}>Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((b, i) => {
                      const amount = Number(b.amount || b.price || 0);
                      const tax = Number(b.tax ?? amount * data.taxRate);
                      const net = amount - tax;
                      return (
                        <tr key={b._id || i}>
                          <td>{formatDate(b.date || b.createdAt) || '—'}</td>
                          <td>{b.gigTitle || b.title || 'Gig'}</td>
                          <td style={{ textAlign: 'right' }}>
                            {formatZAR(amount)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              color: 'var(--warning)',
                            }}
                          >
                            −{formatZAR(tax)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatZAR(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* ---------- small sub-component ---------- */

function SummaryCard({ label, value, hint, accent }) {
  const accentColour = {
    primary: 'var(--primary)',
    success: 'var(--success)',
    warning: 'var(--warning)',
  }[accent] || 'var(--gray-700)';

  return (
    <div
      className="gig-card"
      style={{ borderLeft: `4px solid ${accentColour}`, padding: '1rem 1.1rem' }}
    >
      <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
        {label}
      </p>
      <p
        style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          margin: '0.35rem 0',
          color: accentColour,
        }}
      >
        {value}
      </p>
      {hint && (
        <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  );
}