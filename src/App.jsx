import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { Search, Menu as MenuIcon, Home, Users, MessageCircle, Bell } from 'lucide-react'
import { supabase } from './lib/supabaseClient'
import { colors, font } from './theme.js'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Menu from './pages/Menu.jsx'
import Feed from './pages/Feed.jsx'
import FindFriends from './pages/FindFriends.jsx'
import Chats from './pages/Chats.jsx'
import Notifications from './pages/Notifications.jsx'
import ProfileSettings from './pages/ProfileSettings.jsx'
import ChatRoom from './pages/ChatRoom.jsx'
import CreatePost from './pages/CreatePost.jsx'
import ProfileCompletionBanner from './components/ProfileCompletionBanner.jsx'

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
      <Route path="/profile-settings" element={session ? <ProfileSettings session={session} /> : <Navigate to="/login" />} />
      <Route path="/profile/:userId" element={session ? <ProfileSettings session={session} /> : <Navigate to="/login" />} />
      <Route path="/chat/:userId" element={session ? <ChatRoom session={session} /> : <Navigate to="/login" />} />
      <Route path="/create-post" element={session ? <CreatePost session={session} /> : <Navigate to="/login" />} />
    </Routes>
  )
}

function AppShell({ session, children }) {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    checkProfileCompletion()
  }, [])

  const checkProfileCompletion = async () => {
    const dismissed = sessionStorage.getItem('profileBannerDismissed')
    if (dismissed) return

    const { data } = await supabase
      .from('profiles')
      .select('department, level, bio, avatar_url')
      .eq('id', session.user.id)
      .single()

    if (data && (!data.department || !data.level)) {
      setShowBanner(true)
    }
  }

  const handleDismiss = () => {
    sessionStorage.setItem('profileBannerDismissed', 'true')
    setShowBanner(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body }}>
      <TopBar />
      <IconRow />
      {showBanner && <ProfileCompletionBanner onDismiss={handleDismiss} />}
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
          <Search size={20} color={colors.text} />
        </IconButton>
        <IconButton onClick={() => navigate('/menu')} label="Menu">
          <MenuIcon size={20} color={colors.text} />
        </IconButton>
      </div>
    </div>
  )
}

function IconRow() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { path: '/', label: 'Home', Icon: Home },
    { path: '/find-friends', label: 'Find Friends', Icon: Users },
    { path: '/chats', label: 'Messages', Icon: MessageCircle },
    { path: '/notifications', label: 'Notifications', Icon: Bell },
  ]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '12px 8px',
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
              padding: '4px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <item.Icon
              size={25}
              color={active ? colors.blue : colors.text}
              strokeWidth={active ? 2.3 : 1.8}
            />
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
        width: 40,
        height: 40,
        borderRadius: 20,
        border: 'none',
        background: colors.bg,
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
