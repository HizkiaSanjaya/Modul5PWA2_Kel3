import { useState, useEffect, lazy, Suspense } from 'react'
import { Loader } from 'lucide-react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import GunDetail from './components/gun/GunDetail.jsx'
import PWABadge from './components/PWABadge.jsx'
import ConfirmModal from './components/modals/ConfirmModal.jsx'
import SplashScreen from './components/common/SplashScreen.jsx'
import { CartProvider } from './context/CartContext.jsx'
import gunService from './services/gunService.js'
import { archiveGun } from './utils/archiveStorage.js'
import { readSharedGunId } from './utils/share.js'
import './App.css'

// Lazy load halaman-halaman berat agar bundle dipecah (code splitting).
// Halaman hanya diunduh saat pertama kali dibutuhkan.
const Catalog = lazy(() => import('./pages/Catalog.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'))
const CreateGunPage = lazy(() => import('./pages/CreateGunPage.jsx'))
const EditGunPage = lazy(() => import('./pages/EditGunPage.jsx'))
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))

function PageFallback() {
  return (
    <div className="state-box">
      <Loader size={28} className="spin" />
      <p>Loading…</p>
    </div>
  )
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [tab, setTab] = useState('Catalog')
  const [mode, setMode] = useState('list') // 'list' | 'create' | 'edit' | 'detail' | 'profile-edit' | 'cart'
  const [selectedGun, setSelectedGun] = useState(null)
  const [editingGun, setEditingGun] = useState(null)
  const [archiveTarget, setArchiveTarget] = useState(null)
  const [archiving, setArchiving] = useState(false)
  const [archiveMsg, setArchiveMsg] = useState('')

  // Routing berbagi link: buka detail ketika ada ?gun=<id>
  useEffect(() => {
    const sharedId = readSharedGunId()
    if (!sharedId) return

    const openShared = async () => {
      try {
        const res = await gunService.getGunById(sharedId)
        if (res.success && res.data) {
          setSelectedGun(res.data)
          setMode('detail')
        }
      } catch {
        /* id tidak ditemukan, abaikan */
      }
    }
    openShared()
  }, [])

  // Unified navigation handler
  const handleNavigate = (target, payload) => {
    if (target === 'Create') {
      setMode('create')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Edit') {
      setEditingGun(payload)
      setMode('edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Detail') {
      setSelectedGun(payload)
      setMode('detail')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'EditProfile') {
      setMode('profile-edit')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (target === 'Cart') {
      setMode('cart')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Tab change
      setTab(target)
      setMode('list')
      setSelectedGun(null)
      setEditingGun(null)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBackToList = () => {
    setMode('list')
    setSelectedGun(null)
    setEditingGun(null)
  }

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return
    setArchiving(true)
    archiveGun(archiveTarget)
    setArchiving(false)
    setArchiveTarget(null)
    handleBackToList()
    setArchiveMsg(`"${archiveTarget.name}" diarsipkan.`)
    setTimeout(() => setArchiveMsg(''), 3000)
  }

  const handleResumeDraft = (draftId) => {
    if (draftId === 'create') {
      setMode('create')
    } else {
      setEditingGun({ id: draftId })
      setMode('edit')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <CartProvider>
      <div className="shell">
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        <Header
          tab={mode === 'list' ? tab : ''}
          onTab={(newTab) => handleNavigate(newTab)}
          onNavigateCreate={() => handleNavigate('Create')}
          onOpenCart={() => handleNavigate('Cart')}
        />

        {archiveMsg && <div className="toast toast--success">{archiveMsg}</div>}

        <main className="main">
          <Suspense fallback={<PageFallback />}>
            {/* Sub-page views */}
            {mode === 'create' && (
              <CreateGunPage
                onBack={handleBackToList}
                onSuccess={() => { handleBackToList(); setTab('Catalog') }}
              />
            )}

            {mode === 'edit' && (
              <EditGunPage
                gun={editingGun}
                gunId={editingGun?.id}
                onBack={handleBackToList}
                onSuccess={() => { handleBackToList(); setTab('Catalog') }}
              />
            )}

            {mode === 'profile-edit' && (
              <ProfileEditPage
                onBack={handleBackToList}
                onSaved={() => {}}
              />
            )}

            {mode === 'cart' && (
              <CartPage
                onBack={handleBackToList}
                onBrowse={() => handleNavigate('Catalog')}
              />
            )}

            {mode === 'detail' && selectedGun && (
              <GunDetail
                gun={selectedGun}
                onBack={handleBackToList}
                onEdit={(g) => handleNavigate('Edit', g)}
                onArchive={(g) => setArchiveTarget(g)}
              />
            )}

            {/* Top-level Tabs */}
            {mode === 'list' && (
              <>
                {tab === 'Catalog' && (
                  <Catalog
                    onNavigate={(destination, payload) => handleNavigate(destination, payload)}
                    onArchive={(g) => setArchiveTarget(g)}
                  />
                )}
                {tab === 'Favorites' && (
                  <FavoritesPage
                    onSelectGun={(g) => handleNavigate('Detail', g)}
                    onNavigateCatalog={() => setTab('Catalog')}
                  />
                )}
                {tab === 'Profile' && (
                  <ProfilePage
                    onReplaySplash={() => setShowSplash(true)}
                    onEditProfile={() => handleNavigate('EditProfile')}
                    onResumeDraft={handleResumeDraft}
                  />
                )}
              </>
            )}
          </Suspense>
        </main>

        {/* Arsip (soft delete) confirmation */}
        <ConfirmModal
          open={Boolean(archiveTarget)}
          title="Arsipkan Hardware Record"
          message={`Arsipkan "${archiveTarget?.name}"? Item akan disembunyikan dari katalog dan bisa dipulihkan dari halaman Profile.`}
          confirmLabel="Arsipkan"
          cancelLabel="Batal"
          loading={archiving}
          onConfirm={handleConfirmArchive}
          onCancel={() => setArchiveTarget(null)}
        />

        <PWABadge />
        <Footer />
      </div>
    </CartProvider>
  )
}

export default App
