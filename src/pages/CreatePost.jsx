import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { colors, font } from '../theme.js'

export default function CreatePost({ session }) {
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [posting, setPosting] = useState(false)

  const handleImagePick = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handlePost = async () => {
    if (!content.trim() && !imageFile) return
    setPosting(true)

    let mediaUrl = null
    let mediaType = null

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('post-media')
        .upload(filePath, imageFile)

      if (uploadError) {
        alert('Image upload failed: ' + uploadError.message)
        setPosting(false)
        return
      }

      const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(filePath)
      mediaUrl = urlData.publicUrl
      mediaType = 'image'
    }

    const { error } = await supabase.from('posts').insert({
      user_id: session.user.id,
      content: content.trim() || null,
      media_url: mediaUrl,
      media_type: mediaType,
    })

    setPosting(false)

    if (error) {
      alert('Failed to post: ' + error.message)
    } else {
      navigate('/')
    }
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
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: colors.textMuted, padding: 0, fontFamily: font.body }}
        >
          Cancel
        </button>
        <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 16, color: colors.text }}>
          New post
        </span>
        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && !imageFile)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            color: (content.trim() || imageFile) ? colors.blue : colors.textDisabled,
            padding: 0,
            fontFamily: font.body,
          }}
        >
          {posting ? 'Posting...' : 'Post'}
        </button>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px' }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share something with campus..."
          rows={6}
          autoFocus
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            fontSize: 16,
            fontFamily: font.body,
            color: colors.text,
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />

        {imagePreview && (
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <img src={imagePreview} alt="Preview" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <button
              onClick={handleRemoveImage}
              style={{
                position: 'absolute', top: 8, right: 8,
                width: 28, height: 28, borderRadius: 14,
                background: 'rgba(0,0,0,0.6)', color: '#fff',
                border: 'none', cursor: 'pointer', fontSize: 16,
              }}
            >
              ×
            </button>
          </div>
        )}

        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 16px',
          borderRadius: 10,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          cursor: 'pointer',
          fontSize: 14,
          color: colors.text,
          fontFamily: font.body,
        }}>
          📷 Add photo
          <input type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  )
}
