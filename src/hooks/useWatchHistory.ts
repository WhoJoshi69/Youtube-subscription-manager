import { useState, useEffect, useCallback } from 'react';
import { Video } from '../types';
import {
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory,
  addToWatchHistoryBatch
} from '../lib/db';
import { 
  getLocalWatchHistory, 
  setLocalWatchHistory, 
  addToLocalWatchHistory,
  removeFromLocalWatchHistory
} from '../utils/watchHistoryStorage';
import { fetchChannelUploads } from '../api/youtube';

export const useWatchHistory = () => {
  const [watchedVideos, setWatchedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Add a debounced fetch function to prevent multiple rapid API calls
  const loadHistory = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    // Only fetch if it's been more than 30 seconds since the last fetch or if forced
    if (!force && now - lastFetchTime < 30000) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const history = await getWatchHistory();
      setWatchedVideos(history);
      setLocalWatchHistory(history);
      setLastFetchTime(now);
    } catch (err) {
      console.error('Error loading watch history:', err);
      setError('Failed to load watch history');
    } finally {
      setIsLoading(false);
    }
  }, [lastFetchTime]);

  // Load watch history only once on mount
  // useEffect(() => {
  //   // First try to load from local storage
  //   const localHistory = getLocalWatchHistory();
  //   if (localHistory.length > 0) {
  //     setWatchedVideos(localHistory);
  //   }
  //   // Then fetch fresh data from API
  //   loadHistory(true);
  // }, []);

  // Add event listeners for page visibility and focus changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadHistory();
      }
    };

    const handleFocus = () => {
      loadHistory();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [loadHistory]);

  const isWatched = useCallback((videoId: string): boolean => {
    // Always check local storage first
    return getLocalWatchHistory().some(video => video.id === videoId);
  }, []);

  const markAsWatched = async (video: Video) => {
    try {
      // Update local storage immediately for instant UI feedback
      addToLocalWatchHistory({ ...video, watched: true });
      setWatchedVideos(prev => [{ ...video, watched: true }, ...prev]);
      
      // Then update the database
      await addToWatchHistory({ ...video, selected: false, watched: true });
      return true;
    } catch (err) {
      console.error('Error marking video as watched:', err);
      setError('Failed to mark video as watched');
      return false;
    }
  };

  const removeFromHistory = async (videoIds: string[]) => {
    try {
      // Update local storage immediately
      removeFromLocalWatchHistory(videoIds);
      setWatchedVideos(prev => prev.filter(video => !videoIds.includes(video.id)));
      
      // Then update the database
      await removeFromWatchHistory(videoIds);
    } catch (err) {
      console.error('Error removing from history:', err);
      setError('Failed to remove videos from history');
    }
  };

  const markChannelAsWatched = async (channelId: string) => {
    try {
      setIsLoading(true);
      
      // Fetch all videos from this channel
      const uploadsPlaylistId = channelId.replace('UC', 'UU');
      let nextPageToken: string | undefined;
      let allVideos: Video[] = [];
      
      do {
        const result = await fetchChannelUploads(channelId, nextPageToken, 50);
        allVideos = [...allVideos, ...result.videos];
        nextPageToken = result.nextPageToken;
      } while (nextPageToken);
      
      // Update local storage immediately
      allVideos.forEach(video => {
        addToLocalWatchHistory({ ...video, watched: true });
      });
      
      // Update database in a single batch operation
      await addToWatchHistoryBatch(
        allVideos.map(video => ({ ...video, selected: false, watched: true }))
      );
      
      // Refresh watch history state
      setWatchedVideos(prev => [
        ...allVideos.map(video => ({ ...video, watched: true })),
        ...prev.filter(v => !allVideos.some(newVideo => newVideo.id === v.id))
      ]);
      
      return true;
    } catch (err) {
      console.error('Error marking channel as watched:', err);
      setError('Failed to mark channel videos as watched');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    watchedVideos,
    isLoading,
    error,
    markAsWatched,
    markChannelAsWatched,
    removeFromHistory,
    refreshHistory: loadHistory,
    isWatched
  };
}; 