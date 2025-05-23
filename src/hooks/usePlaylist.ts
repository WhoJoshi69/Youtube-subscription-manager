import { useState, useEffect } from 'react';
import { Video } from '../types';
import { fetchPlaylistVideos } from '../api/youtube';
import { addToWatchHistory, addToWatchHistoryBatch, checkWatchedStatus } from '../lib/db';
import { isVideoWatched, addToLocalWatchHistory, getLocalWatchHistory } from '../utils/watchHistoryStorage';
import { saveState, loadState, STORAGE_KEYS } from '../utils/stateStorage';
import Home from './components/Home';

// Update Section type
type Section = 'home' | 'playlist' | 'subscriptions' | 'trending' | 'people';

export const usePlaylist = () => {
  // Load initial state from localStorage
  const initialState = loadState(STORAGE_KEYS.PLAYLIST) || {
    videos: [],
    nextPageToken: undefined,
    currentPlaylistUrl: null,
    isPartialLoading: true
  };

  const [videos, setVideos] = useState<Video[]>(initialState.videos);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(initialState.nextPageToken);
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPlaylistUrl, setCurrentPlaylistUrl] = useState<string | null>(initialState.currentPlaylistUrl);
  const [isPartialLoading, setIsPartialLoading] = useState(initialState.isPartialLoading);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(STORAGE_KEYS.PLAYLIST, {
      videos,
      nextPageToken,
      currentPlaylistUrl,
      isPartialLoading
    });
  }, [videos, nextPageToken, currentPlaylistUrl, isPartialLoading]);

  // Add effect to refresh videos when watch history changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'youtube_watch_history' && currentPlaylistUrl) {
        fetchPlaylist(currentPlaylistUrl, true);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentPlaylistUrl]);

  const fetchPlaylist = async (url: string, isInitialLoad: boolean = true) => {
    if (!url) {
      setError('Please enter a YouTube playlist URL');
      return;
    }

    if (isInitialLoad) {
      setIsLoading(true);
      setError(null);
      setVideos([]);
      setNextPageToken(undefined);
      setHasMoreVideos(true);
      setCurrentPlaylistUrl(url);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const result = await fetchPlaylistVideos(url, isInitialLoad ? undefined : nextPageToken);
      
      // Get local watch history for O(1) lookup
      const localHistory = getLocalWatchHistory();
      const localWatchedIds = new Set(localHistory.map(v => v.id));

      // Filter out videos watched in local storage first
      let unwatchedVideos = result.videos.filter(video => !localWatchedIds.has(video.id));

      // Check remaining videos against database in batches of 100
      const batchSize = 100;
      const finalUnwatchedVideos: Video[] = [];

      for (let i = 0; i < unwatchedVideos.length; i += batchSize) {
        const batch = unwatchedVideos.slice(i, i + batchSize);
        const watchedIds = await checkWatchedStatus(batch.map(v => v.id));
        const unwatchedBatch = batch.filter(video => !watchedIds.has(video.id));
        finalUnwatchedVideos.push(...unwatchedBatch);
      }
      
      setVideos(prev => isInitialLoad ? finalUnwatchedVideos : [...prev, ...finalUnwatchedVideos]);
      
      if (!isPartialLoading && result.nextPageToken) {
        const allVideos = [...finalUnwatchedVideos];
        let nextToken = result.nextPageToken;
        
        while (nextToken) {
          const nextResult = await fetchPlaylistVideos(url, nextToken);
          const nextUnwatchedVideos = nextResult.videos.filter(
            video => !localWatchedIds.has(video.id)
          );
          
          // Check against database
          const finalNextUnwatched: Video[] = [];
          for (let i = 0; i < nextUnwatchedVideos.length; i += batchSize) {
            const batch = nextUnwatchedVideos.slice(i, i + batchSize);
            const watchedIds = await checkWatchedStatus(batch.map(v => v.id));
            const unwatchedBatch = batch.filter(video => !watchedIds.has(video.id));
            finalNextUnwatched.push(...unwatchedBatch);
          }
          
          allVideos.push(...finalNextUnwatched);
          nextToken = nextResult.nextPageToken;
        }
        
        setVideos(allVideos);
        setHasMoreVideos(false);
      } else {
        setNextPageToken(result.nextPageToken);
        setHasMoreVideos(!!result.nextPageToken);
      }
    } catch (err) {
      console.error('Error fetching playlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch playlist videos');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  const markAsWatched = async (videoIds?: string[] | string) => {
    try {
      let videosToMark: Video[] = [];
      if (Array.isArray(videoIds) && videoIds.length > 0) {
        videosToMark = videos.filter(video => videoIds.includes(video.id));
      } else if (typeof videoIds === 'string') {
        videosToMark = videos.filter(video => video.id === videoIds);
      } else {
        videosToMark = videos.filter(video => video.selected);
      }
      
      // Update local storage immediately for instant UI feedback
      videosToMark.forEach(video => {
        addToLocalWatchHistory({ ...video, selected: false, watched: true });
      });
      
      // Update database in a single batch operation
      await addToWatchHistoryBatch(
        videosToMark.map(video => ({ ...video, selected: false, watched: true }))
      );
      
      // Remove watched videos from the list without triggering a full refresh
      setVideos(prevVideos => 
        prevVideos.filter(video => !videosToMark.some(v => v.id === video.id))
      );

      // Remove the storage event dispatch since we don't need a full refresh
      // window.dispatchEvent(new StorageEvent('storage', {
      //   key: 'youtube_watch_history'
      // }));
    } catch (err) {
      console.error('Error marking videos as watched:', err);
      setError('Failed to mark videos as watched');
    }
  };

  const toggleSelect = (videoIds: string[]) => {
    setVideos(prevVideos => 
      prevVideos.map(video => ({
        ...video,
        selected: videoIds.includes(video.id) ? !video.selected : video.selected
      }))
    );
  };

  const handleSelectAll = (videoIds: string[]) => {
    setVideos(prevVideos => 
      prevVideos.map(video => ({
        ...video,
        // If videoIds is empty, it means deselect
        selected: videoIds.length > 0 ? videoIds.includes(video.id) : false
      }))
    );
  };

  const loadMoreVideos = () => {
    if (!isLoadingMore && hasMoreVideos && currentPlaylistUrl) {
      fetchPlaylist(currentPlaylistUrl, false);
    }
  };

  return {
    videos,
    isLoading,
    isLoadingMore,
    hasMoreVideos,
    error,
    fetchPlaylist,
    loadMoreVideos,
    toggleSelect,
    handleSelectAll,
    markAsWatched,
    isPartialLoading,
    setIsPartialLoading,
    currentPlaylistUrl
  };
};