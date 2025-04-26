export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  selected: boolean;
  watched?: boolean;
  url?: string;
}

export interface PlaylistFetcherProps {
  onFetchPlaylist: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface VideoGridProps {
  videos: Video[];
  onToggleSelect: (id: string) => void;
  onMarkAsWatched: () => void;
  isLoading: boolean;
  title?: string;
  showWatchedStatus?: boolean;
}

export interface VideoCardProps {
  video: Video;
  onToggleSelect: (id: string) => void;
  showWatchedStatus?: boolean;
}