import { apiClient, IS_SUPABASE } from '../config/api'
import { cacheGet, cacheSet, cacheInvalidate } from '../utils/queryCache'

const CACHE_PREFIX = 'reviews:'

// ---------------------------------------------------------------------------
// ReviewService — product reviews & ratings.
// Supports both Supabase (public.reviews) and university API (/api/v1/recipes/:id/reviews).
// ---------------------------------------------------------------------------

class ReviewService {
  /**
   * Fetch all reviews for a given product.
   */
  async getReviews(gunId) {
    const cacheKey = CACHE_PREFIX + gunId
    const cached = cacheGet(cacheKey)
    if (cached) return cached

    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/reviews?product_id=eq.${gunId}&select=*&order=created_at.desc`,
      )
      const list = Array.isArray(data)
        ? data.map((r) => ({
            id: r.id,
            product_id: r.product_id,
            user_id: r.user_id,
            user_identifier: r.user_id ? `Operator ${String(r.user_id).substring(0, 8)}` : 'Anonymous',
            rating: r.rating,
            comment: r.comment || '',
            created_at: r.created_at,
          }))
        : []

      const result = { success: true, data: list }
      cacheSet(cacheKey, result)
      return result
    }

    const result = await apiClient.get(`/api/v1/recipes/${gunId}/reviews`)
    cacheSet(cacheKey, result)
    return result
  }

  /**
   * Submit a new review.
   * @param {string|number} gunId
   * @param {Object} reviewData  { user_identifier, rating, comment }
   */
  async createReview(gunId, reviewData) {
    if (IS_SUPABASE) {
      const payload = {
        product_id: Number(gunId),
        user_id: reviewData.user_id || reviewData.user_identifier,
        rating: Number(reviewData.rating),
        comment: reviewData.comment || '',
      }

      const res = await apiClient.post('/rest/v1/reviews', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      cacheInvalidate(CACHE_PREFIX)
      return { success: true, data: created }
    }

    cacheInvalidate(CACHE_PREFIX)
    return apiClient.post(`/api/v1/recipes/${gunId}/reviews`, reviewData)
  }

  /**
   * Edit an existing review.
   */
  async updateReview(reviewId, reviewData) {
    if (IS_SUPABASE) {
      const res = await apiClient.patch(
        `/rest/v1/reviews?id=eq.${reviewId}`,
        {
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
        },
        { headers: { Prefer: 'return=representation' } },
      )
      cacheInvalidate(CACHE_PREFIX)
      return { success: true, data: Array.isArray(res) ? res[0] : res }
    }

    cacheInvalidate(CACHE_PREFIX)
    return apiClient.put(`/api/v1/reviews/${reviewId}`, reviewData)
  }

  /**
   * Delete a review.
   */
  async deleteReview(reviewId) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/reviews?id=eq.${reviewId}`)
      cacheInvalidate(CACHE_PREFIX)
      return { success: true }
    }

    cacheInvalidate(CACHE_PREFIX)
    return apiClient.delete(`/api/v1/reviews/${reviewId}`)
  }
}

export default new ReviewService()
