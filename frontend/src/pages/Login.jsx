import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setServerError('');
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const errs = {};
    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    if (!form.password) errs.password = 'Password is required.';
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      const redirect = location.state?.from?.pathname;
      if (redirect) {
        navigate(redirect, { replace: true });
      } else if (loggedInUser.role === 'freelancer') {
        navigate('/dashboard');
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/gigs');
      }
    } catch (err) {
      setServerError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Welcome back</h1>
        <p className="hint">Log in to book or manage your gigs.</p>

        {justRegistered && (
          <div className="banner banner-success">
            Account created. Please log in.
          </div>
        )}

        {serverError && (
          <div className="banner banner-error" role="alert">
            {serverError}
          </div>
        )}

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
            required
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
            required
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <p className="hint">
          New to HustleHub? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}