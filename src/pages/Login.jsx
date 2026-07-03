import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../App.jsx'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: colors.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      fontFamily: font.body,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: 16,
            background: colors.blue,
            color: '#fff',
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 22,
            marginBottom: 16,
          }}>
            UH
          </div>
          <h1 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, color: colors.text, margin: 0 }}>
            Welcome back
          </h1>
          <p style={{ color: colors.textMuted, marginTop: 6, fontSize: 14 }}>
            Log in to UniHub
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          {error && <p style={{ color: colors.red, fontSize: 13, marginBottom: 16 }}>{error}</p>}

          <button type="submit" disabled={loading} style={primaryButtonStyle}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted, fontSize: 14 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: colors.blueDark, fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontSize: 13,
  color: colors.textMuted,
  marginBottom: 6,
  fontWeight: 500,
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  background: colors.bg,
  color: colors.text,
  fontSize: 15,
  fontFamily: font.body,
  outline: 'none',
  boxSizing: 'border-box',
}

const primaryButtonStyle = {
  width: '100%',
  padding: '13px 0',
  borderRadius: 10,
  border: 'none',
  background: colors.blue,
  color: '#fff',
  fontFamily: font.body,
  fontWeight: 700,
  fontSize: 15,
  cursor: 'pointer',
}
