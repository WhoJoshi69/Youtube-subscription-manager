import { useState, useEffect } from 'react';
import { Video } from '../types';
import { fetchPlaylistVideos } from '../api/youtube';

export const usePlaylist = () => {
  const [videos, setVideos] = useState<Video[]>(() => {
    // Try to load last viewed playlist from localStorage
    const lastPlaylist = localStorage.getItem('last_playlist');
    return lastPlaylist ? JSON.parse(lastPlaylist) : [];
  });

  const [watchedVideos, setWatchedVideos] = useState<Video[]>(() => {
    const watched = localStorage.getItem('watched_videos');
    return watched ? JSON.parse(watched) : [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save videos to localStorage whenever they change
  useEffect(() => {
    if (videos.length > 0) {
      localStorage.setItem('last_playlist', JSON.stringify(videos));
    }
  }, [videos]);

  // Save watched videos to localStorage
  useEffect(() => {
    localStorage.setItem('watched_videos', JSON.stringify(watchedVideos));
  }, [watchedVideos]);

  const fetchPlaylist = async (url: string) => {
    if (!url) {
      setError('Please enter a YouTube playlist URL');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fetchedVideos = await fetchPlaylistVideos(url);
      
      // Filter out already watched videos
      const unwatchedVideos = fetchedVideos.filter(
        video => !watchedVideos.some(watched => watched.id === video.id)
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

  const markAsWatched = () => {
    const selectedVideos = videos.filter(video => video.selected);
    setWatchedVideos(prev => [...prev, ...selectedVideos.map(v => ({ ...v, selected: false, watched: true }))]);
    setVideos(prevVideos => prevVideos.filter(video => !video.selected));
  };

  return {
    videos,
    watchedVideos,
    isLoading,
    error,
    fetchPlaylist,
    toggleSelect,
    markAsWatched
  };
};