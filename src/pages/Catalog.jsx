import { useState, useMemo, useEffect } from 'react'
import { RefreshCw, Plus, Loader, AlertCircle, PackageOpen } from 'lucide-react'
import { useGuns } from '../hooks/useGuns'
import GUNS_LOCAL from '../data/guns'
import GunCard from '../components/gun/GunCard'
import GunDetail from '../components/gun/GunDetail'
import AdvancedFilter from '../components/common/AdvancedFilter'
import { isArchived } from '../utils/archiveStorage'
import {
  matchesSearch,
  matchesCategory,
  sortItems,
  extractCategories,
} from '../utils/helpers'

/**
 * Catalog page — the main product listing.
 *
 * Data source priority:
 *   1. Live API via useGuns()
 *   2. Local static array (GUNS_LOCAL) when the API is unreachable
 *
 * Features: search, category filter, sort, CRUD actions, detail modal,
 * arsip (soft delete) — item yang diarsipkan disembunyikan dari katalog.
 */
export default function Catalog({ onNavigate, onArchive }) {
  // ---- API data ----
  const { guns: apiGuns, loading, error, refetch } = useGuns({ limit: 50 })
  const [useLocal, setUseLocal] = useState(false)

  // Refresh filter arsip setiap kali terjadi perubahan arsip (arsip/pulihkan/hapus).
  const [archiveTick, setArchiveTick] = useState(0)
  useEffect(() => {
    const handler = () => setArchiveTick((t) => t + 1)
    window.addEventListener('bore-barrel:archive-changed', handler)
    return () => window.removeEventListener('bore-barrel:archive-changed', handler)
  }, [])

  // Decide data source, lalu buang item yang diarsipkan
  const rawGuns = useMemo(() => {
    const source = useLocal || (error && apiGuns.length === 0)
      ? GUNS_LOCAL.map((g, i) => ({ ...g, id: g.id || `local-${i}` }))
      : apiGuns
    return source.filter((g) => !isArchived(g.id ?? g.name))
    // archiveTick dipakai agar memo ikut ter-hitung ulang saat arsip berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGuns, error, useLocal, archiveTick])

  // ---- filters / sort ----
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortKey, setSortKey] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')

  const categories = useMemo(() => extractCategories(rawGuns), [rawGuns])

  const filteredGuns = useMemo(() => {
    let result = rawGuns.filter(
      (g) => matchesSearch(g, search) && matchesCategory(g, activeCategory),
    )
    return sortItems(result, sortKey, sortOrder)
  }, [rawGuns, search, activeCategory, sortKey, sortOrder])

  // ---- detail view ----
  const [selectedGun, setSelectedGun] = useState(null)

  // ---- If viewing a single product detail ----
  if (selectedGun) {
    return (
      <GunDetail
        gun={selectedGun}
        onBack={() => setSelectedGun(null)}
        onEdit={(g) => onNavigate && onNavigate('Edit', g)}
        onArchive={(g) => { setSelectedGun(null); if (onArchive) onArchive(g) }}
      />
    )
  }

  // ---- Main catalog view ----
  return (
    <>
      <section className="masthead">
        <h1 className="display">Hardware, by the spec sheet.</h1>
        <p className="lede">
          A small armory of pistols, rifles, and shotguns. Every piece listed
          with its type, caliber, and price — nothing else.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Current stock</h2>
          <div className="list-head-right">
            <span className="count">
              {filteredGuns.length} piece{filteredGuns.length !== 1 ? 's' : ''}
            </span>
            {onNavigate && (
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => onNavigate('Create')}
              >
                <Plus size={16} /> Add
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <AdvancedFilter
          search={search}
          onSearch={setSearch}
          categories={categories}
          activeCategory={activeCategory}
          onCategory={setActiveCategory}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSort={({ key, order }) => { setSortKey(key); setSortOrder(order) }}
        />

        {/* States */}
        {loading && (
          <div className="state-box">
            <Loader size={28} className="spin" />
            <p>Loading products…</p>
          </div>
        )}

        {!loading && error && !useLocal && (
          <div className="state-box state-box--error">
            <AlertCircle size={28} />
            <p>{error}</p>
            <div className="state-box__actions">
              <button type="button" className="btn btn--outline" onClick={refetch}>
                <RefreshCw size={16} /> Retry
              </button>
              <button
                type="button"
                className="btn btn--outline"
                onClick={() => setUseLocal(true)}
              >
                View Local Catalog
              </button>
            </div>
          </div>
        )}

        {!loading && filteredGuns.length === 0 && !error && (
          <div className="state-box">
            <PackageOpen size={28} />
            <p>No products match your search.</p>
          </div>
        )}

        {/* Product grid */}
        {filteredGuns.length > 0 && (
          <ul className="stock">
            {filteredGuns.map((gun) => (
              <GunCard
                key={gun.id || gun.name}
                gun={gun}
                onSelect={setSelectedGun}
                onEdit={onNavigate ? (g) => onNavigate('Edit', g) : undefined}
                onArchive={onArchive}
              />
            ))}
          </ul>
        )}

        {useLocal && (
          <p className="local-notice">
            Showing local catalog (server unavailable).{' '}
            <button
              type="button"
              className="link-btn"
              onClick={() => { setUseLocal(false); refetch() }}
            >
              Retry server
            </button>
          </p>
        )}
      </section>
    </>
  )
}
