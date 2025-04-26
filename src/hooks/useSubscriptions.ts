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
  
  // Add new states for pagination
  const [pageTokens, setPageTokens] = useState<Record<string, string | null>>({});
  const [hasMoreVideos, setHasMoreVideos] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  const fetchSubscriptionVideos = async (isInitialLoad: boolean = true) => {
    if (subscribedChannels.length === 0) {
      setVideos([]);
      setHasMoreVideos(false);
      return;
    }

    if (isInitialLoad) {
      setIsLoading(true);
      setError(null);
      setPageTokens({});
    } else {
      setIsLoadingMore(true);
    }

    try {
      const activeChannels = subscribedChannels.filter(
        channel => !filteredChannels.includes(channel.id)
      );

      const newVideos: Video[] = [];
      const newPageTokens: Record<string, string | null> = { ...pageTokens };
      let hasErrors = false;

      for (const channel of activeChannels) {
        try {
          // Skip if we've already loaded all videos for this channel
          if (!isInitialLoad && newPageTokens[channel.id] === null) {
            continue;
          }

          const result = await fetchChannelUploads(
            channel.id,
            isInitialLoad ? undefined : newPageTokens[channel.id]
          );

          newVideos.push(...result.videos);
          newPageTokens[channel.id] = result.nextPageToken || null;
        } catch (err) {
          console.error(`Error fetching videos for channel ${channel.title}:`, err);
          hasErrors = true;
        }
      }

      if (hasErrors && newVideos.length === 0) {
        throw new Error('Failed to fetch videos from any channel');
      }

      // Filter out watched videos
      const unwatchedVideos = newVideos.filter(
        video => !isVideoWatched(video.id)
      );

      // Sort by date
      const sortedVideos = unwatchedVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      // Update videos state
      setVideos(prev => 
        isInitialLoad ? sortedVideos : [...prev, ...sortedVideos]
      );
      
      // Update page tokens
      setPageTokens(newPageTokens);
      
      // Check if we have more videos to load
      setHasMoreVideos(Object.values(newPageTokens).some(token => token !== null));
    } catch (err) {
      setError('Failed to fetch subscription videos');
      if (isInitialLoad) {
        setVideos([]);
      }
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  };

  // Function to load more videos
  const loadMoreVideos = () => {
    if (!isLoadingMore && hasMoreVideos) {
      fetchSubscriptionVideos(false);
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
    isLoadingMore,
    hasMoreVideos,
    error,
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleChannelFilter,
    refreshVideos: () => fetchSubscriptionVideos(true),
    loadMoreVideos,
    hideAllChannels,
    showAllChannels,
    toggleSelect,
    handleSelectAll,
    markAsWatched
  };
}; 