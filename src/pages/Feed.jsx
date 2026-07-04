import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function Feed({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', session.user.id)
      .single()
    setProfile(data)
  }

  const initial = (profile?.full_name || session.user.email || '?').charAt(0).toUpperCase()

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
      {/* Post prompt bar */}
      <button
        onClick={() => navigate('/create-post')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 20,
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="You"
              style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: 40, height: 40, borderRadius: 20,
              background: colors.blue, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: font.display, fontWeight: 700, fontSize: 16,
            }}>
              {initial}
            </div>
          )}
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 11, height: 11, borderRadius: 6,
            background: colors.green, border: '2px solid #fff',
          }} />
        </div>

        <div style={{
          flex: 1,
          background: colors.bg,
          borderRadius: 20,
          padding: '10px 16px',
          textAlign: 'left',
        }}>
          <span style={{ color: colors.textMuted, fontSize: 14, fontFamily: font.body }}>
            Share something with campus...
          </span>
        </div>
      </button>

      {/* Feed placeholder */}
      <div style={{
        border: `1px dashed ${colors.border}`,
        borderRadius: 16,
        padding: '32px 20px',
        textAlign: 'center',
      }}>
        <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
          No posts yet — the feed will show posts from people you follow.
        </p>
      </div>
    </div>
  )
}
