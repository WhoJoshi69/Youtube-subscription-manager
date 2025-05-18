import { useState, useEffect } from 'react';
import { Channel, Video } from '../types';
import { fetchChannelUploads } from '../api/youtube';
import {
  getSubscriptions,
  addSubscription,
  removeSubscription,
  getFilteredChannels,
  updateFilteredChannels,
  addToWatchHistory,
  getWatchHistory,
  addToWatchHistoryBatch,
  checkWatchedStatus
} from '../lib/db';
import { isVideoWatched, addToLocalWatchHistory, getLocalWatchHistory } from '../utils/watchHistoryStorage';

export const useSubscriptions = () => {
  const [subscribedChannels, setSubscribedChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredChannels, setFilteredChannels] = useState<string[]>([]);
  
  // Load subscriptions and filtered channels on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [subs, filtered] = await Promise.all([
          getSubscriptions(),
          getFilteredChannels()
        ]);
        setSubscribedChannels(subs || []);
        setFilteredChannels(filtered || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load subscriptions');
        setSubscribedChannels([]);
        setFilteredChannels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Add a new effect to fetch videos when subscriptions are loaded
  // useEffect(() => {
  //   if (subscribedChannels.length > 0) {
  //     fetchSubscriptionVideos();
  //   }
  // }, [subscribedChannels]); // This will run when subscribedChannels changes

  // Add a new effect to refresh videos when watch history changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'youtube_watch_history') {
        fetchSubscriptionVideos();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchSubscriptionVideos = async () => {
    if (subscribedChannels.length === 0) {
      setVideos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const activeChannels = subscribedChannels.filter(
        channel => !filteredChannels.includes(channel.id)
      );

      // Fetch videos from all channels concurrently
      const channelFetchPromises = activeChannels.map(channel => 
        fetchChannelUploads(channel.id)
          .catch(err => {
            console.error(`Error fetching videos for channel ${channel.title}:`, err);
            return { videos: [], nextPageToken: undefined };
          })
      );

      const results = await Promise.all(channelFetchPromises);
      
      // Combine all videos from all channels
      const newVideos = results.flatMap(result => result.videos);

      if (newVideos.length === 0) {
        throw new Error('Failed to fetch videos from any channel');
      }

      // Get local watch history
      const localHistory = getLocalWatchHistory();
      const localWatchedIds = new Set(localHistory.map(v => v.id));

      // Filter out videos watched in local storage first
      let unwatchedVideos = newVideos.filter(video => !localWatchedIds.has(video.id));

      // Check remaining videos against database in batches of 100
      const batchSize = 100;
      const finalUnwatchedVideos: Video[] = [];

      for (let i = 0; i < unwatchedVideos.length; i += batchSize) {
        const batch = unwatchedVideos.slice(i, i + batchSize);
        const watchedIds = await checkWatchedStatus(batch.map(v => v.id));
        const unwatchedBatch = batch.filter(video => !watchedIds.has(video.id));
        finalUnwatchedVideos.push(...unwatchedBatch);
      }

      // Filter for videos after April 20, 2025
      const cutoffDate = new Date('2025-04-20T00:00:00Z');
      const filteredVideos = finalUnwatchedVideos.filter(
        video => new Date(video.publishedAt) >= cutoffDate
      );

      // Sort by date
      const sortedVideos = filteredVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setVideos(sortedVideos);
    } catch (err) {
      setError('Failed to fetch subscription videos');
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const subscribeToChannel = async (channel: Channel) => {
    try {
      await addSubscription(channel);
      setSubscribedChannels(prev => {
        if (prev.some(c => c.id === channel.id)) {
          return prev;
        }
        return [...prev, { ...channel, isSubscribed: true }];
      });
    } catch (err) {
      setError('Failed to subscribe to channel');
    }
  };

  const unsubscribeFromChannel = async (channelId: string) => {
    try {
      await removeSubscription(channelId);
      setSubscribedChannels(prev => prev.filter(c => c.id !== channelId));
      setFilteredChannels(prev => prev.filter(id => id !== channelId));
    } catch (err) {
      setError('Failed to unsubscribe from channel');
    }
  };

  const toggleChannelFilter = async (channelId: string) => {
    const newFilters = filteredChannels.includes(channelId)
      ? filteredChannels.filter(id => id !== channelId)
      : [...filteredChannels, channelId];
    
    try {
      await updateFilteredChannels(newFilters);
      setFilteredChannels(newFilters);
    } catch (err) {
      setError('Failed to update channel filters');
    }
  };

  const hideAllChannels = async () => {
    try {
      await updateFilteredChannels(subscribedChannels.map(channel => channel.id));
      setFilteredChannels(subscribedChannels.map(channel => channel.id));
    } catch (err) {
      setError('Failed to hide all channels');
    }
  };

  const showAllChannels = async () => {
    try {
      await updateFilteredChannels([]);
      setFilteredChannels([]);
    } catch (err) {
      setError('Failed to show all channels');
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
        selected: videoIds.length > 0 ? videoIds.includes(video.id) : false
      }))
    );
  };

  const markAsWatched = async (videoIds?: string | string[]) => {
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
      
      // Remove watched videos from the list
      setVideos(prevVideos => 
        prevVideos.filter(video => !videosToMark.some(v => v.id === video.id))
      );
    } catch (err) {
      console.error('Error marking videos as watched:', err);
      setError('Failed to mark videos as watched');
    }
  };

  return {
    subscribedChannels,
    filteredChannels,
    videos,
    isLoading,
    error,
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleChannelFilter,
    refreshVideos: () => fetchSubscriptionVideos(),
    hideAllChannels,
    showAllChannels,
    toggleSelect,
    handleSelectAll,
    markAsWatched
  };
}; 