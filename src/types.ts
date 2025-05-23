export type Section = 'playlist' | 'subscriptions' | 'history' | 'trending'; 

export interface Video {
  id: string;
  tmdbId?: number;
  tmdbType?: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  channelTitle: string;
  selected: boolean;
  watched: boolean;
  rating?: number; // Added for movie/show ratings
  lists?: Array<{
    id: string;
    name: string;
  }>;
} 