import { useState, useEffect } from 'react';
import { Video } from '../types';
import {
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory
} from '../lib/db';

export const useWatchHistory = () => {
  const [watchedVideos, setWatchedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWatchHistory = async () => {
    setIsLoading(true);
    try {
      const history = await getWatchHistory();
      setWatchedVideos(history);
    } catch (err) {
      setError('Failed to load watch history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWatchHistory();
  }, []);

  const markAsWatched = async (video: Video) => {
    try {
      await addToWatchHistory(video);
      setWatchedVideos(prev => [video, ...prev]);
    } catch (err) {
      setError('Failed to mark video as watched');
    }
  };

  const removeFromHistory = async (videoIds: string[]) => {
    try {
      await removeFromWatchHistory(videoIds);
      setWatchedVideos(prev => 
        prev.filter(video => !videoIds.includes(video.id))
      );
    } catch (err) {
      setError('Failed to remove videos from history');
    }
  };

  return {
    watchedVideos,
    isLoading,
    error,
    markAsWatched,
    removeFromHistory,
    refreshHistory: loadWatchHistory
  };
}; 