// Global cache for resolved asset URLs (shared across all component instances)
const assetUrlCache = new Map()

/**
 * Resolve various URL formats to local-image:// URLs
 * Handles: local-image://, assets://, file://, http://, https://
 */
export async function resolveAssetUrl(assetUrl, libraryRoot) {
  if (!assetUrl) {
    return assetUrl
  }

  // Already a local-image:// URL, return as-is
  if (assetUrl.startsWith('local-image://')) {
    return assetUrl
  }

  // Handle file:// URLs or assets:// URLs that need resolving
  if (assetUrl.startsWith('assets://') || assetUrl.startsWith('file://')) {
    if (!libraryRoot || !window.electronAPI) {
      console.warn('assetResolver: Cannot resolve asset URL - library not open or Electron API not available', {
        assetUrl,
        hasLibraryRoot: !!libraryRoot,
        hasElectronAPI: !!window.electronAPI
      })
      return assetUrl
    }

    // Check cache first
    const cacheKey = `${libraryRoot}::${assetUrl}`
    if (assetUrlCache.has(cacheKey)) {
      return assetUrlCache.get(cacheKey)
    }

    try {
      // resolveAssetPath now handles both assets:// and file:// URLs
      const resolvedUrl = await window.electronAPI.resolveAssetPath(libraryRoot, assetUrl)
      const finalUrl = resolvedUrl || assetUrl

      // Cache the result
      assetUrlCache.set(cacheKey, finalUrl)

      return finalUrl
    } catch (error) {
      console.error('Failed to resolve asset URL:', assetUrl, error)
      return assetUrl
    }
  }

  // Return other URLs unchanged (http://, https://, etc.)
  return assetUrl
}

/**
 * Clear the asset URL cache (useful when library changes)
 */
export function clearAssetCache() {
  assetUrlCache.clear()
}
