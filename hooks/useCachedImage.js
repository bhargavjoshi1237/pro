'use client';

import { useState, useEffect } from 'react';
import imageCache from '@/lib/imageCache';

/**
 * Hook for using image cache in React components
 * @param {string} key - Unique cache key
 * @param {Function} fetchFn - Async function that returns the image URL
 * @returns {Object} - { imageUrl, loading, error }
 */
export function useCachedImage(key, fetchFn) {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!key || !fetchFn) {
      setLoading(false);
      return;
    }

    let mounted = true;

    imageCache
      .get(key, fetchFn)
      .then((url) => {
        if (mounted) {
          setImageUrl(url);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [key, fetchFn]);

  return { imageUrl, loading, error };
}

/**
 * Hook for workspace cover images with caching
 * @param {string} workspaceId - Workspace ID
 * @param {string} coverImagePath - S3 path
 * @param {Object} supabase - Supabase client
 * @returns {Object} - { imageUrl, loading, error }
 */
export function useWorkspaceCover(workspaceId, coverImagePath, supabase) {
  const fetchFn = async () => {
    if (!coverImagePath || !supabase) return null;
    const { data } = supabase.storage
      .from('workspace-covers')
      .getPublicUrl(coverImagePath);
    return data?.publicUrl || null;
  };

  return useCachedImage(
    coverImagePath ? `workspace-cover-${workspaceId}` : null,
    fetchFn
  );
}

/**
 * Hook for user avatar images with caching
 * @param {string} userId - User ID
 * @param {string} avatarPath - S3 path
 * @param {Object} supabase - Supabase client
 * @returns {Object} - { imageUrl, loading, error }
 */
export function useUserAvatar(userId, avatarPath, supabase) {
  const fetchFn = async () => {
    if (!avatarPath || !supabase) return null;
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);
    return data?.publicUrl || null;
  };

  return useCachedImage(
    avatarPath ? `user-avatar-${userId}` : null,
    fetchFn
  );
}
