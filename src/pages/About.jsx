import React from 'react'
import { useNavigate } from 'react-router-dom'
import { colors, font } from '../theme.js'

export default function About() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body }}>
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
        >
          ←
        </button>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: colors.text }}>
          About
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 18,
            background: colors.blue,
            color: '#fff',
            fontFamily: font.display,
            fontWeight: 700,
            fontSize: 26,
            marginBottom: 12,
          }}>
            C
          </div>
          <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: colors.text, margin: '0 0 4px' }}>
            Campora
          </p>
          <p style={{ color: colors.textMuted, fontSize: 13, margin: 0 }}>
            Version 1.0.0
          </p>
        </div>

        <Section title="About this app">
          Campora is AKUM's first social app — built to help students connect,
          share, and grow together on campus. Follow classmates, share updates,
          chat in real time, and build your campus community, all in one place.
        </Section>

        <Section title="Credits">
          Designed and built by Abubakar Muhammad Nurudeen.
        </Section>

        <Section title="Contact">
          Have feedback or found a bug? Reach out — your input helps make Campora better.
        </Section>

        <Section title="Legal">
          <button style={linkButtonStyle}>Terms of Service</button>
          <button style={linkButtonStyle}>Privacy Policy</button>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      padding: '16px 18px',
      marginBottom: 14,
    }}>
      <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: colors.text, margin: '0 0 8px' }}>
        {title}
      </p>
      <div style={{ fontSize: 14, color: colors.textMuted, lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  )
}

const linkButtonStyle = {
  display: 'block',
  background: 'none',
  border: 'none',
  color: colors.blue,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  padding: '6px 0',
  textAlign: 'left',
  fontFamily: 'inherit',
}
