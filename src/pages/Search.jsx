import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'
import PostCard from '../components/PostCard.jsx'

export default function Search({ session }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [people, setPeople] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length > 0) {
        runSearch(query.trim())
      } else {
        setPeople([])
        setPosts([])
        setSearched(false)
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  const runSearch = async (text) => {
    setLoading(true)
    setSearched(true)

    const [peopleResult, postsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, department, level, avatar_url')
        .ilike('full_name', `%${text}%`)
        .neq('id', session.user.id)
        .limit(15),
      supabase
        .from('posts')
        .select('*, profiles(full_name, avatar_url)')
        .ilike('content', `%${text}%`)
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    setPeople(peopleResult.data || [])
    setPosts(postsResult.data || [])
    setLoading(false)
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
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
        <input
          type="text"
          placeholder="Search people or posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 20,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            fontSize: 14,
            fontFamily: font.body,
            outline: 'none',
          }}
        />
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
        {!searched ? (
          <p style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            Search for people or posts by keyword.
          </p>
        ) : loading ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Searching...</p>
        ) : people.length === 0 && posts.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No results for "{query}".
          </p>
        ) : (
          <>
            {people.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>
                  PEOPLE
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {people.map((person) => (
                    <button
                      key={person.id}
                      onClick={() => navigate(`/profile/${person.id}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: colors.surface, border: `1px solid ${colors.border}`,
                        borderRadius: 14, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover', flexShrink: 0 }} />
                      ) : (
                        <div style={{
                          width: 40, height: 40, borderRadius: 20,
                          background: colors.blue, color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: font.display, fontWeight: 700, fontSize: 15, flexShrink: 0,
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
              </div>
            )}

            {posts.length > 0 && (
              <div>
                <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 14, color: colors.textMuted, marginBottom: 10 }}>
                  POSTS
                </p>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} session={session} onDelete={handlePostDeleted} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
