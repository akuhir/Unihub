import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function ChatRoom({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [otherPerson, setOtherPerson] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchOtherPerson()
    fetchMessages()

    const channel = supabase
      .channel(`chat-${[session.user.id, userId].sort().join('-')}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const msg = payload.new
          const isRelevant =
            (msg.sender_id === session.user.id && msg.receiver_id === userId) ||
            (msg.sender_id === userId && msg.receiver_id === session.user.id)
          if (isRelevant) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchOtherPerson = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('id', userId)
      .single()
    setOtherPerson(data)
  }

  const fetchMessages = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${session.user.id})`
      )
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    const content = text.trim()
    setText('')

    const { error } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      content,
    })

    if (error) {
      alert('Failed to send: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
        {otherPerson?.avatar_url ? (
          <img src={otherPerson.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: 16, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: colors.blue, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: font.display, fontWeight: 700, fontSize: 13,
          }}>
            {(otherPerson?.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 15, color: colors.text }}>
          {otherPerson?.full_name || 'Loading...'}
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</p>
        ) : messages.length === 0 ? (
          <p style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 40 }}>
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === session.user.id
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMine ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  background: isMine ? '#DCF0FE' : colors.surface,
                  border: isMine ? 'none' : `1px solid ${colors.border}`,
                  borderRadius: 16,
                  padding: '10px 14px',
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: colors.text, whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 10, color: colors.textMuted, textAlign: 'right' }}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        display: 'flex',
        gap: 8,
        padding: '12px 20px',
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
      }}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 20,
            border: `1px solid ${colors.border}`,
            background: colors.bg,
            fontSize: 14,
            fontFamily: font.body,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            borderRadius: 20,
            border: 'none',
            background: colors.blue,
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: font.body,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
