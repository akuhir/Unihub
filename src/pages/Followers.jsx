import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function Followers({ session }) {
  const navigate = useNavigate()
  const { userId } = useParams()
  const targetUserId = userId || session.user.id

  const [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFollowers()
  }, [targetUserId])

  const fetchFollowers = async () => {
    setLoading(true)
    // Mutual connection model: anyone connected to this user, from either direction
    const { data: rows } = await supabase
      .from('follows')
      .select('user_id, follows_id')
      .or(`user_id.eq.${targetUserId},follows_id.eq.${targetUserId}`)

    const otherIds = new Set()
    ;(rows || []).forEach((row) => {
      if (row.user_id === targetUserId) otherIds.add(row.follows_id)
      if (row.follows_id === targetUserId) otherIds.add(row.user_id)
    })

    if (otherIds.size === 0) {
      setPeople([])
      setLoading(false)
      return
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, department, level, avatar_url')
      .in('id', Array.from(otherIds))

    setPeople(profiles || [])
    setLoading(false)
  }

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
          Followers
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
        {loading ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</p>
        ) : people.length === 0 ? (
          <div style={{
            border: `1px dashed ${colors.border}`,
            borderRadius: 16,
            padding: '32px 20px',
            textAlign: 'center',
          }}>
            <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
              No followers yet.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {people.map((person) => (
              <button
                key={person.id}
                onClick={() => navigate(`/profile/${person.id}`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                {person.avatar_url ? (
                  <img src={person.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: 22,
                    background: colors.blue, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: font.display, fontWeight: 700, fontSize: 17,
                    flexShrink: 0,
                  }}>
                    {(person.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text }}>
                    {person.full_name || 'Unnamed user'}
                  </p>
                  {(person.department || person.level) && (
                    <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>
                      {[person.department, person.level].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
