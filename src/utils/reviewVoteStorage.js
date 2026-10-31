// ---------------------------------------------------------------------------
// reviewVoteStorage.js — thumbs up / down untuk review (client-side).
//
// Tabel `reviews` di backend tidak punya kolom vote, sehingga suara disimpan
// di localStorage per perangkat. Struktur:
//   votes  : { [reviewId]: 1 | -1 | 0 }   // suara pengguna saat ini
//   counts : { [reviewId]: { up, down } }  // akumulasi suara pengguna lain
// ---------------------------------------------------------------------------

const VOTES_KEY = 'bore_barrel_review_votes'
const COUNTS_KEY = 'bore_barrel_review_counts'

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {}
  } catch {
    return {}
  }
}

const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore quota */
  }
}

/** Suara pengguna saat ini untuk sebuah review (1, -1, atau 0). */
export const getVote = (reviewId) => readJSON(VOTES_KEY)[String(reviewId)] || 0

/** Akumulasi count { up, down } untuk sebuah review. */
export const getCounts = (reviewId) => {
  const counts = readJSON(COUNTS_KEY)[String(reviewId)]
  return { up: counts?.up || 0, down: counts?.down || 0 }
}

/**
 * Beri suara (atau batalkan bila menekan tombol yang sama).
 * @returns {{ vote: number, counts: {up:number, down:number} }}
 */
export const setVote = (reviewId, dir) => {
  const key = String(reviewId)
  const votes = readJSON(VOTES_KEY)
  const counts = readJSON(COUNTS_KEY)
  const prev = votes[key] || 0

  let next
  if (prev === dir) {
    next = 0 // toggle off
  } else {
    next = dir
  }

  const entry = counts[key] || { up: 0, down: 0 }
  if (prev === 1) entry.up = Math.max(0, entry.up - 1)
  if (prev === -1) entry.down = Math.max(0, entry.down - 1)
  if (next === 1) entry.up += 1
  if (next === -1) entry.down += 1
  counts[key] = entry

  votes[key] = next
  writeJSON(VOTES_KEY, votes)
  writeJSON(COUNTS_KEY, counts)

  return { vote: next, counts: { up: entry.up, down: entry.down } }
}

/** Hapus data suara sebuah review (dipakai saat review dihapus). */
export const clearVoteFor = (reviewId) => {
  const key = String(reviewId)
  const votes = readJSON(VOTES_KEY)
  const counts = readJSON(COUNTS_KEY)
  delete votes[key]
  delete counts[key]
  writeJSON(VOTES_KEY, votes)
  writeJSON(COUNTS_KEY, counts)
}
