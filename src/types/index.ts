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
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onMarkAsWatched: () => void;
  isLoading: boolean;
  title?: string;
  showWatchedStatus?: boolean;
  selectedCount?: number;
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