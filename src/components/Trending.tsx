import React, { useState, useEffect } from 'react';
import MovieGrid from './MovieGrid';
import { Video } from '../types';
import { Film, Tv } from 'lucide-react';

interface TrendingProps {
  apiKey: string;
}

interface TMDBVideo {
  id: number;
  title: string;
  name: string;
  overview: string;
  poster_path: string;
  release_date: string;
  first_air_date: string;
  vote_average: number;
}

const Trending: React.FC<TrendingProps> = ({ apiKey }) => {
  const [activeTab, setActiveTab] = useState<'movies' | 'tvshows'>('movies');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrending = async (type: 'movie' | 'tv') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/${type}/day?api_key=${apiKey}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch trending content');
      }
      const data = await response.json();
      
      // Convert TMDB format to our Video format
      const convertedVideos: Video[] = data.results.map((item: TMDBVideo) => ({
        id: `tmdb-${item.id}`,
        title: item.title || item.name,
        description: item.overview,
        thumbnail: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        publishedAt: item.release_date || item.first_air_date,
        channelTitle: type === 'movie' ? 'Movies' : 'TV Shows',
        selected: false,
        watched: false,
        rating: item.vote_average
      }));

      setVideos(convertedVideos);
    } catch (err) {
      setError('Failed to fetch trending content');
      console.error('Error fetching trending content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrending(activeTab === 'movies' ? 'movie' : 'tv');
  }, [activeTab, apiKey]);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trending</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${activeTab === 'movies'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Film size={16} />
            <span>Movies</span>
          </button>
          <button
            onClick={() => setActiveTab('tvshows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${activeTab === 'tvshows'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Tv size={16} />
            <span>TV Shows</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <MovieGrid videos={videos} isLoading={isLoading} />
    </div>
  );
};

export default Trending; 