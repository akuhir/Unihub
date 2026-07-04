import React, { useState } from 'react'
import { colors, font } from '../theme.js'

export default function FindFriends({ session }) {
  const [query, setQuery] = useState('')

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
      <input
        type="text"
        placeholder="Search by name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: colors.text,
          fontSize: 15,
          fontFamily: font.body,
          outline: 'none',
          boxSizing: 'border-box',
          marginBottom: 20,
        }}
      />

      <div style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: 16,
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
          Search results will appear here.
        </p>
      </div>
    </div>
  )
}
