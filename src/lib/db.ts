import { supabase, ensureAuthenticated } from './supabase';
import { Channel, Video } from '../types';

// Subscriptions
export async function getSubscriptions() {
  await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }

  return data as Channel[];
}

export async function addSubscription(channel: Channel) {
  await ensureAuthenticated();
  
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([
      {
        id: channel.id,
        title: channel.title,
        thumbnail: channel.thumbnail,
        subscriber_count: channel.subscriberCount,
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }

  return data;
}

export async function removeSubscription(channelId: string) {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', channelId);

  if (error) {
    console.error('Error removing subscription:', error);
    throw error;
  }
}

// Watch History
export async function getWatchHistory() {
  const { data, error } = await supabase
    .from('watch_history')
    .select('*')
    .order('watched_at', { ascending: false });

  if (error) {
    console.error('Error fetching watch history:', error);
    throw error;
  }

  return data as Video[];
}

export async function addToWatchHistory(video: Video) {
  const { data, error } = await supabase
    .from('watch_history')
    .insert([
      {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel_title: video.channelTitle,
        published_at: video.publishedAt,
        watched_at: new Date().toISOString(),
        url: video.url
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding to watch history:', error);
    throw error;
  }

  return data;
}

export async function removeFromWatchHistory(videoIds: string[]) {
  const { error } = await supabase
    .from('watch_history')
    .delete()
    .in('id', videoIds);

  if (error) {
    console.error('Error removing from watch history:', error);
    throw error;
  }
}

// Filtered Channels
export async function getFilteredChannels() {
  const { data, error } = await supabase
    .from('filtered_channels')
    .select('channel_id');

  if (error) {
    console.error('Error fetching filtered channels:', error);
    throw error;
  }

  return data.map(item => item.channel_id);
}

export async function updateFilteredChannels(channelIds: string[]) {
  // First, delete all existing filters
  await supabase
    .from('filtered_channels')
    .delete()
    .not('channel_id', 'is', null);

  // Then insert new ones if there are any
  if (channelIds.length > 0) {
    const { error } = await supabase
      .from('filtered_channels')
      .insert(channelIds.map(id => ({ channel_id: id })));

    if (error) {
      console.error('Error updating filtered channels:', error);
      throw error;
    }
  }
} 