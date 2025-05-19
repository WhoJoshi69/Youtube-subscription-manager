import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Cache structure
const cache = new Map<string, {
  data: any[];
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useListContent = (listId: string | null, type: 'movie' | 'tv') => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listId) return;

    const fetchListContent = async () => {
      const cacheKey = `${listId}-${type}`;
      const cachedData = cache.get(cacheKey);
      
      // Check if we have valid cached data
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        setVideos(cachedData.data);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // ... existing fetch logic ...

        // Store in cache
        cache.set(cacheKey, {
          data: convertedVideos,
          timestamp: Date.now()
        });

        setVideos(convertedVideos);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching list content:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListContent();
  }, [listId, type]);

  return { videos, isLoading, error };
}; 