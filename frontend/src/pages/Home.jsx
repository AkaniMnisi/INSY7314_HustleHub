import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1>Find the perfect freelancer, fast.</h1>
        <p>
          Browse thousands of gigs from skilled professionals. Book in seconds.
          No middlemen. No surprises.
        </p>
        <div className="hero-actions">
          <Link to="/gigs" className="btn btn-primary">Browse Gigs</Link>
          <Link to="/register" className="btn btn-ghost">Become a Freelancer</Link>
        </div>
      </section>

      {/* Trust / features row */}
      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>Why HustleHub</h2>
          </div>
          <div className="gig-grid">
            <div className="gig-card">
              <h3>Secure by design</h3>
              <p className="gig-desc">
                JWT authentication, role-based access, and validated inputs on every endpoint.
              </p>
            </div>
            <div className="gig-card">
              <h3>Transparent pricing</h3>
              <p className="gig-desc">
                Every gig lists its price up front. Track your earnings and estimated tax in real time.
              </p>
            </div>
            <div className="gig-card">
              <h3>Instant booking</h3>
              <p className="gig-desc">
                Book any gig in one click. Transactions are recorded automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA strip */}
      <section className="section" style={{ background: 'white', borderTop: '1px solid var(--gray-200)' }}>
        <div className="section-inner text-center">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ready to get started?</h2>
          <p className="text-muted mb-3">Create a free account in under a minute.</p>
          <Link to="/register" className="btn btn-primary">Create account</Link>
        </div>
      </section>
    </>
  );
}