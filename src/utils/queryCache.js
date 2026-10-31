// ---------------------------------------------------------------------------
// queryCache.js — tiny in-memory cache with TTL, prefix invalidation, and
// in-flight deduplication (mencegah "cache stampede").
//
// Dua lapis penyimpanan:
//   1. `store`  : hasil akhir request (dengan TTL).
//   2. `inflight`: Promise request yang sedang berjalan, sehingga banyak
//                  komponen yang memanggil endpoint yang sama secara bersamaan
//                  hanya menghasilkan SATU request jaringan.
// ---------------------------------------------------------------------------

const store = new Map()
const inflight = new Map()

export const DEFAULT_TTL = 30_000 // 30 detik

/** Ambil nilai hasil dari cache (undefined bila tidak ada / kedaluwarsa). */
export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.data
}

/** Simpan hasil ke cache dengan TTL (ms). ttl=0 berarti tanpa kedaluwarsa. */
export function cacheSet(key, data, ttl = DEFAULT_TTL) {
  store.set(key, { data, expiresAt: ttl ? Date.now() + ttl : 0 })
}

/**
 * Jalankan fetcher dengan cache + deduplikasi in-flight.
 *
 * Bila hasil sudah ada di cache, langsung dikembalikan tanpa memanggil fetcher.
 * Bila ada permintaan yang sedang berjalan untuk key yang sama, kembalikan
 * promise yang sama (tidak membuat request jaringan duplikat). Hasil fetcher
 * otomatis disimpan ke cache.
 *
 * @param {string} key
 * @param {() => Promise<any>} fetcher
 * @param {number} [ttl]
 */
export async function cachedFetch(key, fetcher, ttl = DEFAULT_TTL) {
  const cached = cacheGet(key)
  if (cached !== undefined) return cached

  if (inflight.has(key)) return inflight.get(key)

  const promise = (async () => {
    try {
      const result = await fetcher()
      cacheSet(key, result, ttl)
      return result
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, promise)
  return promise
}

/** Hapus semua entri cache yang key-nya diawali `prefix`. */
export function cacheInvalidate(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}

/** Hapus seluruh cache. */
export function cacheClear() {
  store.clear()
}

/** Daftar key cache aktif (untuk debugging / verifikasi). */
export function cacheKeys() {
  return Array.from(store.keys())
}
