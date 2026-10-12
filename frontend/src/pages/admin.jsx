import { useEffect, useState } from 'react';
import api from '../api/axios';

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
  return d.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* ---------- component ---------- */

export default function Admin() {
  const [tab, setTab] = useState('users'); // 'users' | 'transactions'

  return (
    <div className="container">
      <header className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage users and review platform transactions.</p>
      </header>

      <div className="chip-row" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'users'}
          className={`chip ${tab === 'users' ? 'active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          role="tab"
          aria-selected={tab === 'transactions'}
          className={`chip ${tab === 'transactions' ? 'active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {tab === 'users' ? <UsersTab /> : <TransactionsTab />}
    </div>
  );
}

/* ---------- Users tab ---------- */

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      const list = Array.isArray(data) ? data : data.users || [];
      setUsers(list);
    } catch (err) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleSuspend = async (user) => {
    const isSuspended = user.role === 'suspended';
    const verb = isSuspended ? 'unsuspend' : 'suspend';

    if (!window.confirm(`Are you sure you want to ${verb} ${user.name || user.email}?`)) {
      return;
    }

    setBusyId(user._id);
    try {
      await api.put(`/admin/users/${user._id}/suspend`, {
        suspended: !isSuspended,
      });
      await load();
    } catch (err) {
      alert(err.message || `Failed to ${verb} user.`);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="page-loading">Loading users…</div>;
  if (error) return <div className="banner banner-error">{error}</div>;

  if (users.length === 0) {
    return (
      <div className="empty">
        <h3>No users</h3>
        <p>Once users register, they&apos;ll appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const suspended = u.role === 'suspended';
            return (
              <tr key={u._id}>
                <td>{u.name || '—'}</td>
                <td>{u.email}</td>
                <td>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      padding: '0.15rem 0.55rem',
                      borderRadius: '999px',
                      background: suspended
                        ? 'var(--danger-bg)'
                        : 'var(--gray-100)',
                      color: suspended ? 'var(--danger)' : 'var(--gray-700)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {u.role || 'user'}
                  </span>
                </td>
                <td>{formatDate(u.createdAt)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={suspended ? 'btn' : 'btn-danger'}
                    onClick={() => toggleSuspend(u)}
                    disabled={busyId === u._id || u.role === 'admin'}
                    title={
                      u.role === 'admin'
                        ? 'Admins cannot be suspended'
                        : suspended
                        ? 'Restore this account'
                        : 'Block this account'
                    }
                  >
                    {busyId === u._id
                      ? 'Working…'
                      : suspended
                      ? 'Unsuspend'
                      : 'Suspend'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Transactions tab ---------- */

function TransactionsTab() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get('/admin/transactions');
        const list = Array.isArray(data) ? data : data.transactions || [];
        if (alive) setTxns(list);
      } catch (err) {
        if (alive) setError(err.message || 'Failed to load transactions.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <div className="page-loading">Loading transactions…</div>;
  if (error) return <div className="banner banner-error">{error}</div>;

  if (txns.length === 0) {
    return (
      <div className="empty">
        <h3>No transactions yet</h3>
        <p>Bookings that create transactions will appear here.</p>
      </div>
    );
  }

  // Best-effort totals — works if amount is present
  const total = txns.reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div style={{ marginTop: '1rem' }}>
      <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
        {txns.length} transaction{txns.length === 1 ? '' : 's'} · Total{' '}
        <strong style={{ color: 'var(--primary)' }}>{formatZAR(total)}</strong>
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client</th>
              <th>Freelancer</th>
              <th>Gig / Reference</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'right' }}>Tax</th>
            </tr>
          </thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t._id}>
                <td>{formatDate(t.createdAt || t.date) || '—'}</td>
                <td>
                  {typeof t.clientId === 'object' && t.clientId
                    ? t.clientId.name || t.clientId.email
                    : '—'}
                </td>
                <td>
                  {typeof t.freelancerId === 'object' && t.freelancerId
                    ? t.freelancerId.name || t.freelancerId.email
                    : '—'}
                </td>
                <td>
                  {typeof t.gigId === 'object' && t.gigId
                    ? t.gigId.title
                    : t.gigTitle || '—'}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {formatZAR(t.amount || 0)}
                </td>
                <td style={{ textAlign: 'right', color: 'var(--warning)' }}>
                  {formatZAR(t.tax || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}