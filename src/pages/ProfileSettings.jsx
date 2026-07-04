import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'
import PostCard from '../components/PostCard.jsx'

export default function ProfileSettings({ session }) {
  const navigate = useNavigate()
  const { userId } = useParams()

  // If no :userId in the URL, we're viewing our own profile (e.g. via /profile-settings)
  const viewingUserId = userId || session.user.id
  const isOwnProfile = viewingUserId === session.user.id

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [campus, setCampus] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [coverUrl, setCoverUrl] = useState(null)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [posts, setPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Follow state (only relevant when viewing someone else)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchFollowCounts()
    fetchPosts()
    if (!isOwnProfile) checkFollowStatus()
  }, [viewingUserId])

  const fetchProfile = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', viewingUserId)
      .single()

    if (!error && data) {
      setProfile(data)
      setFullName(data.full_name || '')
      setBio(data.bio || '')
      setDepartment(data.department || '')
      setLevel(data.level || '')
      setCampus(data.campus || '')
      setAvatarUrl(data.avatar_url)
      setCoverUrl(data.cover_url)
    }
    setLoading(false)
  }

  const fetchFollowCounts = async () => {
    // Since a follow is mutual (one row = connection both ways),
    // both "followers" and "following" count rows where this user appears on either side.
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .or(`user_id.eq.${viewingUserId},follows_id.eq.${viewingUserId}`)

    setFollowersCount(followers || 0)
    setFollowingCount(followers || 0)
  }

  const fetchPosts = async () => {
    setLoadingPosts(true)
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(full_name, avatar_url)')
      .eq('user_id', viewingUserId)
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoadingPosts(false)
  }

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .or(`and(user_id.eq.${session.user.id},follows_id.eq.${viewingUserId}),and(user_id.eq.${viewingUserId},follows_id.eq.${session.user.id})`)
      .maybeSingle()
    setIsFollowing(!!data)
  }

  const handleFollowToggle = async () => {
    setFollowLoading(true)
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .or(`and(user_id.eq.${session.user.id},follows_id.eq.${viewingUserId}),and(user_id.eq.${viewingUserId},follows_id.eq.${session.user.id})`)
      setIsFollowing(false)
      setFollowersCount((c) => Math.max(0, c - 1))
      setFollowingCount((c) => Math.max(0, c - 1))
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ user_id: session.user.id, follows_id: viewingUserId })
      if (!error) {
        setIsFollowing(true)
        setFollowersCount((c) => c + 1)
        setFollowingCount((c) => c + 1)
      }
    }
    setFollowLoading(false)
  }

  const handleMessage = () => {
    navigate(`/chat/${viewingUserId}`)
  }

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingCover
    setUploading(true)

    const fileExt = file.name.split('.').pop()
    const filePath = `${session.user.id}/${type}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    if (type === 'avatar') {
      setAvatarUrl(urlData.publicUrl)
    } else {
      setCoverUrl(urlData.publicUrl)
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        bio,
        department,
        level,
        campus,
        avatar_url: avatarUrl,
        cover_url: coverUrl,
      })
      .eq('id', session.user.id)

    setSaving(false)
    if (error) {
      alert('Error saving profile: ' + error.message)
    } else {
      setProfile((prev) => ({ ...prev, full_name: fullName, bio, department, level, campus, avatar_url: avatarUrl, cover_url: coverUrl }))
      setEditing(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: colors.textMuted, fontFamily: font.body }}>Loading...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg, fontFamily: font.body }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => (editing ? setEditing(false) : navigate(-1))}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: colors.text, padding: 0 }}
          >
            ←
          </button>
          <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: colors.text }}>
            {editing ? 'Edit profile' : 'Profile'}
          </span>
        </div>

        {isOwnProfile && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              background: 'none',
              border: `1px solid ${colors.blue}`,
              color: colors.blue,
              borderRadius: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: font.body,
            }}
          >
            Edit profile
          </button>
        )}
      </div>

      {/* Cover photo */}
      <div style={{ position: 'relative', height: 140, background: colors.border }}>
        {coverUrl && (
          <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {editing && (
          <label style={uploadBadgeStyle}>
            {uploadingCover ? 'Uploading...' : 'Change cover'}
            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} style={{ display: 'none' }} />
          </label>
        )}

        <div style={{ position: 'absolute', bottom: -36, left: 20 }}>
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{
                width: 84, height: 84, borderRadius: 42, objectFit: 'cover',
                border: `3px solid ${colors.surface}`,
              }} />
            ) : (
              <div style={{
                width: 84, height: 84, borderRadius: 42,
                background: colors.blue, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: font.display, fontWeight: 700, fontSize: 28,
                border: `3px solid ${colors.surface}`,
              }}>
                {(fullName || '?').charAt(0).toUpperCase()}
              </div>
            )}
            {editing && (
              <label style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: 14,
                background: colors.blue, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, cursor: 'pointer', border: `2px solid ${colors.surface}`,
              }}>
                {uploadingAvatar ? '...' : '✎'}
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '52px 20px 20px' }}>
        {editing ? (
          <>
            <Field label="Full name">
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: font.body }}
              />
            </Field>
            <Field label="Department">
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Level">
              <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Campus" last>
              <input type="text" value={campus} onChange={(e) => setCampus(e.target.value)} style={inputStyle} />
            </Field>

            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 10,
                border: 'none',
                background: colors.blue,
                color: '#fff',
                fontFamily: font.body,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save profile'}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: font.display, fontSize: 26, fontWeight: 700, color: colors.text, margin: '0 0 4px' }}>
              {fullName || 'No name set'}
            </h2>

            {(department || level) && (
              <p style={{ fontSize: 17, fontWeight: 700, color: colors.text, margin: '0 0 4px' }}>
                {[department, level].filter(Boolean).join(' · ')}
              </p>
            )}

            {campus && (
              <p style={{ fontSize: 15, color: colors.textMuted, margin: '0 0 16px' }}>
                {campus}
              </p>
            )}

            <div style={{ display: 'flex', gap: 24, marginBottom: 18 }}>
              <button
                onClick={() => navigate(isOwnProfile ? '/followers' : `/followers/${viewingUserId}`)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: font.body }}
              >
                <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Followers </span>
                <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>{followersCount.toLocaleString()}</span>
              </button>
              <button
                onClick={() => navigate(isOwnProfile ? '/following' : `/following/${viewingUserId}`)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: font.body }}
              >
                <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>Following </span>
                <span style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>{followingCount.toLocaleString()}</span>
              </button>
            </div>

            {bio ? (
              <p style={{ fontSize: 17, color: colors.text, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '0 0 20px' }}>
                {bio}
              </p>
            ) : (
              <p style={{ fontSize: 15, color: colors.textMuted, fontStyle: 'italic', margin: '0 0 20px' }}>
                No bio yet.
              </p>
            )}

            {isOwnProfile ? (
              <button
                onClick={() => navigate('/create-post')}
                style={{
                  width: '100%',
                  background: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 14,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 20,
                }}
              >
                <span style={{
                  display: 'inline-block',
                  background: colors.bg,
                  borderRadius: 20,
                  padding: '10px 16px',
                  color: colors.textMuted,
                  fontSize: 14,
                  fontFamily: font.body,
                  width: '100%',
                  boxSizing: 'border-box',
                }}>
                  Share something with campus...
                </span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 10,
                    border: isFollowing ? `1px solid ${colors.border}` : 'none',
                    background: isFollowing ? colors.surface : colors.blue,
                    color: isFollowing ? colors.text : '#fff',
                    fontFamily: font.body,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  {followLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 10,
                    border: `1px solid ${colors.blue}`,
                    background: colors.surface,
                    color: colors.blue,
                    fontFamily: font.body,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Message
                </button>
              </div>
            )}

            <div>
              {loadingPosts ? (
                <p style={{ color: colors.textMuted, fontSize: 14 }}>Loading posts...</p>
              ) : posts.length === 0 ? (
                <div style={{
                  border: `1px dashed ${colors.border}`,
                  borderRadius: 16,
                  padding: '28px 20px',
                  textAlign: 'center',
                }}>
                  <p style={{ color: colors.textMuted, fontSize: 14, margin: 0 }}>
                    No posts yet.
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} session={session} onDelete={handlePostDeleted} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children, last }) {
  return (
    <div style={{ marginBottom: last ? 24 : 16 }}>
      <label style={{ display: 'block', fontSize: 13, color: colors.textMuted, marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const uploadBadgeStyle = {
  position: 'absolute',
  bottom: 8,
  right: 8,
  background: 'rgba(0,0,0,0.55)',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 8,
  cursor: 'pointer',
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: `1px solid ${colors.border}`,
  background: colors.surface,
  color: colors.text,
  fontSize: 15,
  fontFamily: font.body,
  outline: 'none',
  boxSizing: 'border-box',
}
