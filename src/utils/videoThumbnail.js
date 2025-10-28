/**
 * Extract a thumbnail from a video element
 * @param {HTMLVideoElement} videoElement - The video element to extract from
 * @param {number} timePercent - Percentage into video (0-100), default 10%
 * @returns {Promise<string>} - Data URL of the thumbnail
 */
export async function extractVideoThumbnail(videoElement, timePercent = 10) {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas at reasonable thumbnail size (16:9 aspect)
      const canvas = document.createElement('canvas')
      canvas.width = 320
      canvas.height = 180

      // Calculate time to seek to (10% into video, or 2 seconds, whichever is less)
      const duration = videoElement.duration || 0
      const seekTime = Math.min(duration * (timePercent / 100), 2)

      // If video isn't loaded enough, wait
      if (!duration || duration === Infinity) {
        videoElement.addEventListener('loadedmetadata', () => {
          const actualSeekTime = Math.min(videoElement.duration * (timePercent / 100), 2)
          videoElement.currentTime = actualSeekTime
        }, { once: true })
      } else {
        videoElement.currentTime = seekTime
      }

      // When seeked to the right time, draw frame
      videoElement.addEventListener('seeked', () => {
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

        // Convert to JPEG data URL (0.85 quality for good balance)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve(dataUrl)
      }, { once: true })

      videoElement.addEventListener('error', (e) => {
        reject(new Error('Failed to load video for thumbnail extraction'))
      }, { once: true })

    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Convert data URL to Blob for uploading
 * @param {string} dataUrl - Data URL from canvas
 * @returns {Blob}
 */
export function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(',')
  const mime = arr[0].match(/:(.*?);/)[1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
