import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from '../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'client',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const errs = {};
    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;

    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;

    const confirmErr = validateConfirmPassword(form.password, form.confirm);
    if (confirmErr) errs.confirm = confirmErr;

    if (!['client', 'freelancer'].includes(form.role)) {
      errs.role = 'Choose Client or Freelancer.';
    }
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
      await register(form);
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <h1>Create your HustleHub account</h1>
        <p className="hint">Free forever. No credit card required.</p>

        {serverError && (
          <div className="banner banner-error" role="alert">
            {serverError}
          </div>
        )}

        <label>
          Name
          <input
            name="name"
            type="text"
            value={form.name}
            onChange={onChange}
            autoComplete="name"
            required
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </label>

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
            autoComplete="new-password"
            required
          />
          {errors.password && <span className="field-error">{errors.password}</span>}
        </label>

        <label>
          Confirm password
          <input
            name="confirm"
            type="password"
            value={form.confirm}
            onChange={onChange}
            autoComplete="new-password"
            required
          />
          {errors.confirm && <span className="field-error">{errors.confirm}</span>}
        </label>

        <fieldset>
          <legend>I want to…</legend>
          <label>
            <input
              type="radio"
              name="role"
              value="client"
              checked={form.role === 'client'}
              onChange={onChange}
            />
            Hire freelancers
          </label>
          <label>
            <input
              type="radio"
              name="role"
              value="freelancer"
              checked={form.role === 'freelancer'}
              onChange={onChange}
            />
            Offer services
          </label>
          {errors.role && <span className="field-error">{errors.role}</span>}
        </fieldset>

        <button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="hint">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}