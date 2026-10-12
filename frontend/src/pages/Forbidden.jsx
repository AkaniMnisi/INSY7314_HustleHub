import { Link } from 'react-router-dom';

export default function Forbidden() {
  return (
    <div className="container text-center" style={{ padding: '5rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>403</h1>
      <p className="text-muted mb-3">You don't have permission to view this page.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}