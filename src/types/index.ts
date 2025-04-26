export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  selected: boolean;
  watched?: boolean;
  url?: string;
  viewCount?: number;
}

export interface PlaylistFetcherProps {
  onFetchPlaylist: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface VideoGridProps {
  videos: Video[];
  onToggleSelect: (videoIds: string[]) => void;
  onSelectAll: (videoIds: string[]) => void;
  onMarkAsWatched: (videoId: string) => void;
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasMoreVideos?: boolean;
  onLoadMore?: () => void;
  showChannelNames?: boolean;
}

export interface VideoCardProps {
  video: Video;
  onToggleSelect: (id: string) => void;
  showWatchedStatus?: boolean;
  onVideoWatched?: (videoId: string) => void;
}

export interface Channel {
  id: string;
  title: string;
  thumbnail: string;
  subscriberCount: string;
  isSubscribed?: boolean;
}

export interface SubscriptionState {
  channels: Channel[];
  lastUpdated?: string;
}