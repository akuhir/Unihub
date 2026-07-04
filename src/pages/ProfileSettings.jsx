import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function ProfileSettings({ session }) {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
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
      navigate(-1)
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
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: colors.text }}>
          Profile settings
        </span>
      </div>

      {/* Cover photo */}
      <div style={{ position: 'relative', height: 140, background: colors.border }}>
        {coverUrl && (
          <img src={coverUrl} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        <label style={uploadBadgeStyle('cover')}>
          {uploadingCover ? 'Uploading...' : 'Change cover'}
          <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} style={{ display: 'none' }} />
        </label>

        {/* Avatar overlapping cover */}
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
          </div>
        </div>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '52px 20px 20px' }}>
        <Field label="Full name">
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
        </Field>

        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell people about yourself..."
            style={{ ...inputStyle, resize: 'vertical', fontFamily: font.body }}
          />
        </Field>

        <Field label="Department">
          <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. History" style={inputStyle} />
        </Field>

        <Field label="Level">
          <input type="text" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="e.g. 200 Level" style={inputStyle} />
        </Field>

        <Field label="Campus" last>
          <input type="text" value={campus} onChange={(e) => setCampus(e.target.value)} placeholder="e.g. Main Campus" style={inputStyle} />
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

function uploadBadgeStyle() {
  return {
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
