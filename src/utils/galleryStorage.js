// ---------------------------------------------------------------------------
// galleryStorage.js — penyimpanan galeri gambar tambahan per produk.
//
// Tabel `products` hanya punya satu kolom `image_url` dan bucket Storage
// Supabase tidak tersedia, sehingga gambar tambahan (lebih dari satu) disimpan
// di localStorage per id produk. Gambar utama tetap tersimpan di server.
// ---------------------------------------------------------------------------

const PREFIX = 'bore_barrel_gallery_'

const keyOf = (id) => `${PREFIX}${id}`

/** Ambil daftar URL gambar tambahan untuk sebuah produk. */
export const getGallery = (id) => {
  if (id == null) return []
  try {
    const raw = localStorage.getItem(keyOf(id))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Simpan daftar URL gambar tambahan. */
export const setGallery = (id, urls) => {
  if (id == null) return []
  try {
    localStorage.setItem(keyOf(id), JSON.stringify(urls))
  } catch {
    /* kuota penuh: abaikan */
  }
  return urls
}

/** Tambahkan beberapa URL gambar ke galeri. */
export const addGalleryImages = (id, urls) => {
  const merged = [...getGallery(id), ...urls]
  return setGallery(id, merged)
}

/** Hapus satu gambar dari galeri berdasarkan indeks. */
export const removeGalleryImage = (id, index) => {
  const list = getGallery(id)
  list.splice(index, 1)
  return setGallery(id, list)
}

/** Hapus seluruh galeri sebuah produk. */
export const clearGallery = (id) => {
  if (id == null) return
  try {
    localStorage.removeItem(keyOf(id))
  } catch {
    /* ignore */
  }
}
