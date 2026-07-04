import React from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

const MENU_ITEMS = [
  { label: 'Profile settings', path: '/profile-settings' },
  { label: 'Messages', path: '/chats' },
  { label: 'Followers', path: '/followers' },
]

export default function Menu() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.text, padding: 0 }}
          aria-label="Back"
        >
          ←
        </button>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: colors.text }}>
          Menu
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', width: '100%', boxSizing: 'border-box', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          {MENU_ITEMS.map((item, i) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                padding: '16px 18px',
                background: 'none',
                border: 'none',
                borderBottom: i < MENU_ITEMS.length - 1 ? `1px solid ${colors.border}` : 'none',
                fontSize: 15,
                fontWeight: 700,
                color: colors.text,
                fontFamily: font.body,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: '16px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: colors.text }}>Dark mode</span>
          <ToggleSwitch />
        </div>

        <div style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 16,
        }}>
          <button
            onClick={() => navigate('/about')}
            style={{
              width: '100%',
              padding: '16px 18px',
              background: 'none',
              border: 'none',
              fontSize: 15,
              fontWeight: 700,
              color: colors.text,
              fontFamily: font.body,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            About
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '16px 18px',
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            color: colors.red,
            fontFamily: font.body,
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: 8,
          }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch() {
  const [on, setOn] = React.useState(false)
  return (
    <button
      onClick={() => setOn(!on)}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        border: 'none',
        background: on ? colors.blue : colors.border,
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'background 0.2s',
      }}
      aria-label="Toggle dark mode"
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: on ? 21 : 3,
        width: 20,
        height: 20,
        borderRadius: 10,
        background: '#fff',
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}
