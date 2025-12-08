/**
 * Image Cache Utility
 * Caches images from S3 to avoid repetitive calls
 */

class ImageCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  /**
   * Get cached image URL or fetch from S3
   * @param {string} key - Unique identifier for the image
   * @param {Function} fetchFn - Async function that returns the image URL
   * @returns {Promise<string>} - Image URL
   */
  async get(key, fetchFn) {
    // Return from cache if available
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // If already fetching, wait for that request
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Fetch and cache
    const promise = fetchFn()
      .then((url) => {
        this.cache.set(key, url);
        this.pendingRequests.delete(key);
        return url;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Manually set a cached value
   * @param {string} key - Unique identifier
   * @param {string} value - Image URL
   */
  set(key, value) {
    this.cache.set(key, value);
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Unique identifier
   * @returns {boolean}
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear specific cache entry
   * @param {string} key - Unique identifier
   */
  clear(key) {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache size
   * @returns {number}
   */
  size() {
    return this.cache.size;
  }
}

// Singleton instance
const imageCache = new ImageCache();

export default imageCache;

/**
 * Helper function to get workspace cover image with caching
 * @param {string} workspaceId - Workspace ID
 * @param {string} coverImagePath - S3 path to cover image
 * @param {Object} supabase - Supabase client
 * @returns {Promise<string>} - Public URL
 */
export async function getCachedWorkspaceCover(workspaceId, coverImagePath, supabase) {
  if (!coverImagePath) return null;

  const cacheKey = `workspace-cover-${workspaceId}`;
  
  return imageCache.get(cacheKey, async () => {
    const { data } = supabase.storage
      .from('workspace-covers')
      .getPublicUrl(coverImagePath);
    return data?.publicUrl || null;
  });
}

/**
 * Helper function to get user profile picture with caching
 * @param {string} userId - User ID
 * @param {string} avatarPath - S3 path to avatar
 * @param {Object} supabase - Supabase client
 * @returns {Promise<string>} - Public URL
 */
export async function getCachedUserAvatar(userId, avatarPath, supabase) {
  if (!avatarPath) return null;

  const cacheKey = `user-avatar-${userId}`;
  
  return imageCache.get(cacheKey, async () => {
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data?.publicUrl || null;
  });
}
