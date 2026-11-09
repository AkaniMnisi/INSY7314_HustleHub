import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function formatZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

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
        if (alive) setData(res.data);
      } catch (err) {
        if (!alive) return;
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

  if (loading) return <div className="page-loading">Loading financial insights…</div>;

  if (notReady) {
    return (
      <div className="container">
        <div className="empty">
          <h3>Income tracking is coming soon</h3>
          <p>Your totals will appear here as soon as the API is live.</p>
          <Link to="/dashboard" className="btn btn-primary mt-2">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (error) return <div className="banner banner-error" role="alert">{error}</div>;
  if (!data) return null;

  // Ensure we have arrays to prevent Recharts from crashing
  const monthlyData = data.monthly || [];
  const breakdown = data.breakdown || [];

  return (
    <div className="container">
      <header className="page-header">
        <h1>Income &amp; Tax Dashboard</h1>
        <p>Track earnings, estimated SARS tax, and net income for {user?.name}.</p>
      </header>

      {/* Top Summary Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="gig-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Gross Income</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)', margin: '0.5rem 0' }}>
            {formatZAR(data.totalIncome)}
          </p>
        </div>
        <div className="gig-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Estimated Tax Owed</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)', margin: '0.5rem 0' }}>
            {formatZAR(data.taxOwed)}
          </p>
        </div>
        <div className="gig-card" style={{ borderLeft: '4px solid var(--success)' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Net Income</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)', margin: '0.5rem 0' }}>
            {formatZAR(data.netIncome)}
          </p>
        </div>
      </section>

      {/* Recharts Bar Chart */}
      <section className="gig-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Monthly Breakdown</h2>
        {monthlyData.length > 0 ? (
          <div style={{ width: '100%', height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--gray-500)' }} />
                <YAxis tickFormatter={(val) => `R${val}`} axisLine={false} tickLine={false} tick={{ fill: 'var(--gray-500)' }} />
                <Tooltip formatter={(value) => formatZAR(value)} cursor={{ fill: 'var(--gray-100)' }} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="income" name="Income" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tax" name="Tax" fill="var(--danger)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted">No monthly data available yet.</p>
        )}
      </section>

      {/* Transaction Breakdown Table */}
      <section>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Transaction Breakdown</h2>
        {breakdown.length === 0 ? (
          <div className="empty">
            <h3>No transactions yet</h3>
            <p>Once you complete a booking, it will appear here.</p>
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
                {breakdown.map((b, i) => {
                  const amount = Number(b.amount) || 0;
                  const tax = Number(b.tax) || 0;
                  const net = amount - tax;
                  return (
                    <tr key={b._id || i}>
                      <td>{b.date ? new Date(b.date).toLocaleDateString('en-ZA') : '—'}</td>
                      <td>{b.gigTitle || 'Gig'}</td>
                      <td style={{ textAlign: 'right' }}>{formatZAR(amount)}</td>
                      <td style={{ textAlign: 'right', color: 'var(--danger)' }}>−{formatZAR(tax)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatZAR(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}