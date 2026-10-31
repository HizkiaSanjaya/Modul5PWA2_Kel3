// ---------------------------------------------------------------------------
// share.js — bagikan link produk.
// Membangun URL berparameter `?gun=<id>` yang akan membuka detail produk ketika
// diakses. Menggunakan Web Share API bila tersedia, jika tidak menyalin link.
// ---------------------------------------------------------------------------

/**
 * Bangun link berbagi untuk sebuah produk.
 * @param {string|number} id
 */
export const buildShareLink = (id) => {
  if (typeof window === 'undefined') return ''
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('gun', String(id))
  return url.toString()
}

/**
 * Bagikan link. Mengembalikan objek hasil agar UI bisa menampilkan feedback.
 * @returns {Promise<{ method: 'share'|'copy', ok: boolean, url: string }>}
 */
export const shareGun = async (id) => {
  const url = buildShareLink(id)
  const title = 'Bore & Barrel'

  if (navigator.share) {
    try {
      await navigator.share({ title, url })
      return { method: 'share', ok: true, url }
    } catch (err) {
      // user membatalkan share sheet
      if (err?.name === 'AbortError') {
        return { method: 'share', ok: false, url }
      }
      // fall through ke clipboard
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return { method: 'copy', ok: true, url }
  } catch {
    return { method: 'copy', ok: false, url }
  }
}

/**
 * Baca id produk dari query string (`?gun=<id>`), bila ada.
 */
export const readSharedGunId = () => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('gun')
}
