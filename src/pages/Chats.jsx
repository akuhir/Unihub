import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function Chats({ session }) {
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    setLoading(true)

    // Get all messages involving this user
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(id, full_name, avatar_url), receiver:receiver_id(id, full_name, avatar_url)')
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })

    if (error || !messages) {
      setLoading(false)
      return
    }

    // Group by the "other person" in the conversation, keep only the most recent message
    const convoMap = new Map()
    for (const msg of messages) {
      const otherPerson = msg.sender_id === session.user.id ? msg.receiver : msg.sender
      if (!otherPerson) continue
      if (!convoMap.has(otherPerson.id)) {
        convoMap.set(otherPerson.id, { otherPerson, lastMessage: msg })
      }
    }

    setConversations(Array.from(convoMap.values()))
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, color: colors.text, marginBottom: 16 }}>
        Messages
      </h2>

      {loading ? (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</p>
      ) : conversations.length === 0 ? (
        <div style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
            No conversations yet. Visit someone's profile and tap Message to start.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {conversations.map(({ otherPerson, lastMessage }) => (
            <button
              key={otherPerson.id}
              onClick={() => navigate(`/chat/${otherPerson.id}`)}
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
              }}
            >
              {otherPerson.avatar_url ? (
                <img src={otherPerson.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: 22, objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 44, height: 44, borderRadius: 22,
                  background: colors.blue, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: font.display, fontWeight: 700, fontSize: 17,
                  flexShrink: 0,
                }}>
                  {(otherPerson.full_name || '?').charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text }}>
                  {otherPerson.full_name || 'Unknown'}
                </p>
                <p style={{
                  margin: 0, fontSize: 13, color: colors.textMuted,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {lastMessage.sender_id === session.user.id ? 'You: ' : ''}
                  {lastMessage.content || (lastMessage.media_type === 'image' ? '📷 Photo' : 'Message')}
                </p>
              </div>
              <span style={{ fontSize: 11, color: colors.textDisabled, flexShrink: 0 }}>
                {new Date(lastMessage.created_at).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
