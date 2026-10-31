// ---------------------------------------------------------------------------
// queryCache.js — tiny in-memory cache with TTL & prefix invalidation.
//
// Digunakan untuk "query caching": hasil GET yang sama tidak perlu di-fetch
// berulang-ulang dalam rentang waktu singkat. Cache bersifat in-memory
// (bukan localStorage), sehingga otomatis bersih saat halaman di-reload.
// Mutasi (create/update/delete) wajib memanggil cacheInvalidate agar data
// yang ditampilkan tidak basi.
// ---------------------------------------------------------------------------

const store = new Map()

export const DEFAULT_TTL = 30_000 // 30 detik

/**
 * Ambil nilai dari cache. Kembalikan undefined bila tidak ada atau kedaluwarsa.
 */
export function cacheGet(key) {
  const entry = store.get(key)
  if (!entry) return undefined
  if (entry.expiresAt !== 0 && Date.now() > entry.expiresAt) {
    store.delete(key)
    return undefined
  }
  return entry.data
}

/**
 * Simpan nilai ke cache dengan TTL tertentu (ms). ttl=0 berarti tanpa kedaluwarsa.
 */
export function cacheSet(key, data, ttl = DEFAULT_TTL) {
  store.set(key, { data, expiresAt: ttl ? Date.now() + ttl : 0 })
}

/**
 * Hapus semua entri cache yang key-nya diawali `prefix`.
 * Contoh: cacheInvalidate('guns:') membuang semua cache daftar & detail produk.
 */
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
