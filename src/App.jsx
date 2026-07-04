import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { colors, font } from './theme.js'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  if (checkingSession) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: colors.textMuted, fontFamily: font.body }}>Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={session ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/"
        element={
          session ? (
            <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: font.body }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: colors.text, fontSize: 18, fontWeight: 600 }}>You're logged in!</p>
                <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20 }}>{session.user.email}</p>
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: colors.blue,
                    color: '#fff',
                    fontFamily: font.body,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  )
}
