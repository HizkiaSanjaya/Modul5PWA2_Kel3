import { useState } from 'react'
import { Share2, Check, Link2 } from 'lucide-react'
import { shareGun } from '../../utils/share'

/**
 * ShareButton — bagikan produk melalui link (Web Share API / salin ke clipboard).
 * @param {Object}   props
 * @param {string|number} props.gunId
 * @param {string}   [props.label]  teks tombol
 */
export default function ShareButton({ gunId, label }) {
  const [state, setState] = useState('idle') // 'idle' | 'shared' | 'copied' | 'error'

  const handleShare = async () => {
    const result = await shareGun(gunId)
    if (result.ok) {
      setState(result.method === 'share' ? 'shared' : 'copied')
    } else {
      setState(result.method === 'share' ? 'idle' : 'error')
    }
    setTimeout(() => setState('idle'), 2000)
  }

  const icon =
    state === 'copied' || state === 'shared' ? <Check size={16} /> : state === 'error' ? <Link2 size={16} /> : <Share2 size={16} />

  return (
    <button
      type="button"
      className="btn btn--outline btn--sm"
      onClick={handleShare}
      aria-label="Bagikan produk"
      title="Bagikan produk lewat link"
    >
      {icon} {state === 'copied' ? 'Link disalin' : state === 'shared' ? 'Dibagikan' : label || 'Bagikan'}
    </button>
  )
}
