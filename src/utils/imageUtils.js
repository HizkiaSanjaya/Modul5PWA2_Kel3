// ---------------------------------------------------------------------------
// imageUtils.js — kompresi gambar di sisi klien sebelum disimpan.
//
// Karena bucket Storage Supabase tidak tersedia, gambar disimpan sebagai Data URL
// (base64). Agar tidak cepat memenuhi kuota localStorage, gambar diperkecil
// (resize) dan dikompres ke JPEG sebelum disimpan.
// ---------------------------------------------------------------------------

/**
 * Kompres sebuah File gambar menjadi Data URL JPEG yang lebih kecil.
 * @param {File} file
 * @param {number} [maxDim]  dimensi sisi terpanjang (px)
 * @param {number} [quality] kualitas JPEG 0..1
 * @returns {Promise<string>} Data URL hasil kompresi
 */
export function compressImage(file, maxDim = 1000, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('File gambar tidak valid.'))
      img.onload = () => {
        let { width, height } = img

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else if (height >= width && height > maxDim) {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch (err) {
          reject(err)
        }
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}
