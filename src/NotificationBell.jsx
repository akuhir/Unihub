import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

const TYPE_LABELS = {
  like: 'liked your post',
  comment: 'commented on your post',
  friend_request: 'sent you a friend request',
  friend_accepted: 'accepted your friend request',
}

export default function NotificationBell({ session }) {
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    // Realtime: listen for new notifications for this user
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(30)

    if (!error) setNotifications(data)
    setLoading(false)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleOpen = async () => {
    setOpen(!open)
    if (!open && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleOpen}
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: 20,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
        }}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            background: colors.red,
            color: '#fff',
            borderRadius: 10,
            minWidth: 18,
            height: 18,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            fontFamily: font.body,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 48,
          right: 0,
          width: 300,
          maxHeight: 400,
          overflowY: 'auto',
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          zIndex: 50,
        }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${colors.border}` }}>
            <p style={{ margin: 0, fontFamily: font.display, fontWeight: 600, fontSize: 14, color: colors.text }}>
              Notifications
            </p>
          </div>

          {loading ? (
            <p style={{ padding: 16, fontSize: 13, color: colors.textMuted }}>Loading...</p>
          ) : notifications.length === 0 ? (
            <p style={{ padding: 16, fontSize: 13, color: colors.textMuted }}>No notifications yet.</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${colors.border}`,
                background: n.read ? colors.surface : '#EFF8FF',
                fontSize: 13,
                color: colors.text,
              }}>
                <strong>{n.actor?.full_name || 'Someone'}</strong> {TYPE_LABELS[n.type] || 'sent a notification'}
                <p style={{ margin: '4px 0 0', fontSize: 11, color: colors.textMuted }}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
