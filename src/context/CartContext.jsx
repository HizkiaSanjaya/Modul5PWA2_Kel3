import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
  getCart,
  addToCart as addToCartStorage,
  setCartQuantity,
  removeFromCart,
  clearCart,
  cartCount as countCart,
  cartTotal as totalCart,
} from '../utils/cartStorage'

const CartContext = createContext(null)

/**
 * CartProvider — menyediakan state keranjang ke seluruh aplikasi secara reaktif,
 * sehingga badge di header ikut ter-update saat item ditambah/dihapus.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => getCart())

  const refresh = () => setItems(getCart())

  const addToCart = useCallback((gun, qty = 1) => {
    addToCartStorage(gun, qty)
    refresh()
  }, [])

  const updateQuantity = useCallback((id, qty) => {
    setCartQuantity(id, qty)
    refresh()
  }, [])

  const remove = useCallback((id) => {
    removeFromCart(id)
    refresh()
  }, [])

  const clear = useCallback(() => {
    clearCart()
    refresh()
  }, [])

  const count = useMemo(() => items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0), [items])
  const total = useMemo(
    () => items.reduce((acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0),
    [items],
  )

  const value = useMemo(
    () => ({ items, count, total, addToCart, updateQuantity, remove, clear }),
    [items, count, total, addToCart, updateQuantity, remove, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/** Hook untuk mengakses keranjang. */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart harus dipakai di dalam CartProvider')
  return ctx
}

/** Utilitas untuk membangun pesan checkout WhatsApp. */
export function buildCheckoutMessage(items) {
  const lines = items.map(
    (i) => `- ${i.name}${i.caliber ? ` (${i.caliber})` : ''} x${i.quantity} = $${((Number(i.price) || 0) * (Number(i.quantity) || 0)).toLocaleString()}`,
  )
  const total = items.reduce(
    (acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 0),
    0,
  )
  return `Hi, aku mau pesan...\n\n${lines.join('\n')}\n\nTotal: $${total.toLocaleString()}`
}

export const WHATSAPP_NUMBER = '6289634207797'

export function checkoutUrl(items) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildCheckoutMessage(items))}`
}
