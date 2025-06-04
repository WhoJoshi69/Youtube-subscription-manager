import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trailer } from '../types';
import { Eye, EyeOff } from 'lucide-react';
import Loader from './Loader';

interface YoutubeTitleMap {
  [videoId: string]: string;
}

const Trailers: React.FC = () => {
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [vanishing, setVanishing] = useState<{ [id: string]: boolean }>({});
  const [ytTitles, setYtTitles] = useState<YoutubeTitleMap>({});

  // Fetch YouTube video titles for all trailers
  useEffect(() => {
    const fetchTitles = async () => {
      const newTitles: YoutubeTitleMap = {};
      for (const trailer of trailers) {
        const match = trailer.youtube_link.match(/(?:youtu.be\/|v=|\/embed\/|\/shorts\/|\/watch\?v=|&v=)([\w-]{11})/);
        const videoId = match ? match[1] : null;
        if (!videoId) continue;
        try {
          // Try to fetch title from YouTube oEmbed (no API key needed)
          const resp = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
          if (resp.ok) {
            const data = await resp.json();
            newTitles[videoId] = data.title;
          }
        } catch {
          // Ignore errors, fallback to DB title
        }
      }
      setYtTitles(newTitles);
    };
    if (trailers.length > 0) fetchTitles();
  }, [trailers]);

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
    setVanishing(prev => ({ ...prev, [id]: true }));
    setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('trailers')
          .update({ is_watched: true })
          .eq('id', id);
        if (error) throw error;
        setTrailers(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        setError('Failed to mark as watched');
      } finally {
        setMarkingId(null);
        setVanishing(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    }, 250); // Animation duration
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {trailers.map(trailer => {
          // Extract YouTube video ID and thumbnail
          const match = trailer.youtube_link.match(/(?:youtu.be\/|v=|\/embed\/|\/shorts\/|\/watch\?v=|&v=)([\w-]{11})/);
          const videoId = match ? match[1] : null;
          const ytThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
          return (
            <div
              key={trailer.id}
              className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm transition-all duration-200 transform cursor-pointer
                ${vanishing[trailer.id] ? 'scale-95 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
              style={{
                gridColumn: vanishing[trailer.id] ? 'span 1' : 'auto',
                minHeight: vanishing[trailer.id] ? '0' : 'auto',
                margin: vanishing[trailer.id] ? '0' : undefined,
                padding: vanishing[trailer.id] ? '0' : undefined,
              }}
              tabIndex={0}
              role="button"
              onClick={e => {
                if ((e.target as HTMLElement).closest('button')) return;
                if (videoId) window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
              }}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && videoId) {
                  window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {/* Thumbnail container */}
              <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                {ytThumb ? (
                  <img
                    src={ytThumb}
                    alt={trailer.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
                {/* Play button in center */}
                <button
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/50 hover:bg-red-600 text-white transition-all duration-200 backdrop-blur-sm opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 z-10"
                  title="Play trailer"
                  tabIndex={-1}
                  onClick={e => {
                    e.stopPropagation();
                    if (videoId) window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
                </button>
                {/* Watched button overlay */}
                <button
                  className="absolute bottom-2 right-2 p-2 rounded-full text-white transition-all duration-200 backdrop-blur-sm hover:scale-110 z-10 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100"
                  title="Mark as watched"
                  disabled={markingId === trailer.id}
                  onClick={e => {
                    e.stopPropagation();
                    markAsWatched(trailer.id);
                  }}
                >
                  <Eye size={20} />
                </button>
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 bg-black/20 transition-opacity duration-200 group-hover:opacity-100 opacity-0" />
              </div>
              {/* Trailer info */}
              <div className="p-4">
                <h3 className="text-sm font-medium line-clamp-2 mb-1 text-gray-900 dark:text-white">{(videoId && ytTitles[videoId]) ? ytTitles[videoId] : trailer.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <a
                    href={trailer.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:underline"
                    onClick={e => e.stopPropagation()}
                  >
                    Source
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {trailers.length === 0 && (
        <div className="text-center text-gray-500 py-8">No trailers found.</div>
      )}
    </div>
  );
};

export default Trailers;
