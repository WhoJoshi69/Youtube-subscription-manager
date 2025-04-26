import { useState, useEffect } from 'react';
import { Channel, Video } from '../types';
import { fetchChannelUploads } from '../api/youtube';

export const useSubscriptions = () => {
  const [subscribedChannels, setSubscribedChannels] = useState<Channel[]>(() => {
    const saved = localStorage.getItem('subscribed_channels');
    return saved ? JSON.parse(saved) : [];
  });

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filteredChannels, setFilteredChannels] = useState<string[]>([]);

  // Save subscribed channels to localStorage
  useEffect(() => {
    localStorage.setItem('subscribed_channels', JSON.stringify(subscribedChannels));
  }, [subscribedChannels]);

  const subscribeToChannel = (channel: Channel) => {
    setSubscribedChannels(prev => {
      if (prev.some(c => c.id === channel.id)) {
        return prev;
      }
      return [...prev, { ...channel, isSubscribed: true }];
    });
  };

  const unsubscribeFromChannel = (channelId: string) => {
    setSubscribedChannels(prev => prev.filter(c => c.id !== channelId));
    setFilteredChannels(prev => prev.filter(id => id !== channelId));
  };

  const toggleChannelFilter = (channelId: string) => {
    setFilteredChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
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
      
      // Fetch videos from each subscribed channel that isn't filtered out
      const activeChannels = subscribedChannels.filter(
        channel => !filteredChannels.includes(channel.id)
      );

      for (const channel of activeChannels) {
        try {
          const channelVideos = await fetchChannelUploads(channel.id);
          allVideos.push(...channelVideos.map(video => ({
            ...video,
            channelId: channel.id // Add channelId to track video source
          })));
        } catch (err) {
          console.error(`Error fetching videos for channel ${channel.title}:`, err);
        }
      }

      // Sort videos by date
      const sortedVideos = allVideos.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

      setVideos(sortedVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription videos');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch videos whenever subscriptions or filters change
  useEffect(() => {
    fetchSubscriptionVideos();
  }, [subscribedChannels, filteredChannels]);

  return {
    subscribedChannels,
    filteredChannels,
    videos,
    isLoading,
    error,
    subscribeToChannel,
    unsubscribeFromChannel,
    toggleChannelFilter,
    refreshVideos: fetchSubscriptionVideos
  };
}; 