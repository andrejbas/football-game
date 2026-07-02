import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { apiErrorMessage } from '../lib/format'

export default function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, token } = await authApi.register(form)
      setAuth({ user, token })
      navigate('/dashboard')
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-mark">
            <Trophy size={28} color="#fff" />
          </div>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Start building your football dynasty</p>
        </div>

        {error ? (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Manager name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Your name"
              value={form.name}
              onChange={update('name')}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password_confirmation">
              Confirm password
            </label>
            <input
              id="password_confirmation"
              type="password"
              className="form-input"
              placeholder="Re-enter password"
              value={form.password_confirmation}
              onChange={update('password_confirmation')}
              autoComplete="new-password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg mt-2" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          {'Already have an account? '}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
