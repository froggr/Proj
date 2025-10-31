const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const ffmpegPath = require('ffmpeg-static')

/**
 * Check if a video needs optimization (moov atom at end)
 * @param {string} videoPath - Path to video file
 * @returns {Promise<boolean>} - True if optimization needed
 */
async function needsOptimization(videoPath) {
  return new Promise((resolve) => {
    // For now, we'll optimize all MP4s to be safe
    // A more sophisticated check would parse the MP4 container
    const ext = path.extname(videoPath).toLowerCase()
    resolve(ext === '.mp4')
  })
}

/**
 * Optimize video for web/streaming playback
 * Moves moov atom to beginning of file for progressive playback
 * @param {string} inputPath - Path to input video
 * @param {string} outputPath - Path to output video
 * @param {Function} onProgress - Optional progress callback (percent)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function optimizeVideo(inputPath, outputPath, onProgress = null) {
  return new Promise((resolve) => {
    console.log('FFmpeg path:', ffmpegPath)
    console.log('Optimizing video:', inputPath, '->', outputPath)

    const args = [
      '-i', inputPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      '-y', // Overwrite output file
      outputPath
    ]

    const ffmpeg = spawn(ffmpegPath, args)

    let stderr = ''

    ffmpeg.stderr.on('data', (data) => {
      stderr += data.toString()

      // Parse progress from ffmpeg output
      if (onProgress) {
        const timeMatch = stderr.match(/time=(\d{2}):(\d{2}):(\d{2})/)
        const durationMatch = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})/)

        if (timeMatch && durationMatch) {
          const currentSeconds = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3])
          const totalSeconds = parseInt(durationMatch[1]) * 3600 + parseInt(durationMatch[2]) * 60 + parseInt(durationMatch[3])
          const percent = Math.min(100, Math.round((currentSeconds / totalSeconds) * 100))
          onProgress(percent)
        }
      }
    })

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('Video optimization successful')
        resolve({ success: true })
      } else {
        console.error('Video optimization failed with code:', code)
        console.error('FFmpeg stderr:', stderr)
        resolve({ success: false, error: `FFmpeg exited with code ${code}` })
      }
    })

    ffmpeg.on('error', (error) => {
      console.error('Failed to start ffmpeg:', error)
      resolve({ success: false, error: error.message })
    })
  })
}

/**
 * Optimize video in place (replaces original with optimized version)
 * @param {string} videoPath - Path to video file
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function optimizeVideoInPlace(videoPath, onProgress = null) {
  const needsOpt = await needsOptimization(videoPath)

  if (!needsOpt) {
    console.log('Video does not need optimization:', videoPath)
    return { success: true, skipped: true }
  }

  const tempPath = videoPath + '.tmp.mp4'

  try {
    // Optimize to temp file
    const result = await optimizeVideo(videoPath, tempPath, onProgress)

    if (!result.success) {
      // Clean up temp file if it exists
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath)
      }
      return result
    }

    // Replace original with optimized version
    fs.unlinkSync(videoPath)
    fs.renameSync(tempPath, videoPath)

    console.log('Video optimized in place:', videoPath)
    return { success: true }
  } catch (error) {
    console.error('Error optimizing video:', error)
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath)
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
    }
    return { success: false, error: error.message }
  }
}

module.exports = {
  needsOptimization,
  optimizeVideo,
  optimizeVideoInPlace
}
