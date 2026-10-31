import { useState } from 'react'
import { Star, ThumbsUp, ThumbsDown, Pencil, Trash2, Loader, X } from 'lucide-react'
import { getVote, getCounts, setVote } from '../../utils/reviewVoteStorage'

/**
 * ReviewItem — satu ulasan dengan fitur vote (thumbs up/down) dan, bila milik
 * pengguna saat ini, tombol edit & hapus.
 *
 * @param {Object}   props
 * @param {Object}   props.review
 * @param {boolean}  props.isOwn
 * @param {Function} props.onEdit    (reviewId, { rating, comment }) => Promise
 * @param {Function} props.onDelete  (reviewId) => Promise
 */
export default function ReviewItem({ review, isOwn, onEdit, onDelete }) {
  const [vote, setVoteState] = useState(() => getVote(review.id))
  const [counts, setCounts] = useState(() => getCounts(review.id))

  const [editing, setEditing] = useState(false)
  const [editRating, setEditRating] = useState(review.rating)
  const [editComment, setEditComment] = useState(review.comment || '')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  const handleVote = (dir) => {
    const result = setVote(review.id, dir)
    setVoteState(result.vote)
    setCounts(result.counts)
  }

  const handleSaveEdit = async () => {
    setBusy(true)
    setErrMsg('')
    const ok = await onEdit(review.id, { rating: editRating, comment: editComment.trim() })
    setBusy(false)
    if (ok) {
      setEditing(false)
    } else {
      setErrMsg('Gagal menyimpan perubahan.')
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    setErrMsg('')
    const ok = await onDelete(review.id)
    setBusy(false)
    if (!ok) setErrMsg('Gagal menghapus review.')
  }

  const rating = review.rating || 0

  return (
    <li className="review-item">
      {editing ? (
        <div className="review-edit">
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setEditRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={18}
                  fill={n <= editRating ? 'var(--brass)' : 'none'}
                  stroke={n <= editRating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>
          <textarea
            className="review-input"
            rows="2"
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            maxLength={500}
          />
          <div className="review-edit-actions">
            <button type="button" className="btn btn--primary btn--sm" onClick={handleSaveEdit} disabled={busy}>
              {busy ? <Loader size={14} className="spin" /> : 'Simpan'}
            </button>
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setEditing(false)} disabled={busy}>
              Batal
            </button>
          </div>
          {errMsg && <p className="form-error">{errMsg}</p>}
        </div>
      ) : (
        <>
          <div className="review-head">
            <span className="review-user">{review.user_identifier || 'Anonymous'}</span>
            <span className="review-stars-display">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={14}
                  fill={i < rating ? 'var(--brass)' : 'none'}
                  stroke={i < rating ? 'var(--brass)' : 'var(--line)'}
                />
              ))}
            </span>
          </div>

          {review.comment && <p className="review-comment">{review.comment}</p>}

          <div className="review-footer">
            <div className="review-votes">
              <button
                type="button"
                className={`vote-btn${vote === 1 ? ' vote-btn--active' : ''}`}
                onClick={() => handleVote(1)}
                aria-label="Thumbs up"
                title="Membantu"
              >
                <ThumbsUp size={14} /> <span>{counts.up}</span>
              </button>
              <button
                type="button"
                className={`vote-btn${vote === -1 ? ' vote-btn--active vote-btn--down' : ''}`}
                onClick={() => handleVote(-1)}
                aria-label="Thumbs down"
                title="Tidak membantu"
              >
                <ThumbsDown size={14} /> <span>{counts.down}</span>
              </button>
            </div>

            {isOwn && (
              <div className="review-owner-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setEditing(true)}
                  aria-label="Edit review"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn--danger"
                  onClick={handleDelete}
                  disabled={busy}
                  aria-label="Hapus review"
                  title="Hapus"
                >
                  {busy ? <Loader size={14} className="spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            )}
          </div>
          {errMsg && <p className="form-error"><X size={12} /> {errMsg}</p>}
        </>
      )}
    </li>
  )
}
