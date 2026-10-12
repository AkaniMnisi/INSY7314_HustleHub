import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = [
  'Design',
  'Development',
  'Writing',
  'Marketing',
  'Photography',
  'Video',
  'Other',
];

const EMPTY = {
  title: '',
  description: '',
  price: '',
  category: 'Design',
  status: 'active',
};

export default function GigForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  // Load existing gig when editing
  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get(`/gigs/${id}`);
        const gig = data.gig || data;
        if (alive) {
          setForm({
            title: gig.title || '',
            description: gig.description || '',
            price: gig.price ?? '',
            category: gig.category || 'Other',
            status: gig.status || 'active',
          });
        }
      } catch (err) {
        if (alive) setServerError(err.message || 'Failed to load gig.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    else if (form.title.trim().length < 5) errs.title = 'Title must be at least 5 characters.';
    else if (form.title.trim().length > 120) errs.title = 'Title must be 120 characters or fewer.';

    if (!form.description.trim()) errs.description = 'Description is required.';
    else if (form.description.trim().length < 20) errs.description = 'Description must be at least 20 characters.';

    const priceNum = Number(form.price);
    if (form.price === '' || isNaN(priceNum)) errs.price = 'Price is required.';
    else if (priceNum <= 0) errs.price = 'Price must be greater than zero.';

    if (!CATEGORIES.includes(form.category)) errs.category = 'Choose a category.';
    if (!['active', 'paused'].includes(form.status)) errs.status = 'Choose a status.';

    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category,
        status: form.status,
      };

      if (isEdit) {
        await api.put(`/gigs/${id}`, payload);
      } else {
        await api.post('/gigs', payload);
      }

      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Failed to save gig.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading gig…</div>;

  return (
    <div className="container">
      <Link to="/dashboard" className="btn-ghost mb-2" style={{ display: 'inline-block' }}>
        ← Back to dashboard
      </Link>

      <div className="auth-page" style={{ padding: 0, justifyContent: 'flex-start' }}>
        <form className="auth-form" onSubmit={onSubmit} noValidate style={{ maxWidth: 640 }}>
          <h1>{isEdit ? 'Edit gig' : 'Create a new gig'}</h1>
          <p className="hint">
            {isEdit ? 'Update the details of your gig.' : 'List your service for clients to book.'}
          </p>

          {serverError && <div className="banner banner-error">{serverError}</div>}

          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. Modern Logo Design"
              maxLength={120}
              required
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </label>

          <label>
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={onChange}
              placeholder="Describe what you will deliver, your process, and any extras."
              rows={6}
              style={{
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                resize: 'vertical',
              }}
              required
            />
            {errors.description && <span className="field-error">{errors.description}</span>}
          </label>

          <label>
            Price (ZAR)
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={onChange}
              placeholder="e.g. 850"
              required
            />
            {errors.price && <span className="field-error">{errors.price}</span>}
          </label>

          <label>
            Category
            <select
              name="category"
              value={form.category}
              onChange={onChange}
              style={{
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && <span className="field-error">{errors.category}</span>}
          </label>

          <label>
            Status
            <select
              name="status"
              value={form.status}
              onChange={onChange}
              style={{
                padding: '0.65rem 0.85rem',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
              }}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            {errors.status && <span className="field-error">{errors.status}</span>}
          </label>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create gig'}
            </button>
            <Link to="/dashboard" className="btn">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}