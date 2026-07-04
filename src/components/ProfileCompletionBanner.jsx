import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, font } from '../theme.js'

export default function ProfileCompletionBanner({ onDismiss }) {
  const navigate = useNavigate()

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      background: '#EFF8FF',
      border: `1px solid ${colors.blue}`,
      borderRadius: 12,
      padding: '12px 16px',
      margin: '12px 20px 0',
      fontFamily: font.body,
    }}>
      <p style={{ margin: 0, fontSize: 13, color: colors.text }}>
        Complete your profile so people can identify you.
      </p>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => navigate('/profile-settings')}
          style={{
            background: colors.blue,
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: font.body,
          }}
        >
          Complete
        </button>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            fontSize: 16,
            cursor: 'pointer',
            padding: '0 4px',
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}
