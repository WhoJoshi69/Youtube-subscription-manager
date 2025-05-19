import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { GradientLayout } from './Layout/GradientLayout';
import MovieGrid from './MovieGrid';
import { ArrowLeft } from 'lucide-react';

interface CollectionProps {
  apiKey: string;
  darkMode?: boolean;
  onThemeToggle?: () => void;
}

const Collection: React.FC<CollectionProps> = ({ apiKey, darkMode, onThemeToggle }) => {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCollection = async () => {
      setLoading(true);
      const url = `https://api.themoviedb.org/3/collection/${id}?api_key=${apiKey}&language=en-US`;
      const response = await fetch(url);
      const data = await response.json();
      setCollection(data);
      setLoading(false);
    };
    fetchCollection();
  }, [id, apiKey]);

  if (loading) return <div>Loading...</div>;
  if (!collection) return <div>Collection not found</div>;

  // Transform collection parts into the format expected by MovieGrid
  const movies = collection.parts.map((movie: any) => ({
    id: movie.id.toString(),
    tmdbId: movie.id,
    tmdbType: 'movie',
    title: movie.title,
    description: movie.overview,
    thumbnail: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
    publishedAt: movie.release_date,
    rating: movie.vote_average,
  }));

  return (
    <GradientLayout darkMode={darkMode}>
      <Header darkMode={darkMode} onThemeToggle={onThemeToggle} />
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 px-4 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="bg-black/60 dark:bg-gray-900/80 rounded-2xl shadow-lg p-6">
          <h1 className="text-3xl font-bold mb-6 text-white">{collection.name}</h1>
          {collection.overview && (
            <p className="text-gray-200 mb-8">{collection.overview}</p>
          )}
          <MovieGrid videos={movies} isLoading={false} />
        </div>
      </div>
    </GradientLayout>
  );
};

export default Collection; 