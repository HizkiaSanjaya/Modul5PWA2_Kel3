// ---------------------------------------------------------------------------
// cartStorage.js — keranjang belanja (cart) berbasis localStorage.
//
// Tidak ada tabel `cart` di backend, sehingga keranjang disimpan di sisi klien.
// Setiap item menyimpan snapshot minimal produk agar tetap bisa dirender tanpa
// harus memanggil API lagi.
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'

const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    return true
  } catch {
    return false
  }
}

/** Tambah item ke keranjang (tambah qty bila sudah ada). */
export const addToCart = (gun, qty = 1) => {
  const items = readCart()
  const id = String(gun.id ?? gun.name)
  const existing = items.find((i) => String(i.id) === id)
  if (existing) {
    existing.quantity += qty
  } else {
    items.push({
      id,
      name: gun.name || 'Hardware item',
      type: gun.type || gun.category || 'Hardware',
      caliber: gun.caliber || '',
      price: Number(gun.price ?? gun.cook_time ?? 0),
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      quantity: qty,
    })
  }
  writeCart(items)
  return items
}

/** Perbarui kuantitas sebuah item. qty <= 0 akan menghapus item. */
export const setCartQuantity = (id, qty) => {
  let items = readCart()
  const key = String(id)
  if (qty <= 0) {
    items = items.filter((i) => String(i.id) !== key)
  } else {
    const item = items.find((i) => String(i.id) === key)
    if (item) item.quantity = qty
  }
  writeCart(items)
  return items
}

/** Hapus item dari keranjang. */
export const removeFromCart = (id) => {
  const items = readCart().filter((i) => String(i.id) !== String(id))
  writeCart(items)
  return items
}

/** Kosongkan keranjang. */
export const clearCart = () => writeCart([])

/** Ambil isi keranjang. */
export const getCart = () => readCart()

/** Jumlah total item (menjumlahkan qty). */
export const cartCount = () =>
  readCart().reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)

/** Total harga seluruh keranjang. */
export const cartTotal = () =>
  readCart().reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0)
