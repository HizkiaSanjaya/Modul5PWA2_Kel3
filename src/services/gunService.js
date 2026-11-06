import { apiClient, IS_SUPABASE } from '../config/api'
import { cachedFetch, cacheInvalidate } from '../utils/queryCache'

const CACHE_LIST = 'guns:list:'
const CACHE_BYID = 'guns:byId:'

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
// Format marker gambar galeri di kolom `specs`: "__image: <url>" (mengikuti
// data seed instruktur). Didukung juga varian "__image__:".
const IMG_MARKER = '__image: '

const isImageSpec = (s) => {
  if (typeof s !== 'string') return false
  const idx = s.indexOf(':')
  if (idx < 0) return false
  const head = s.slice(0, idx).trim().toLowerCase()
  return head === '__image' || head === '__image__'
}

const imageUrlFromSpec = (s) => s.slice(s.indexOf(':') + 1).trim()

export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`.
  // Entri berformat `__image: <url>` adalah gambar galeri tambahan (multi-image),
  // bukan spesifikasi. Entri itu dipisahkan ke array `images`.
  const galleryFromSpecs = []
  let specsList = []

  if (Array.isArray(item.specs)) {
    const cleanSpecs = []
    item.specs.forEach((s) => {
      if (isImageSpec(s)) {
        galleryFromSpecs.push(imageUrlFromSpec(s))
      } else {
        cleanSpecs.push(s)
      }
    })

    specsList = cleanSpecs.map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  const primaryImage = item.image_url || item.image || '/guns/pistol.svg'
  // Gabungkan gambar utama + galeri (unik, urutan dipertahankan).
  const images = [primaryImage, ...galleryFromSpecs.filter((u) => u && u !== primaryImage)]

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: primaryImage,
    image: primaryImage,
    images,
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}) {
    const cacheKey = CACHE_LIST + JSON.stringify(params)

    return cachedFetch(cacheKey, async () => {
      if (IS_SUPABASE) {
        const queryParts = ['select=*']

        if (params.search) {
          queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
        }

        if (params.category && params.category !== 'All') {
          queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
        }

        if (params.sort_by) {
          const order = params.order === 'desc' ? 'desc' : 'asc'
          queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
        } else {
          queryParts.push('order=created_at.desc')
        }

        if (params.limit) {
          queryParts.push(`limit=${params.limit}`)
        }

        const queryString = queryParts.join('&')
        const data = await apiClient.get(`/rest/v1/products?${queryString}`)
        const list = Array.isArray(data) ? data.map(normalizeProduct) : []

        return {
          success: true,
          data: list,
          pagination: {
            total: list.length,
            page: params.page || 1,
            limit: params.limit || 50,
          },
        }
      }

      // Fallback: university REST API
      const clean = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null),
      )
      return apiClient.get('/api/v1/recipes', { params: clean })
    })
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    const cacheKey = CACHE_BYID + id

    return cachedFetch(cacheKey, async () => {
      if (IS_SUPABASE) {
        const data = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
        if (Array.isArray(data) && data.length > 0) {
          return { success: true, data: normalizeProduct(data[0]) }
        }
        throw new Error('Hardware item not found.')
      }
      return apiClient.get(`/api/v1/recipes/${id}`)
    })
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const baseSpecs = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : []

      // Gambar tambahan (multi-image) disimpan sebagai marker di kolom specs.
      const gallery = Array.isArray(data.images) ? data.images : []
      const primary = data.image_url || gallery[0] || null
      const extraImages = gallery.filter((u) => u && u !== primary)
      const specsArray = [...baseSpecs, ...extraImages.map((u) => `${IMG_MARKER}${u}`)]

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: primary,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      cacheInvalidate('guns:')
      return { success: true, data: normalizeProduct(created) }
    }
    cacheInvalidate('guns:')
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      const baseSpecs = Array.isArray(data.ingredients)
        ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
        : Array.isArray(data.specs)
        ? data.specs
        : undefined

      // Bila `images` dikirim, bangun ulang specs dengan marker galeri.
      let specsArray = baseSpecs
      if (Array.isArray(data.images)) {
        const primary = data.image_url || data.images[0] || null
        const extraImages = data.images.filter((u) => u && u !== primary)
        specsArray = [
          ...(baseSpecs || []),
          ...extraImages.map((u) => `${IMG_MARKER}${u}`),
        ]
      }

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.image_url !== undefined) payload.image_url = data.image_url

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      cacheInvalidate('guns:')
      return { success: true, data: normalizeProduct(updated) }
    }
    cacheInvalidate('guns:')
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Delete product.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      cacheInvalidate('guns:')
      return { success: true }
    }
    cacheInvalidate('guns:')
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
