import { useState } from 'react'
import { ArrowLeft, Save, Loader } from 'lucide-react'
import userService from '../services/userService'

/**
 * ProfileEditPage — halaman terpisah untuk mengubah nama dan bio profil.
 * Dibuka dari halaman Profile (bukan form di bagian bawah profile).
 */
export default function ProfileEditPage({ onBack, onSaved }) {
  const [initial] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(initial.username || 'Shooter')
  const [bio, setBio] = useState(initial.bio || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Nama tidak boleh kosong.')
      return
    }

    setSaving(true)
    const result = userService.saveUserProfile({
      username: username.trim(),
      bio: bio.trim(),
    })
    setSaving(false)

    if (result.success) {
      if (onSaved) onSaved(result.data)
      if (onBack) onBack()
    } else {
      setError(result.message || 'Gagal menyimpan profil.')
    }
  }

  return (
    <div className="form-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali ke Profile
        </button>
      </div>

      <div className="form-title-group">
        <h1 className="display">Ubah Profil</h1>
        <p className="lede">
          Perbarui nama dan bio yang tampil di armory profile Anda.
        </p>
      </div>

      {error && <div className="toast toast--error">{error}</div>}

      <form onSubmit={handleSubmit} className="entry-form">
        <div className="form-group">
          <label htmlFor="edit-prof-name" className="form-label">
            Nama / Callsign <span className="req">*</span>
          </label>
          <input
            id="edit-prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-prof-bio" className="form-label">
            Bio
          </label>
          <textarea
            id="edit-prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Deskripsi singkat tentang Anda..."
            rows={4}
            className="form-textarea"
          />
        </div>

        <div className="form-actions-bar">
          <button type="button" className="btn btn--outline" onClick={onBack}>
            Batal
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader size={16} className="spin" /> : <Save size={16} />} Simpan Profil
          </button>
        </div>
      </form>
    </div>
  )
}
