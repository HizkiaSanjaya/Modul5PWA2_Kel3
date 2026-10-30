import { Component } from 'react'

/**
 * ErrorBoundary — penjaga terakhir agar aplikasi tidak pernah menampilkan
 * layar putih ketika terjadi error render di dalam React. Jika ada komponen
 * yang melempar exception saat render, boundary ini menampilkan pesan yang
 * bisa dibaca manusia dan tombol muat ulang, bukan halaman kosong.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-boundary" role="alert">
        <h1 className="display">Something went wrong.</h1>
        <p>
          The application hit an unexpected error. Please try reloading the
          page.
        </p>
        {this.state.error?.message && (
          <code className="error-boundary__detail">
            {String(this.state.error.message)}
          </code>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={this.handleReload}
        >
          Reload
        </button>
      </div>
    )
  }
}
