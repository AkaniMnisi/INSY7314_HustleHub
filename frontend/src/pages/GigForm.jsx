import { Link } from 'react-router-dom';

export default function GigForm() {
  return (
    <div className="container">
      <header className="page-header">
        <h1>Create or edit a gig</h1>
        <p>Full gig form coming in Step 11.</p>
      </header>
      <Link to="/dashboard" className="btn">← Back to dashboard</Link>
    </div>
  );
}