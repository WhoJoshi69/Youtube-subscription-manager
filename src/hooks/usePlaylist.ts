import { useState } from 'react';
import { Video } from '../types';
import { fetchPlaylistVideos } from '../api/youtube';
import { getWatchHistory, addToWatchHistory } from '../lib/db';

export const usePlaylist = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylist = async (url: string) => {
    if (!url) {
      setError('Please enter a YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [fetchedVideos, watchHistory] = await Promise.all([
        fetchPlaylistVideos(url),
        getWatchHistory()
      ]);
      
      // Filter out already watched videos
      const unwatchedVideos = fetchedVideos.filter(
        video => !watchHistory.some(watched => watched.id === video.id)
      );
      
      setVideos(unwatchedVideos);
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch playlist videos');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video.id === id ? { ...video, selected: !video.selected } : video
      )
    );
  };

  const handleSelectAll = (ids: string[]) => {
    setVideos(prevVideos => 
      prevVideos.map(video => ({
        ...video,
        selected: ids.includes(video.id)
      }))
    );
  };

  const markAsWatched = async () => {
    const selectedVideos = videos.filter(video => video.selected);
    
    try {
      // Add each selected video to watch history in Supabase
      for (const video of selectedVideos) {
        await addToWatchHistory({ ...video, selected: false, watched: true });
      }
      
      // Remove watched videos from the list
      setVideos(prevVideos => prevVideos.filter(video => !video.selected));
    } catch (err) {
      console.error('Error marking videos as watched:', err);
      setError('Failed to mark videos as watched');
    }
  };

  return {
    videos,
    isLoading,
    error,
    fetchPlaylist,
    toggleSelect,
    handleSelectAll,
    markAsWatched
  };
};