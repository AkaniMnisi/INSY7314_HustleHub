import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container text-center" style={{ padding: '5rem 1rem' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
      <p className="text-muted mb-3">This page doesn't exist.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}