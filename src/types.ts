export type Section = 'playlist' | 'subscriptions' | 'history' | 'trending' | 'tracker'; 

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
} exp
ort interface FavoriteActor {
  id: string;
  user_id: string;
  actor_id: number;
  actor_name: string;
  actor_image?: string;
  added_at: string;
}

export interface ActorMovie {
  id: string;
  actor_id: number;
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  release_date?: string;
  overview?: string;
  vote_average?: number;
  created_at: string;
}

export interface NewMovieForFavorite {
  movie_id: number;
  movie_title: string;
  movie_poster?: string;
  release_date?: string;
  overview?: string;
  vote_average?: number;
  actor_id: number;
  actor_name: string;
  actor_image?: string;
  is_new: boolean;
}

export interface UserMovieTracking {
  id: string;
  user_id: string;
  movie_id: number;
  actor_id: number;
  seen_at: string;
}