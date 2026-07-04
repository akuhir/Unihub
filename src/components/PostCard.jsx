import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function PostCard({ post, session, onDelete }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  useEffect(() => {
    fetchLikes()
  }, [])

  const fetchLikes = async () => {
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id)
    setLikeCount(count || 0)

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', session.user.id)
      .maybeSingle()
    setLiked(!!data)
  }

  const handleLikeToggle = async () => {
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id)
      setLiked(false)
      setLikeCount((c) => c - 1)
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: session.user.id })
      setLiked(true)
      setLikeCount((c) => c + 1)
    }
  }

  const fetchComments = async () => {
    setLoadingComments(true)
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    setComments(data || [])
    setLoadingComments(false)
  }

  const handleToggleComments = () => {
    if (!showComments) fetchComments()
    setShowComments(!showComments)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return

    const { error } = await supabase.from('comments').insert({
      post_id: post.id,
      user_id: session.user.id,
      content: commentText.trim(),
    })

    if (!error) {
      setCommentText('')
      fetchComments()
    }
  }

  const handleDeletePost = async () => {
    const { error } = await supabase.from('posts').delete().eq('id', post.id)
    if (!error && onDelete) onDelete(post.id)
  }

  const isOwnPost = post.user_id === session.user.id

  return (
    <div style={{
      background: colors.surface,
      border: `1px solid ${colors.border}`,
      borderRadius: 14,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}>
        {post.profiles?.avatar_url ? (
          <img src={post.profiles.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: 18, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: 18,
            background: colors.blue, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: font.display, fontWeight: 700, fontSize: 14,
          }}>
            {(post.profiles?.full_name || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: colors.text }}>
            {post.profiles?.full_name || 'Unknown'}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: colors.textMuted }}>
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
        {isOwnPost && (
          <button
            onClick={handleDeletePost}
            style={{ background: 'none', border: 'none', color: colors.textMuted, fontSize: 18, cursor: 'pointer' }}
            aria-label="Delete post"
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      {post.content && (
        <p style={{ margin: '0 14px 12px', fontSize: 14, color: colors.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
      )}

      {post.media_url && post.media_type === 'image' && (
        <img src={post.media_url} alt="" style={{ width: '100%', display: 'block' }} />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', borderTop: `1px solid ${colors.border}`, borderBottom: showComments ? `1px solid ${colors.border}` : 'none' }}>
        <button
          onClick={handleLikeToggle}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: liked ? colors.blue : colors.textMuted,
            fontFamily: font.body,
          }}
        >
          {liked ? '♥' : '♡'} Like{likeCount > 0 ? ` (${likeCount})` : ''}
        </button>
        <button
          onClick={handleToggleComments}
          style={{
            flex: 1,
            padding: '10px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
            color: colors.textMuted,
            fontFamily: font.body,
          }}
        >
          💬 Comment{comments.length > 0 ? ` (${comments.length})` : ''}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ padding: '12px 14px' }}>
          {loadingComments ? (
            <p style={{ fontSize: 13, color: colors.textMuted }}>Loading...</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>No comments yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {comments.map((c) => (
                <div key={c.id} style={{ fontSize: 13 }}>
                  <strong style={{ color: colors.text }}>{c.profiles?.full_name || 'Unknown'}</strong>{' '}
                  <span style={{ color: colors.text }}>{c.content}</span>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 20,
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                fontSize: 13,
                fontFamily: font.body,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                border: 'none',
                background: colors.blue,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: font.body,
              }}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
