import React from 'react';
import { Video } from '../types';
import { Star, Clock, List, Plus, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

interface List {
  id: string;
  name: string;
  description: string | null;
}

interface MovieGridProps {
  videos: Video[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  lastVideoElementRef?: (node: HTMLDivElement) => void;
  onVideoClick?: (video: Video) => void;
  showListSelection?: boolean;
}

// Helper function to calculate days until release
const getDaysUntilRelease = (releaseDate: string): string => {
  if (!releaseDate) return '?';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  
  const diffTime = release.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays.toString();
};

const MovieGrid: React.FC<MovieGridProps> = ({ 
  videos, 
  isLoading, 
  isLoadingMore, 
  lastVideoElementRef,
  onVideoClick,
  showListSelection = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isAddingToLists, setIsAddingToLists] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching lists:', error);
      return;
    }

    setLists(data);
  };

  const handleAddToLists = async (video: Video) => {
    if (!user || selectedLists.size === 0) return;
    
    setIsAddingToLists(true);
    setError(null);

    try {
      const { data: entertainmentData, error: entertainmentError } = await supabase
        .from('entertainment')
        .upsert({
          tmdb_id: video.tmdbId,
          title: video.title,
          type: video.tmdbType,
          poster_path: video.thumbnail.replace('https://image.tmdb.org/t/p/w500', ''),
          overview: video.description,
          release_date: video.publishedAt,
          vote_average: video.rating
        })
        .select()
        .single();

      if (entertainmentError) throw entertainmentError;

      const mappings = Array.from(selectedLists).map(listId => ({
        list_id: listId,
        entertainment_id: entertainmentData.id
      }));

      const { error: mappingError } = await supabase
        .from('list_entertainment_map')
        .upsert(mappings);

      if (mappingError) throw mappingError;

      setSelectedLists(new Set());
      setFlippedCardId(null);
    } catch (err) {
      console.error('Error adding to lists:', err);
      setError('Failed to add to lists. Please try again.');
    } finally {
      setIsAddingToLists(false);
    }
  };

  const toggleList = (listId: string) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 w-3/4"></div>
    </div>
  );

  // Show loading skeletons only for initial load
  if (isLoading && videos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {videos.map((video, index) => {
        const isTmdb = video.tmdbId && video.tmdbType;
        const detailUrl = isTmdb
          ? `/tmdb/${video.tmdbType}/${video.tmdbId}`
          : undefined;

        const releaseDate = new Date(video.publishedAt);
        const today = new Date();
        const isUnreleased = releaseDate > today;
        const daysUntil = isUnreleased ? getDaysUntilRelease(video.publishedAt) : null;

        return (
          <div
            key={video.id}
            ref={index === videos.length - 1 ? lastVideoElementRef : undefined}
            className="relative h-full"
            style={{ perspective: '1000px' }}
          >
            <motion.div
              initial={false}
              animate={{ rotateY: flippedCardId === video.id ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="relative w-full h-full"
            >
              {/* Front of card */}
              <div
                className={`group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  flippedCardId === video.id ? 'invisible' : ''
                }`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Add to List Button */}
                {showListSelection && user && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFlippedCardId(video.id);
                      setSelectedLists(new Set());
                      fetchLists();
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 z-10"
                  >
                    <List className="w-4 h-4 text-white" />
                  </button>
                )}

                {/* Video content */}
                <div
                  onClick={() => {
                    if (onVideoClick) {
                      onVideoClick(video);
                    }
                    if (detailUrl) {
                      navigate(detailUrl, {
                        state: {
                          from: 'trending',
                          scrollPosition: window.scrollY,
                          // Add any other state you want to preserve
                        }
                      });
                    }
                  }}
                  className="cursor-pointer"
                >
                  <div className="aspect-[2/3] relative">
                    <img
                      src={
                        video.thumbnail
                          ? video.thumbnail
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&background=444&color=fff&size=256`
                      }
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&background=444&color=fff&size=256`;
                      }}
                    />
                    
                    {/* Days Until Release Overlay */}
                    {isUnreleased && daysUntil && (
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-sm font-medium flex items-center gap-1 shadow-lg">
                        <Clock size={14} />
                        <span>{daysUntil === '?' ? '?' : `${daysUntil}d`}</span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <p className="text-sm line-clamp-4">{video.description}</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{video.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-medium line-clamp-2" title={video.title}>
                      {video.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(video.publishedAt).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div
                className={`absolute inset-0 bg-white dark:bg-gray-800 rounded-lg p-4 ${
                  flippedCardId === video.id ? 'visible' : 'invisible'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold">Add to Lists</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedCardId(null);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {error && (
                    <div className="mb-2 p-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded">
                      {error}
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto space-y-1">
                    {lists.map(list => (
                      <label
                        key={list.id}
                        className="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedLists.has(list.id)}
                          onChange={() => toggleList(list.id)}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors
                          ${selectedLists.has(list.id)
                            ? 'bg-red-600 border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {selectedLists.has(list.id) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className="truncate">{list.name}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToLists(video);
                    }}
                    disabled={isAddingToLists || selectedLists.size === 0}
                    className={`mt-3 w-full px-3 py-1.5 text-sm font-medium text-white rounded-lg
                      ${isAddingToLists || selectedLists.size === 0
                        ? 'bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'
                      }`}
                  >
                    {isAddingToLists ? 'Adding...' : 'Add to Lists'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* Show loading skeletons at the bottom when loading more */}
      {isLoadingMore && (
        <>
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={`loading-more-${i}`} />
          ))}
        </>
      )}
    </div>
  );
};

export default MovieGrid; 