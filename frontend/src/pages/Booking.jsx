import { useParams, Link } from 'react-router-dom';

export default function Booking() {
  const { gigId } = useParams();
  return (
    <div className="container">
      <header className="page-header">
        <h1>Book this gig</h1>
        <p className="text-muted">Gig ID: <code>{gigId}</code></p>
        <p>Booking form coming in Step 12.</p>
      </header>
      <Link to="/gigs" className="btn">← Back to gigs</Link>
    </div>
  );
}