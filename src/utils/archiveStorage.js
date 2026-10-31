// ---------------------------------------------------------------------------
// archiveStorage.js — soft delete / arsip produk.
//
// Karena tabel `products` di backend tidak memiliki kolom `deleted_at` / `is_archived`,
// soft delete dilakukan di sisi klien. Snapshot produk disimpan di localStorage
// sehingga item yang diarsipkan bisa tetap ditampilkan di halaman Profile dan
// bisa dipulihkan atau dihapus permanen.
// ---------------------------------------------------------------------------

const ARCHIVE_KEY = 'bore_barrel_archived'

const readArchive = () => {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeArchive = (items) => {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items))
    // Beri tahu komponen lain (mis. katalog) agar menyegarkan filter arsip.
    try {
      window.dispatchEvent(new Event('bore-barrel:archive-changed'))
    } catch {
      /* non-browser */
    }
    return true
  } catch {
    return false
  }
}

/**
 * Arsipkan (soft delete) sebuah produk. Menyimpan snapshot agar bisa dirender
 * di bagian Arsip pada Profile.
 */
export const archiveGun = (gun) => {
  const items = readArchive()
  const id = String(gun.id ?? gun.name)
  if (!items.some((x) => String(x.id) === id)) {
    items.push({
      id,
      name: gun.name || 'Hardware item',
      type: gun.type || gun.category || 'Hardware',
      caliber: gun.caliber || '',
      price: Number(gun.price ?? gun.cook_time ?? 0),
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      archived_at: new Date().toISOString(),
    })
    writeArchive(items)
  }
  return items
}

/** Pulihkan produk dari arsip. */
export const restoreGun = (id) => {
  const items = readArchive().filter((x) => String(x.id) !== String(id))
  writeArchive(items)
  return items
}

/** Hapus permanen dari arsip (tidak menyentuh data server). */
export const purgeArchivedId = (id) => {
  const items = readArchive().filter((x) => String(x.id) !== String(id))
  writeArchive(items)
  return items
}

/** Apakah sebuah id sedang diarsipkan? */
export const isArchived = (id) => readArchive().some((x) => String(x.id) === String(id))

/** Daftar item yang diarsipkan. */
export const getArchivedItems = () => readArchive()

/** Daftar id yang diarsipkan. */
export const getArchivedIds = () => readArchive().map((x) => x.id)

/** Hapus semua arsip. */
export const clearArchive = () => writeArchive([])
