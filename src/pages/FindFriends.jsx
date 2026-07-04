import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function FindFriends({ session }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [followingIds, setFollowingIds] = useState(new Set())

  useEffect(() => {
    fetchFollowing()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 0) {
        searchUsers(query.trim())
      } else {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const fetchFollowing = async () => {
    const { data } = await supabase
      .from('follows')
      .select('user_id, follows_id')
      .or(`user_id.eq.${session.user.id},follows_id.eq.${session.user.id}`)

    const ids = new Set()
    ;(data || []).forEach((row) => {
      if (row.user_id === session.user.id) ids.add(row.follows_id)
      if (row.follows_id === session.user.id) ids.add(row.user_id)
    })
    setFollowingIds(ids)
  }

  const searchUsers = async (text) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, department, level, avatar_url')
      .ilike('full_name', `%${text}%`)
      .neq('id', session.user.id)
      .limit(30)

    if (!error) setResults(data)
    setLoading(false)
  }

  const handleFollowToggle = async (targetId) => {
    const isFollowing = followingIds.has(targetId)

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .or(`and(user_id.eq.${session.user.id},follows_id.eq.${targetId}),and(user_id.eq.${targetId},follows_id.eq.${session.user.id})`)
      setFollowingIds((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    } else {
      const { error } = await supabase.from('follows').insert({ user_id: session.user.id, follows_id: targetId })
      if (!error) {
        setFollowingIds((prev) => new Set(prev).add(targetId))
      }
    }
  }

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

      {loading ? (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Searching...</p>
      ) : query.trim().length === 0 ? (
        <div style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
            Start typing a name to find people.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
            No one found matching "{query}".
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {results.map((user) => {
            const isFollowing = followingIds.has(user.id)
            return (
              <div key={user.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '12px 14px',
              }}>
                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 44, height: 44, borderRadius: 22,
                      background: colors.blue, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: font.display, fontWeight: 700, fontSize: 17,
                    }}>
                      {(user.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                <button
                  onClick={() => navigate(`/profile/${user.id}`)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flex: 1, textAlign: 'left' }}
                >
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text }}>
                    {user.full_name || 'Unnamed user'}
                  </p>
                  {(user.department || user.level) && (
                    <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>
                      {[user.department, user.level].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </button>

                <button
                  onClick={() => handleFollowToggle(user.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: isFollowing ? `1px solid ${colors.border}` : 'none',
                    background: isFollowing ? colors.surface : colors.blue,
                    color: isFollowing ? colors.text : '#fff',
                    fontFamily: font.body,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
