import { useState, useEffect } from 'react';
import { Channel, Video } from '../types';
import { fetchChannelUploads } from '../api/youtube';
import {
  getSubscriptions,
  addSubscription,
  removeSubscription,
  getFilteredChannels,
  updateFilteredChannels,
  addToWatchHistory
} from '../lib/db';
import { isVideoWatched, addToLocalWatchHistory } from '../utils/watchHistoryStorage';

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

      const newVideos: Video[] = [];
      let hasErrors = false;

      for (const channel of activeChannels) {
        try {
          // Fetch all videos at once without pagination
          const result = await fetchChannelUploads(channel.id);
          newVideos.push(...result.videos);
        } catch (err) {
          console.error(`Error fetching videos for channel ${channel.title}:`, err);
          hasErrors = true;
        }
      }

      if (hasErrors && newVideos.length === 0) {
        throw new Error('Failed to fetch videos from any channel');
      }

      // Filter for videos after April 20, 2025
      const cutoffDate = new Date('2025-04-20T00:00:00Z');
      
      // Filter out watched videos and videos before the cutoff date
      const filteredVideos = newVideos.filter(
        video => !isVideoWatched(video.id) && new Date(video.publishedAt) >= cutoffDate
      );

      // Sort by date
      const sortedVideos = filteredVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Update videos state
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

  const markAsWatched = async () => {
    const selectedVideos = videos.filter(video => video.selected);
    
    try {
      for (const video of selectedVideos) {
        await addToWatchHistory({ ...video, selected: false, watched: true });
        addToLocalWatchHistory({ ...video, watched: true });
      }
      
      setVideos(prevVideos => prevVideos.filter(video => !video.selected));
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