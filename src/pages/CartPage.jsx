import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart, MessageCircle } from 'lucide-react'
import { useCart, checkoutUrl } from '../context/CartContext'
import { formatPrice } from '../utils/helpers'

/**
 * CartPage — menampilkan isi keranjang, mengubah kuantitas, dan checkout
 * lewat WhatsApp dengan pesan otomatis.
 */
export default function CartPage({ onBack, onBrowse }) {
  const { items, count, total, updateQuantity, remove, clear } = useCart()

  const handleCheckout = () => {
    if (items.length === 0) return
    const url = checkoutUrl(items)
    window.open(url, '_blank', 'noopener')
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <div className="state-box">
          <ShoppingCart size={40} stroke="var(--steel)" />
          <h3>Keranjang masih kosong</h3>
          <p className="lede">Tambahkan hardware dari katalog untuk mulai berbelanja.</p>
          {onBrowse && (
            <button type="button" className="btn btn--primary" onClick={onBrowse} style={{ marginTop: '16px' }}>
              Jelajahi Katalog
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="cart-page">
      <div className="form-head">
        <button type="button" className="detail-back" onClick={onBack}>
          <ArrowLeft size={18} /> Kembali
        </button>
        <span className="count">{count} item</span>
      </div>

      <div className="form-title-group">
        <h1 className="display">Keranjang</h1>
        <p className="lede">Tinjau pesanan Anda sebelum checkout.</p>
      </div>

      <ul className="cart-list">
        {items.map((item) => (
          <li key={item.id} className="cart-item">
            <img src={item.image_url} alt={item.name} className="cart-item-img" loading="lazy" />
            <div className="cart-item-info">
              <span className="name display">{item.name}</span>
              <span className="type">
                {item.type}
                {item.caliber ? ` · ${item.caliber}` : ''}
              </span>
              <span className="price">{formatPrice((Number(item.price) || 0) * item.quantity)}</span>
            </div>
            <div className="cart-item-controls">
              <div className="qty-control">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  aria-label="Kurangi jumlah"
                >
                  <Minus size={14} />
                </button>
                <span className="qty-val">{item.quantity}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  aria-label="Tambah jumlah"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                type="button"
                className="icon-btn icon-btn--danger"
                onClick={() => remove(item.id)}
                aria-label={`Hapus ${item.name}`}
                title="Hapus"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Total</span>
          <span className="cart-total">{formatPrice(total)}</span>
        </div>
        <div className="cart-summary-actions">
          <button type="button" className="btn btn--outline" onClick={clear}>
            Kosongkan Keranjang
          </button>
          <button type="button" className="btn btn--primary" onClick={handleCheckout}>
            <MessageCircle size={16} /> Checkout via WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}
