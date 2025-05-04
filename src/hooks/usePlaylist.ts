import { useState } from 'react';
import { Video } from '../types';
import { fetchPlaylistVideos } from '../api/youtube';
import { addToWatchHistory, addToWatchHistoryBatch } from '../lib/db';
import { isVideoWatched, addToLocalWatchHistory } from '../utils/watchHistoryStorage';

export const usePlaylist = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [currentPlaylistUrl, setCurrentPlaylistUrl] = useState<string | null>(null);
  const [isPartialLoading, setIsPartialLoading] = useState(true);

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
      const result = await fetchPlaylistVideos(
        url,
        isInitialLoad ? undefined : nextPageToken
      );
      
      // Filter out already watched videos
      const unwatchedVideos = result.videos.filter(
        video => !isVideoWatched(video.id)
      );
      
      setVideos(prev => isInitialLoad ? unwatchedVideos : [...prev, ...unwatchedVideos]);
      
      // If partial loading is disabled, keep fetching until we get all videos
      if (!isPartialLoading && result.nextPageToken) {
        const allVideos = [...unwatchedVideos];
        let nextToken = result.nextPageToken;
        
        while (nextToken) {
          const nextResult = await fetchPlaylistVideos(url, nextToken);
          const nextUnwatchedVideos = nextResult.videos.filter(
            video => !isVideoWatched(video.id)
          );
          allVideos.push(...nextUnwatchedVideos);
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

  const loadMoreVideos = () => {
    if (!isLoadingMore && hasMoreVideos && currentPlaylistUrl) {
      fetchPlaylist(currentPlaylistUrl, false);
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

  const markAsWatched = async () => {
    const selectedVideos = videos.filter(video => video.selected);
    
    try {
      // Update local storage immediately for instant UI feedback
      selectedVideos.forEach(video => {
        addToLocalWatchHistory({ ...video, selected: false, watched: true });
      });
      
      // Update database in a single batch operation
      await addToWatchHistoryBatch(
        selectedVideos.map(video => ({ ...video, selected: false, watched: true }))
      );
      
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