import { Video } from '../types';

// Get API key from environment variables
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

if (!YOUTUBE_API_KEY) {
  console.error('YouTube API key is not configured. Please check your .env file.');
}

// Extract playlist ID from a YouTube playlist URL
export const extractPlaylistId = (url: string): string | null => {
  const regex = /[?&]list=([^&]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

interface YouTubeApiResponse {
  items: Array<{
    snippet: {
      title: string;
      thumbnails: {
        medium: { url: string };
        standard?: { url: string };
      };
      channelTitle: string;
      publishedAt: string;
      resourceId: {
        videoId: string;
      };
    };
  }>;
  nextPageToken?: string;
}

export const fetchPlaylistVideos = async (
  url: string,
  pageToken?: string,
  maxResults: number = 100
): Promise<{ videos: Video[]; nextPageToken?: string }> => {
  const playlistId = extractPlaylistId(url);
  
  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL");
  }

  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key is not configured");
  }

  try {
    // Construct the API URL with pagination
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    apiUrl.searchParams.append('part', 'snippet');
    apiUrl.searchParams.append('maxResults', maxResults.toString());
    apiUrl.searchParams.append('playlistId', playlistId);
    apiUrl.searchParams.append('key', YOUTUBE_API_KEY);
    
    if (pageToken) {
      apiUrl.searchParams.append('pageToken', pageToken);
    }

    const response = await fetch(apiUrl.toString());
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch playlist videos');
    }

    // Extract video IDs
    const videoIds = data.items.map((item: any) => item.snippet.resourceId.videoId).filter(Boolean);

    // Fetch view counts in batch (max 50 per request)
    let viewCounts: Record<string, number> = {};
    if (videoIds.length > 0) {
      const videosApiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosApiUrl.searchParams.append('part', 'statistics');
      videosApiUrl.searchParams.append('id', videoIds.join(','));
      videosApiUrl.searchParams.append('key', YOUTUBE_API_KEY);

      const videosResponse = await fetch(videosApiUrl.toString());
      const videosData = await videosResponse.json();
      if (videosResponse.ok) {
        for (const item of videosData.items) {
          viewCounts[item.id] = parseInt(item.statistics.viewCount, 10) || 0;
        }
      }
    }

    const videos = data.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.maxres?.url || 
                item.snippet.thumbnails.standard?.url || 
                item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      selected: false,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      viewCount: viewCounts[item.snippet.resourceId.videoId] ?? 0,
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch playlist videos');
  }
};

// Optional: Add a function to fetch video details individually if needed
export const fetchVideoDetails = async (videoId: string): Promise<Video> => {
  try {
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    apiUrl.searchParams.append('part', 'snippet');
    apiUrl.searchParams.append('id', videoId);
    apiUrl.searchParams.append('key', YOUTUBE_API_KEY);

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }

    const data = await response.json();
    const videoData = data.items[0]?.snippet;

    if (!videoData) {
      throw new Error('Video not found');
    }

    return {
      id: videoId,
      title: videoData.title,
      thumbnail: videoData.thumbnails.standard?.url || videoData.thumbnails.medium.url,
      channelTitle: videoData.channelTitle,
      publishedAt: videoData.publishedAt,
      selected: false,
      url: `https://www.youtube.com/watch?v=${videoId}`
    };

  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch video details');
  }
};

interface YouTubeChannel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
}

function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export const searchYouTubeChannel = async (query: string) => {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key is not configured");
  }

  try {
    // First, search for channels
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.append('part', 'snippet');
    searchUrl.searchParams.append('type', 'channel');
    searchUrl.searchParams.append('q', query);
    searchUrl.searchParams.append('maxResults', '5');
    searchUrl.searchParams.append('key', YOUTUBE_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      throw new Error(searchData.error?.message || 'Failed to search channels');
    }

    // Get channel IDs from search results
    const channelIds = searchData.items.map((item: any) => item.snippet.channelId);

    // Fetch detailed channel information
    const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
    channelsUrl.searchParams.append('part', 'snippet,statistics,brandingSettings');
    channelsUrl.searchParams.append('id', channelIds.join(','));
    channelsUrl.searchParams.append('key', YOUTUBE_API_KEY);

    const channelsResponse = await fetch(channelsUrl.toString());
    const channelsData = await channelsResponse.json();

    if (!channelsResponse.ok) {
      throw new Error(channelsData.error?.message || 'Failed to fetch channel details');
    }

    return channelsData.items.map((channel: any) => ({
      id: channel.id,
      title: channel.snippet.title,
      thumbnail: channel.snippet.thumbnails.medium.url,
      subscriberCount: formatSubscriberCount(parseInt(channel.statistics.subscriberCount)),
      description: channel.snippet.description,
      videoCount: channel.statistics.videoCount,
      joinedDate: new Date(channel.snippet.publishedAt).toLocaleDateString(),
      isSubscribed: false
    }));

  } catch (error) {
    console.error('Error searching channels:', error);
    throw error instanceof Error ? error : new Error('Failed to search channels');
  }
};

export const fetchChannelUploads = async (
  channelId: string,
  pageToken?: string,
  maxResults: number = 20
): Promise<{ videos: Video[]; nextPageToken?: string }> => {
  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key is not configured");
  }

  try {
    // Convert channel ID to uploads playlist ID
    const uploadsPlaylistId = channelId.replace('UC', 'UU');
    
    // Construct the API URL with pagination
    const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    apiUrl.searchParams.append('part', 'snippet');
    apiUrl.searchParams.append('maxResults', maxResults.toString());
    apiUrl.searchParams.append('playlistId', uploadsPlaylistId);
    apiUrl.searchParams.append('key', YOUTUBE_API_KEY);
    
    if (pageToken) {
      apiUrl.searchParams.append('pageToken', pageToken);
    }

    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error('Failed to fetch channel uploads');
    }

    const data = await response.json();
    
    const videos = data.items.map((item: any) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.standard?.url || 
                item.snippet.thumbnails.high?.url || 
                item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      selected: false,
      channelId: channelId,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
    }));

    return {
      videos,
      nextPageToken: data.nextPageToken
    };
  } catch (error) {
    console.error('Error fetching channel uploads:', error);
    throw error;
  }
};