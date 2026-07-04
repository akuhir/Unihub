import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabaseClient'
import { colors, font } from './theme.js'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Menu from './pages/Menu.jsx'
import Feed from './pages/Feed.jsx'
import FindFriends from './pages/FindFriends.jsx'
import Chats from './pages/Chats.jsx'
import Notifications from './pages/Notifications.jsx'

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
        element={session ? <AppShell session={session}><Feed session={session} /></AppShell> : <Navigate to="/login" />}
      />
      <Route
        path="/find-friends"
        element={session ? <AppShell session={session}><FindFriends session={session} /></AppShell> : <Navigate to="/login" />}
      />
      <Route
        path="/chats"
        element={session ? <AppShell session={session}><Chats session={session} /></AppShell> : <Navigate to="/login" />}
      />
      <Route
        path="/notifications"
        element={session ? <AppShell session={session}><Notifications session={session} /></AppShell> : <Navigate to="/login" />}
      />
      <Route path="/menu" element={session ? <Menu /> : <Navigate to="/login" />} />
    </Routes>
  )
}

function AppShell({ session, children }) {
  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body }}>
      <TopBar />
      <IconRow />
      {children}
    </div>
  )
}

function TopBar() {
  const navigate = useNavigate()
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 20px',
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: colors.blueDark, letterSpacing: 0.5 }}>
        CAMPORA
      </span>

      <div style={{ display: 'flex', gap: 10 }}>
        <IconButton onClick={() => navigate('/search')} label="Search">
          🔍
        </IconButton>
        <IconButton onClick={() => navigate('/menu')} label="Menu">
          ☰
        </IconButton>
      </div>
    </div>
  )
}

function IconRow() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { path: '/', label: 'Home', icon: '⌂' },
    { path: '/find-friends', label: 'Find Friends', icon: '👥' },
    { path: '/chats', label: 'Messages', icon: '💬' },
    { path: '/notifications', label: 'Notifications', icon: '🔔' },
  ]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 8px',
      background: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      {items.map((item) => {
        const active = location.pathname === item.path
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              padding: '6px 16px',
              cursor: 'pointer',
              opacity: active ? 1 : 0.55,
              borderBottom: active ? `2px solid ${colors.blue}` : '2px solid transparent',
            }}
          >
            {item.icon}
          </button>
        )
      })}
    </div>
  )
}

function IconButton({ onClick, label, children }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        border: 'none',
        background: colors.bg,
        fontSize: 16,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}
