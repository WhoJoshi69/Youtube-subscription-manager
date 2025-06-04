import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trailer } from '../types';
import { Eye, EyeOff } from 'lucide-react';
import Loader from './Loader';

const Trailers: React.FC = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchTrailers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('trailers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setTrailers(data as Trailer[]);
    } catch (err: any) {
      setError('Failed to fetch trailers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrailers();
  }, []);

  const markAsWatched = async (id: string) => {
    setMarkingId(id);
    try {
      const { error } = await supabase
        .from('trailers')
        .update({ is_watched: true })
        .eq('id', id);
      if (error) throw error;
      // Remove the trailer from the grid instantly
      setTrailers(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to mark as watched');
    } finally {
      setMarkingId(null);
    }
  };

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          Trailers <span className="text-gray-400">({trailers.length})</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {trailers.map(trailer => (
          <div
            key={trailer.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col relative group cursor-pointer transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
            onClick={e => {
              // Only trigger if not clicking the eye button
              if ((e.target as HTMLElement).closest('button')) return;
              window.open(trailer.youtube_link, '_blank', 'noopener,noreferrer');
            }}
            tabIndex={0}
            role="button"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.open(trailer.youtube_link, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            {/* Use YouTube thumbnail as image */}
            {(() => {
              // Extract YouTube video ID from the link
              const match = trailer.youtube_link.match(/(?:youtu.be\/|v=|\/embed\/|\/shorts\/|\/watch\?v=|&v=)([\w-]{11})/);
              const videoId = match ? match[1] : null;
              const ytThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
              return ytThumb ? (
                <img
                  src={ytThumb}
                  alt={trailer.name}
                  className="rounded-lg w-full aspect-[16/9] object-cover mb-3 transition-transform duration-200 group-hover:scale-105 bg-black"
                  loading="lazy"
                />
              ) : (
                <div className="w-full aspect-[16/9] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-3 text-gray-400">
                  No Image
                </div>
              );
            })()}
            <div className="flex-1">
              <h3 className="text-lg font-medium mb-2 truncate" title={trailer.name}>{trailer.name}</h3>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <a
                href={trailer.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-500 hover:underline"
                onClick={e => e.stopPropagation()}
              >
                Source
              </a>
              <button
                className={`ml-2 p-2 rounded-full transition-colors ${trailer.is_watched ? 'bg-green-100 dark:bg-green-900 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-600'}`}
                title={trailer.is_watched ? 'Watched' : 'Mark as watched'}
                disabled={trailer.is_watched || markingId === trailer.id}
                onClick={e => {
                  e.stopPropagation();
                  markAsWatched(trailer.id);
                }}
              >
                {trailer.is_watched ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
        ))}
      </div>
      {trailers.length === 0 && (
        <div className="text-center text-gray-500 py-8">No trailers found.</div>
      )}
    </div>
  );
};

export default Trailers;
