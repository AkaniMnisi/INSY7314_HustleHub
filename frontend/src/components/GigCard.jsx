import { Link } from 'react-router-dom';

/**
 * Normalise whatever the backend returns for a gig into a consistent shape.
 * Handles: populated freelancerId (object) vs raw (string).
 */
function normalizeGig(gig) {
  const freelancer =
    typeof gig.freelancerId === 'object' && gig.freelancerId !== null
      ? gig.freelancerId
      : null;

  return {
    id: gig._id,
    title: gig.title || 'Untitled gig',
    description: gig.description || '',
    price: Number(gig.price) || 0,
    category: gig.category || 'Other',
    freelancerName: freelancer?.name || gig.freelancerName || 'Freelancer',
    status: gig.status || 'active',
  };
}

function formatZAR(value) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function GigCard({ gig }) {
  const g = normalizeGig(gig);
  const preview =
    g.description.length > 140
      ? `${g.description.slice(0, 140)}…`
      : g.description;

  return (
    <article className="gig-card">
      <h3>{g.title}</h3>

      <div className="gig-meta">
        <span>{g.category}</span>
        <span className="gig-price">{formatZAR(g.price)}</span>
      </div>

      {preview && <p className="gig-desc">{preview}</p>}

      <p className="gig-by">by {g.freelancerName}</p>

      <Link to={`/gigs/${g.id}`} className="btn">
        View details
      </Link>
    </article>
  );
}