import { useState, useMemo } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Camera,
  Play,
  Pencil,
  Trash2,
  RotateCcw,
  Archive,
  PackageOpen,
  MapPin,
  Phone,
  Info,
} from 'lucide-react'
import userService from '../services/userService'
import gunService from '../services/gunService'
import { useFavorites } from '../hooks/useFavorites'
import { getArchivedItems, restoreGun, purgeArchivedId } from '../utils/archiveStorage'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'

/**
 * ProfilePage — Operator identity, statistik, serta section About, Contact,
 * Drafts, dan Arsip (soft delete).
 */
export default function ProfilePage({ onReplaySplash, onEditProfile, onResumeDraft }) {
  const [profile, setProfile] = useState(() => userService.getUserProfile())
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [tick, setTick] = useState(0) // dipakai untuk refresh daftar arsip/draft

  const { favorites } = useFavorites()

  const drafts = useMemo(() => {
    return getAllDraftIds().map((id) => {
      const draft = loadDraft(id)
      const ts = getDraftTimestamp(id)
      return {
        id,
        name: draft?.formData?.name || (id === 'create' ? 'Draft Produk Baru' : 'Draft Edit Produk'),
        type: id === 'create' ? 'create' : 'edit',
        savedAt: ts ? formatDraftTime(ts) : '',
        ts,
      }
    })
  }, [tick])

  const archived = useMemo(() => getArchivedItems(), [tick])

  const refresh = () => setTick((t) => t + 1)

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Gambar avatar maksimal 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target.result
      setAvatar(base64)
      userService.updateAvatar(base64)
      setFeedback('Avatar diperbarui.')
      setTimeout(() => setFeedback(''), 3000)
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteDraft = (id) => {
    deleteDraft(id)
    setFeedback('Draft dihapus.')
    setTimeout(() => setFeedback(''), 3000)
    refresh()
  }

  const handleResumeDraft = (id) => {
    if (onResumeDraft) onResumeDraft(id)
  }

  const handleRestore = (id) => {
    restoreGun(id)
    setFeedback('Item dipulihkan ke katalog.')
    setTimeout(() => setFeedback(''), 3000)
    refresh()
  }

  const handleDeletePermanently = async (id, name) => {
    try {
      // Hapus dari server bila id bukan item lokal
      if (!String(id).startsWith('local-')) {
        await gunService.deleteGun(id)
      }
      purgeArchivedId(id)
      setFeedback(`"${name}" dihapus permanen.`)
    } catch {
      setFeedback('Gagal menghapus permanen.')
    }
    setTimeout(() => setFeedback(''), 3000)
    refresh()
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, procurement statistics, dan armorer details.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onEditProfile && (
            <button type="button" className="btn btn--primary btn--sm" onClick={onEditProfile}>
              <Pencil size={14} /> Edit Profil
            </button>
          )}
          {onReplaySplash && (
            <button type="button" className="btn btn--outline btn--sm" onClick={onReplaySplash} title="Replay splash">
              <Play size={14} /> Replay Intro
            </button>
          )}
        </div>
      </section>

      {feedback && <div className="toast toast--success"><Check size={18} /> {feedback}</div>}

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {avatar ? (
              <img src={avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
            <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
              <Camera size={14} />
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden-file-input"
              />
            </label>
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && <p className="profile-bio">{profile.bio}</p>}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button type="button" className="icon-btn" onClick={handleCopyId} title="Salin User ID">
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
          <div className="stat-item">
            <Archive size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{archived.length}</div>
            <div className="stat-label">Archived Items</div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="profile-section">
        <h3 className="section-title"><Info size={16} /> Tentang</h3>
        <h2 className="display">A one-room armory.</h2>
        <p className="lede">
          Bore &amp; Barrel sells a short, honest list of firearms. Each piece is priced
          from the bench — no markup theatre, no filler.
        </p>
      </section>

      {/* Contact Section */}
      <section className="profile-section">
        <h3 className="section-title"><MapPin size={16} /> Kontak</h3>
        <p className="lede">Come by the shop.</p>
        <p>
          123 Range Road. Open Tuesday to Saturday, 10 to 6. Call{' '}
          <Phone size={14} style={{ verticalAlign: 'middle' }} /> (555) 010-0100.
        </p>
      </section>

      {/* Drafts Section */}
      <section className="profile-section">
        <h3 className="section-title"><FileText size={16} /> Draft Tersimpan</h3>
        {drafts.length === 0 ? (
          <p className="detail-empty">Belum ada draft yang tersimpan.</p>
        ) : (
          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-row">
                <div className="draft-info">
                  <span className="name display">{d.name}</span>
                  <span className="draft-meta">
                    {d.type === 'create' ? 'Draft Produk Baru' : 'Draft Edit'} · {d.savedAt}
                  </span>
                </div>
                <div className="draft-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleResumeDraft(d.id)}>
                    Lanjutkan
                  </button>
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleDeleteDraft(d.id)} aria-label="Hapus draft">
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Archived Section (soft delete) */}
      <section className="profile-section">
        <h3 className="section-title"><Archive size={16} /> Arsip (Soft Delete)</h3>
        {archived.length === 0 ? (
          <p className="detail-empty"><PackageOpen size={16} style={{ verticalAlign: 'middle' }} /> Tidak ada item yang diarsipkan.</p>
        ) : (
          <ul className="archived-list">
            {archived.map((item) => (
              <li key={item.id} className="archived-row">
                <img src={item.image_url} alt={item.name} className="archived-img" loading="lazy" />
                <div className="archived-info">
                  <span className="name display">{item.name}</span>
                  <span className="type">{item.type}{item.caliber ? ` · ${item.caliber}` : ''}</span>
                </div>
                <div className="archived-actions">
                  <button type="button" className="btn btn--outline btn--sm" onClick={() => handleRestore(item.id)}>
                    <RotateCcw size={14} /> Pulihkan
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => handleDeletePermanently(item.id, item.name)}
                    aria-label={`Hapus permanen ${item.name}`}
                    title="Hapus permanen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
