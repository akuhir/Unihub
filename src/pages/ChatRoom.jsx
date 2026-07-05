import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Mic, Square, Camera, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function ChatRoom({ session }) {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [otherPerson, setOtherPerson] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const bottomRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])

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

  const handleImageSend = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    const fileExt = file.name.split('.').pop()
    const filePath = `${session.user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('chat-media')
      .upload(filePath, file)

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploadingImage(false)
      return
    }

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      media_url: urlData.publicUrl,
      media_type: 'image',
    })

    if (insertError) {
      alert('Failed to send image: ' + insertError.message)
    }

    setUploadingImage(false)
    e.target.value = ''
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach((track) => track.stop())
        await uploadVoiceNote(audioBlob)
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch (err) {
      alert('Could not access microphone: ' + err.message)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const uploadVoiceNote = async (audioBlob) => {
    setUploadingVoice(true)
    const filePath = `${session.user.id}/${Date.now()}.webm`

    const { error: uploadError } = await supabase.storage
      .from('voice-notes')
      .upload(filePath, audioBlob)

    if (uploadError) {
      alert('Voice note upload failed: ' + uploadError.message)
      setUploadingVoice(false)
      return
    }

    const { data: urlData } = supabase.storage.from('voice-notes').getPublicUrl(filePath)

    const { error: insertError } = await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: userId,
      media_url: urlData.publicUrl,
      media_type: 'audio',
    })

    if (insertError) {
      alert('Failed to send voice note: ' + insertError.message)
    }

    setUploadingVoice(false)
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
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.text, padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
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
                  padding: msg.media_type === 'image' ? 6 : '10px 14px',
                  overflow: 'hidden',
                }}
              >
                {msg.media_type === 'image' && msg.media_url ? (
                  <img
                    src={msg.media_url}
                    alt="Sent"
                    style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }}
                  />
                ) : msg.media_type === 'audio' && msg.media_url ? (
                  <audio controls src={msg.media_url} style={{ maxWidth: '220px', height: 36 }} />
                ) : (
                  <p style={{ margin: 0, fontSize: 14, color: colors.text, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                )}
                <p style={{ margin: msg.media_type === 'image' ? '4px 4px 0' : '4px 0 0', fontSize: 10, color: colors.textMuted, textAlign: 'right' }}>
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
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        background: colors.surface,
        borderTop: `1px solid ${colors.border}`,
      }}>
        <label style={{
          width: 38, height: 38, borderRadius: 19,
          background: colors.bg, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
        }}>
          {uploadingImage ? (
            <span style={{ fontSize: 12, color: colors.textMuted }}>...</span>
          ) : (
            <Camera size={18} color={colors.text} />
          )}
          <input type="file" accept="image/*" onChange={handleImageSend} style={{ display: 'none' }} disabled={uploadingImage} />
        </label>
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={uploadingVoice}
          style={{
            width: 38, height: 38, borderRadius: 19,
            background: isRecording ? colors.red : colors.bg,
            border: 'none',
            display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
          aria-label={isRecording ? 'Stop recording' : 'Record voice note'}
        >
          {uploadingVoice ? (
            <span style={{ fontSize: 12, color: colors.textMuted }}>...</span>
          ) : isRecording ? (
            <Square size={16} color="#fff" fill="#fff" />
          ) : (
            <Mic size={18} color={colors.text} />
          )}
        </button>
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
            flexShrink: 0,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
