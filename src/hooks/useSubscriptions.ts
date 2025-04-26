import { useState, useEffect } from 'react';
import { Channel, Video } from '../types';
import { fetchChannelUploads } from '../api/youtube';
import {
  getSubscriptions,
  addSubscription,
  removeSubscription,
  getFilteredChannels,
  updateFilteredChannels
} from '../lib/db';

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
        const [subs, filtered] = await Promise.all([
          getSubscriptions(),
          getFilteredChannels()
        ]);
        setSubscribedChannels(subs);
        setFilteredChannels(filtered);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load subscriptions');
      }
    };

    loadData();
  }, []);

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

  const fetchSubscriptionVideos = async () => {
    if (subscribedChannels.length === 0) {
      setVideos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const allVideos: Video[] = [];
      
      const activeChannels = subscribedChannels.filter(
        channel => !filteredChannels.includes(channel.id)
      );

      for (const channel of activeChannels) {
        try {
          const channelVideos = await fetchChannelUploads(channel.id);
          allVideos.push(...channelVideos.map(video => ({
            ...video,
            channelId: channel.id
          })));
        } catch (err) {
          console.error(`Error fetching videos for channel ${channel.title}:`, err);
        }
      }

      const sortedVideos = allVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setVideos(sortedVideos);
    } catch (err) {
      setError('Failed to fetch subscription videos');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionVideos();
  }, [subscribedChannels, filteredChannels]);

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

  return {
    subscribedChannels,
    filteredChannels,
    videos,
    isLoading,
    error,
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleChannelFilter,
    refreshVideos: fetchSubscriptionVideos,
    hideAllChannels,
    showAllChannels
  };
}; 