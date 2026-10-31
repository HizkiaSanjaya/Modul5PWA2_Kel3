import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart } from '../../context/CartContext'

/**
 * AddToCartButton — menambahkan produk ke keranjang.
 * @param {Object}   props
 * @param {Object}   props.gun
 * @param {string}   [props.label]
 * @param {boolean}  [props.small]  gaya ringkas untuk kartu produk
 */
export default function AddToCartButton({ gun, label, small }) {
  const { addToCart } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = (e) => {
    if (e) e.stopPropagation()
    addToCart(gun, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      type="button"
      className={small ? 'card-act-btn card-act-btn--cart' : 'btn btn--primary btn--sm'}
      onClick={handleAdd}
      aria-label={`Tambahkan ${gun.name} ke keranjang`}
      title="Tambahkan ke keranjang"
    >
      {added ? <Check size={small ? 14 : 16} /> : <ShoppingCart size={small ? 14 : 16} />}
      {!small && (label || 'Tambah ke Keranjang')}
    </button>
  )
}
