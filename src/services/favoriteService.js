import { apiClient, IS_SUPABASE } from '../config/api'
import { normalizeProduct } from './gunService'
import { cacheGet, cacheSet, cacheInvalidate } from '../utils/queryCache'

const CACHE_PREFIX = 'favorites:'

// ---------------------------------------------------------------------------
// FavoriteService — server-side favourites.
// Supports both Supabase (public.favorites with products foreign key join)
// and university API (/api/v1/favorites).
//
// NOTE: When server/RLS is offline or restricted, useFavorites hook falls back
// to localStorage automatically so favorites always work.
// ---------------------------------------------------------------------------

class FavoriteService {
  /**
   * Retrieve all favourited products for the given user.
   */
  async getFavorites(userIdentifier) {
    const cacheKey = CACHE_PREFIX + userIdentifier
    const cached = cacheGet(cacheKey)
    if (cached) return cached

    if (IS_SUPABASE) {
      const data = await apiClient.get(
        `/rest/v1/favorites?user_id=eq.${userIdentifier}&select=product_id,created_at,products(*)`,
      )
      const list = Array.isArray(data)
        ? data.map((fav) => {
            const prod = fav.products ? normalizeProduct(fav.products) : null
            return {
              ...(prod || {}),
              id: fav.product_id,
              recipe_id: fav.product_id,
              product_id: fav.product_id,
              created_at: fav.created_at,
            }
          })
        : []

      const result = { success: true, data: list }
      cacheSet(cacheKey, result)
      return result
    }

    const result = await apiClient.get('/api/v1/favorites', {
      params: { user_identifier: userIdentifier },
    })
    cacheSet(cacheKey, result)
    return result
  }

  /**
   * Toggle a product's favourite state (add ↔ remove).
   * @param {Object} data  { recipe_id, user_identifier }
   */
  async toggleFavorite(data) {
    if (IS_SUPABASE) {
      const targetId = Number(data.recipe_id || data.gun_id)
      const userId = data.user_identifier

      // Check if already favorited
      const existing = await apiClient.get(
        `/rest/v1/favorites?product_id=eq.${targetId}&user_id=eq.${userId}&select=*`,
      )

      if (Array.isArray(existing) && existing.length > 0) {
        // Remove from favorites
        await apiClient.delete(
          `/rest/v1/favorites?product_id=eq.${targetId}&user_id=eq.${userId}`,
        )
        cacheInvalidate(CACHE_PREFIX)
        return { success: true, data: { is_favorited: false } }
      } else {
        // Add to favorites
        await apiClient.post(
          '/rest/v1/favorites',
          { product_id: targetId, user_id: userId },
          { headers: { Prefer: 'return=minimal' } },
        )
        cacheInvalidate(CACHE_PREFIX)
        return { success: true, data: { is_favorited: true } }
      }
    }

    cacheInvalidate(CACHE_PREFIX)
    return apiClient.post('/api/v1/favorites/toggle', data)
  }
}

export default new FavoriteService()
