import { useParams, Link } from 'react-router-dom';

export default function GigDetail() {
  const { id } = useParams();
  return (
    <div className="container">
      <header className="page-header">
        <h1>Gig details</h1>
        <p className="text-muted">Gig ID: <code>{id}</code></p>
        <p>Full gig detail page coming in Step 10.</p>
      </header>
      <Link to="/gigs" className="btn">← Back to gigs</Link>
    </div>
  );
}