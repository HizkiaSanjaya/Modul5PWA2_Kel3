import { useState, useEffect } from 'react'
import { ArrowLeft, Star, Send, Loader, Archive } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import AddToCartButton from '../common/AddToCartButton'
import ReviewItem from '../review/ReviewItem'
import { useReviews, useCreateReview, useUpdateReview, useDeleteReview } from '../../hooks/useReviews'
import { getUserIdentifier } from '../../services/userService'
import { getGallery } from '../../utils/galleryStorage'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onArchive] — trigger soft delete (arsip) flow
 */
export default function GunDetail({ gun, onBack, onEdit, onArchive }) {
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  // Galeri: gambar utama + gambar tambahan dari localStorage (multi-image).
  const gallery = gun.id != null ? getGallery(gun.id) : []
  const images = [imgSrc, ...gallery.filter((u) => u && u !== imgSrc)]
  const [activeImg, setActiveImg] = useState(imgSrc)

  // Reset gambar aktif ketika produk yang ditampilkan berganti.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setActiveImg(imgSrc) }, [imgSrc])

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const { updateReview } = useUpdateReview()
  const { deleteReview } = useDeleteReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  const currentUserId = getUserIdentifier()

  const avgRating = gun.average_rating || averageRating(reviews)
  const reviewCount = gun.review_count ?? reviews.length

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: currentUserId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const handleEditReview = async (reviewId, data) => {
    const ok = await updateReview(reviewId, data)
    if (ok) refetchReviews()
    return ok
  }

  const handleDeleteReview = async (reviewId) => {
    const ok = await deleteReview(reviewId)
    if (ok) refetchReviews()
    return ok
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <div className="detail-media">
          <img className="detail-img" src={activeImg} alt={gun.name} loading="lazy" />
          {images.length > 1 && (
            <div className="detail-thumbs">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  className={`detail-thumb${activeImg === url ? ' detail-thumb--active' : ''}`}
                  onClick={() => setActiveImg(url)}
                  aria-label={`Lihat gambar ${i + 1}`}
                >
                  <img src={url} alt={`${gun.name} ${i + 1}`} loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <FavoriteButton gunId={gun.id || gun.name} />
            <AddToCartButton gun={gun} label="Tambah ke Keranjang" />
            <ShareButton gunId={gun.id || gun.name} />
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onArchive && (
              <button type="button" className="btn btn--outline" onClick={() => onArchive(gun)}>
                <Archive size={16} /> Arsipkan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>{step.instruction || step}</li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="review-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className="star-btn"
                onClick={() => setRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
              >
                <Star
                  size={22}
                  fill={n <= rating ? 'var(--brass)' : 'none'}
                  stroke={n <= rating ? 'var(--brass)' : 'var(--steel)'}
                />
              </button>
            ))}
          </div>

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => (
              <ReviewItem
                key={rev.id}
                review={rev}
                isOwn={rev.user_id === currentUserId}
                onEdit={handleEditReview}
                onDelete={handleDeleteReview}
              />
            ))}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
