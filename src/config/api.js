import axios from 'axios'

// ---------------------------------------------------------------------------
// Base URL & Supabase Key Configuration
// Prioritas baca dari environment variables (.env / Vercel). Bila tidak ada,
// pakai fallback default supaya aplikasi tetap berfungsi (misalnya saat
// deploy belum dikonfigurasi env-nya). Nilai Supabase di bawah adalah URL
// publik dan publishable key (bukan secret), jadi aman disematkan.
// ---------------------------------------------------------------------------
const FALLBACK_BASE_URL = 'https://sxunubxupdxyupnebuid.supabase.co'
const FALLBACK_SUPABASE_KEY = 'sb_publishable_TXg9-r3ZVI8YZMzE90nwsQ_PU9GAmzg'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || FALLBACK_BASE_URL
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  FALLBACK_SUPABASE_KEY

const IS_SUPABASE =
  BASE_URL.includes('supabase.co') || Boolean(SUPABASE_KEY)

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
})

// ---------------------------------------------------------------------------
// Request interceptor — attach Supabase headers (apikey & Bearer auth)
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    if (IS_SUPABASE && SUPABASE_KEY) {
      config.headers['apikey'] = SUPABASE_KEY
      if (!config.headers['Authorization']) {
        config.headers['Authorization'] = `Bearer ${SUPABASE_KEY}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------------------------------------------------------------------------
// Response interceptor — unwrap response and normalise errors
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'An unexpected error occurred'
    let status = null
    let code = null

    if (error.response) {
      status = error.response.status
      const data = error.response.data

      // Normalise berbagai bentuk body error menjadi string tunggal.
      // Backend bisa mengembalikan string, objek datar, atau objek bersarang
      // seperti {"error": {"code": ..., "message": ...}} (format Vercel).
      const candidates = []

      if (typeof data === 'string') {
        candidates.push(data)
      } else if (data && typeof data === 'object') {
        candidates.push(data.message, data.msg, data.error_description)

        if (data.code) code = data.code

        if (data.error && typeof data.error === 'object') {
          candidates.push(data.error.message, data.error.msg)
          if (data.error.code) code = data.error.code
        } else if (typeof data.error === 'string') {
          candidates.push(data.error)
        }
      }

      const found = candidates.find((c) => typeof c === 'string' && c.trim())
      message = found || `Server error (${status})`
    } else if (error.request) {
      message =
        'Unable to reach the server. Check your connection and try again.'
    } else {
      message = error.message || message
    }

    return Promise.reject({
      message,
      status,
      code,
      raw: error.response?.data,
    })
  },
)

export { apiClient, BASE_URL, SUPABASE_KEY, IS_SUPABASE }
