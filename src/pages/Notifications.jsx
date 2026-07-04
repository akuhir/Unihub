import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

const TYPE_LABELS = {
  like: 'liked your post',
  comment: 'commented on your post',
  friend_request: 'sent you a follow',
  friend_accepted: 'started following you',
}

export default function Notifications({ session }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-page-channel')
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
      .limit(50)

    if (!error) setNotifications(data)

    // Mark all as read once viewed
    const unreadIds = (data || []).filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px' }}>
      <h2 style={{ fontFamily: font.display, fontSize: 18, color: colors.text, marginBottom: 16 }}>
        Notifications
      </h2>

      {loading ? (
        <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div style={{
          border: `1px dashed ${colors.border}`,
          borderRadius: 16,
          padding: '32px 20px',
          textAlign: 'center',
        }}>
          <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
            No notifications yet.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => (
            <div key={n.id} style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 12,
              padding: '14px 16px',
              fontSize: 14,
              color: colors.text,
            }}>
              <strong>{n.actor?.full_name || 'Someone'}</strong> {TYPE_LABELS[n.type] || 'sent a notification'}
              <p style={{ margin: '4px 0 0', fontSize: 12, color: colors.textMuted }}>
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
