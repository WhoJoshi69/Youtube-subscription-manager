import { Video } from '../types';

// Extract playlist ID from a YouTube playlist URL
export const extractPlaylistId = (url: string): string | null => {
  const regex = /[&?]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Fetch playlist videos using Supabase Edge Function
export const fetchPlaylistVideos = async (url: string): Promise<Video[]> => {
  const playlistId = extractPlaylistId(url);
  
  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL");
  }

  try {
    // Try to get from localStorage first
    const cached = localStorage.getItem(`playlist_${playlistId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from Supabase Edge Function
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-playlist?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch playlist videos');
    }

    const videos = await response.json();
    
    // Add selected property to each video
    const videosWithSelected = videos.map((video: Video) => ({
      ...video,
      selected: false,
    }));

    // Store in localStorage
    localStorage.setItem(`playlist_${playlistId}`, JSON.stringify(videosWithSelected));
    
    return videosWithSelected;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch playlist videos');
  }
};