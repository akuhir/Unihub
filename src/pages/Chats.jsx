import React from 'react'
import { colors, font } from '../theme.js'

export default function Chats({ session }) {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, color: colors.text, marginBottom: 16 }}>
        Messages
      </h2>

      <div style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: 16,
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
          Your conversations will appear here.
        </p>
      </div>
    </div>
  )
}
