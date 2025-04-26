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

export const fetchPlaylistVideos = async (url: string): Promise<Video[]> => {
  const playlistId = extractPlaylistId(url);
  
  if (!playlistId) {
    throw new Error("Invalid YouTube playlist URL");
  }

  if (!YOUTUBE_API_KEY) {
    throw new Error("YouTube API key is not configured");
  }

  try {
    // Try to get from localStorage first
    const cached = localStorage.getItem(`playlist_${playlistId}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const videos: Video[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      // Construct the API URL with pagination
      const apiUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
      apiUrl.searchParams.append('part', 'snippet');
      apiUrl.searchParams.append('maxResults', '50');
      apiUrl.searchParams.append('playlistId', playlistId);
      apiUrl.searchParams.append('key', YOUTUBE_API_KEY);
      
      if (nextPageToken) {
        apiUrl.searchParams.append('pageToken', nextPageToken);
      }

      console.log('Fetching from URL:', apiUrl.toString());

      const response = await fetch(apiUrl.toString());
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch playlist videos');
      }

      // Process the videos
      const newVideos = data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails.maxres?.url || 
                  item.snippet.thumbnails.standard?.url || 
                  item.snippet.thumbnails.high?.url || 
                  item.snippet.thumbnails.medium?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        selected: false,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
      }));

      videos.push(...newVideos);

      // Update the nextPageToken for the next iteration
      nextPageToken = data.nextPageToken;

    } while (nextPageToken);

    // Store in localStorage
    localStorage.setItem(`playlist_${playlistId}`, JSON.stringify(videos));
    
    return videos;

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