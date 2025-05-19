import React from 'react';
import { Video } from '../types';
import { Star, Clock, List, Plus, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useWatchedTitles } from '../hooks/useWatchedTitles';

interface List {
  id: string;
  name: string;
  description: string | null;
}

interface ListInfo {
  id: string;
  name: string;
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
  const { markAsWatched } = useWatchHistory();
  const { isWatched, markAsWatched: markAsWatchedTitles } = useWatchedTitles();
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [isAddingToLists, setIsAddingToLists] = useState(false);
  const [isAddingToHistory, setIsAddingToHistory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

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

  // Modify toggleList to track both additions and removals
  const toggleList = (listId: string) => {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  };

  const handleAddToLists = async (video: Video) => {
    if (!user) return;
    
    setIsAddingToLists(true);
    setError(null);

    try {
      // First, try to get the existing entertainment entry
      let { data: existingEnt } = await supabase
        .from('entertainment')
        .select('id')
        .eq('tmdb_id', video.tmdbId)
        .eq('type', video.tmdbType)
        .single();

      let entertainmentId;

      if (!existingEnt) {
        // If it doesn't exist, create it
        const { data: newEnt, error: entertainmentError } = await supabase
          .from('entertainment')
          .insert({
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
        entertainmentId = newEnt.id;
      } else {
        entertainmentId = existingEnt.id;
      }

      // Get current list memberships
      const currentLists = new Set(video.lists?.map(list => list.id) || []);
      
      // Determine which lists to add and which to remove
      const listsToAdd = Array.from(selectedLists).filter(listId => !currentLists.has(listId));
      const listsToRemove = Array.from(currentLists).filter(listId => !selectedLists.has(listId));

      // Handle additions
      if (listsToAdd.length > 0) {
        const newMappings = listsToAdd.map(listId => ({
          list_id: listId,
          entertainment_id: entertainmentId
        }));

        const { error: addError } = await supabase
          .from('list_entertainment_map')
          .insert(newMappings);

        if (addError) throw addError;
      }

      // Handle removals
      if (listsToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('list_entertainment_map')
          .delete()
          .eq('entertainment_id', entertainmentId)
          .in('list_id', listsToRemove);

        if (removeError) throw removeError;
      }

      // Update the video's lists in the UI
      if (listsToAdd.length > 0 || listsToRemove.length > 0) {
        const { data: updatedLists } = await supabase
          .from('lists')
          .select('id, name')
          .in('id', Array.from(selectedLists));

        if (updatedLists) {
          // Update the video object with new list information
          video.lists = updatedLists.map(list => ({
            id: list.id,
            name: list.name
          }));
        }
      }

      // Reset and flip back
      setSelectedLists(new Set());
      setFlippedCardId(null);
    } catch (err) {
      console.error('Error updating lists:', err);
      setError('Failed to update lists. Please try again.');
    } finally {
      setIsAddingToLists(false);
    }
  };

  const handleRemoveFromList = async (video: Video, listId: string) => {
    if (!user || !video.tmdbId) return;

    try {
      // First get the entertainment entry
      const { data: entertainmentData, error: entertainmentError } = await supabase
        .from('entertainment')
        .select('id')
        .eq('tmdb_id', video.tmdbId)
        .single();

      if (entertainmentError) throw entertainmentError;

      // Remove the mapping
      const { error: deleteError } = await supabase
        .from('list_entertainment_map')
        .delete()
        .eq('entertainment_id', entertainmentData.id)
        .eq('list_id', listId);

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error('Error removing from list:', err);
    }
  };

  // When flipping the card, pre-select the lists that the title is already in
  const handleFlipCard = async (video: Video) => {
    setFlippedCardId(video.id);
    await fetchLists();
    
    // Pre-select current lists
    const currentLists = video.lists || [];
    setSelectedLists(new Set(currentLists.map(list => list.id)));
  };

  // Add this function to handle marking as watched
  const handleMarkAsWatched = async (video: Video) => {
    if (!video.tmdbId || !video.tmdbType) return;
    
    const success = await markAsWatchedTitles(
      video.tmdbId,
      video.tmdbType as 'movie' | 'tv',
      video.title
    );

    if (success) {
      // Update the UI if needed
      setVideos(prev => prev.map(v => 
        v.id === video.id ? { ...v, watched: true } : v
      ));
    }
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
        const isVideoWatched = isTmdb && isWatched(video.tmdbId, video.tmdbType as 'movie' | 'tv');
        const detailUrl = isTmdb
          ? `/tmdb/${video.tmdbType}/${video.tmdbId}`
          : undefined;

        const releaseDate = new Date(video.publishedAt);
        const today = new Date();
        const isUnreleased = releaseDate > today;
        const daysUntil = isUnreleased ? getDaysUntilRelease(video.publishedAt) : null;
        const releaseYear = new Date(video.publishedAt).getFullYear();

        return (
          <div
            key={video.id}
            ref={index === videos.length - 1 ? lastVideoElementRef : null}
            className="relative group"
            onMouseEnter={() => setHoveredVideoId(video.id)}
            onMouseLeave={() => setHoveredVideoId(null)}
          >
            {/* Add watched indicator */}
            {isVideoWatched && (
              <div className="absolute top-2 left-2 z-10 bg-green-500/80 text-white rounded-full p-1">
                <Check size={16} />
              </div>
            )}

            {/* Add mark as watched button */}
            {!isVideoWatched && isTmdb && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkAsWatched(video);
                }}
                className={`absolute top-2 left-2 p-2 rounded-full text-white 
                           transition-all duration-200 backdrop-blur-sm hover:scale-110 
                           transform z-10 bg-black/50 hover:bg-black/70
                           ${hoveredVideoId === video.id ? 'opacity-100' : 'opacity-0'}`}
                title="Mark as Watched"
              >
                <Clock size={16} />
              </button>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                transform: flippedCardId === video.id ? 'rotateY(180deg)' : 'rotateY(0)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s'
              }}
            >
              {/* Front of card */}
              <div
                className={`${flippedCardId === video.id ? 'invisible' : ''}`}
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* List add button (top right) */}
                {showListSelection && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlipCard(video);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full text-white 
                               transition-all duration-200 backdrop-blur-sm hover:scale-110 
                               transform z-10 bg-black/50 hover:bg-black/70
                               ${hoveredVideoId === video.id ? 'opacity-100' : 'opacity-0'}`}
                    title="Add to Lists"
                  >
                    <List size={20} />
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
                      {releaseYear}
                    </p>
                    {/* List names display */}
                    {video.lists && video.lists.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {video.lists.map(list => {
                          const isHistory = list.name.toLowerCase() === 'history';
                          return (
                            <span
                              key={list.id}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] gap-0.5 max-w-[100px] ${
                                isHistory
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              }`}
                              title={isHistory ? 'Watched' : list.name}
                            >
                              {isHistory && <Check className="w-3 h-3" />}
                              <span className="truncate">
                                {isHistory ? 'Watched' : list.name}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Back of card (Lists) */}
              <div
                className={`absolute inset-0 bg-white dark:bg-gray-800 rounded-lg p-4 flex flex-col ${
                  flippedCardId === video.id ? '' : 'invisible'
                }`}
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium">Edit Lists</h3>
                  <button
                    onClick={() => {
                      setFlippedCardId(null);
                      setSelectedLists(new Set());
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X size={16} />
                  </button>
                </div>

                {error && (
                  <div className="text-red-500 text-xs mb-2">{error}</div>
                )}

                <div className="flex-1 space-y-1 overflow-y-auto">
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
                  disabled={isAddingToLists}
                  className={`mt-3 w-full px-3 py-1.5 text-sm font-medium text-white rounded-lg
                    ${isAddingToLists
                      ? 'bg-red-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {isAddingToLists ? 'Updating...' : 'Update Lists'}
                </button>
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