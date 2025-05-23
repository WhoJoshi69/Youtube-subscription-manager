import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { VideoGridProps } from '../types';
import VideoCard from './VideoCard';
import { 
  CheckCircle, 
  CheckSquare, 
  Square, 
  SortDesc, 
  Calendar, 
  TrendingUp, 
  Clock,
  Filter,
  X
} from 'lucide-react';
import { useWatchHistory } from '../hooks/useWatchHistory';
import Loader from './Loader';
import { VideoSearch } from './VideoSearch';

type SortOption = 'newest' | 'oldest' | 'title' | 'views';

const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onToggleSelect,
  onSelectAll,
  onMarkAsWatched,
  isLoading,
  isLoadingMore,
  hasMoreVideos,
  onLoadMore,
  showChannelNames = false
}) => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const { watchedVideos } = useWatchHistory();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create a Set of watched video IDs for O(1) lookup
  const watchedVideoIds = new Set(watchedVideos.map(v => v.id));

  // Filter out watched videos
  const unwatchedVideos = useMemo(() => {
    return videos.filter(video => !watchedVideoIds.has(video.id));
  }, [videos, watchedVideoIds]);

  const selectedCount = unwatchedVideos.filter(video => video.selected).length;
  const hasVideos = unwatchedVideos.length > 0;

  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    // If deselecting, pass empty array to clear all selections
    onSelectAll(newSelectedState ? unwatchedVideos.map(video => video.id) : []);
  };

  const handleToggleSelect = (videoId: string) => {
    onToggleSelect([videoId]);
  };

  // Sort videos based on selected option
  const sortedVideos = useMemo(() => {
    const videosCopy = [...unwatchedVideos];
    switch (sortBy) {
      case 'newest':
        return videosCopy.sort((a, b) => 
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      case 'oldest':
        return videosCopy.sort((a, b) => 
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        );
      case 'title':
        return videosCopy.sort((a, b) => 
          a.title.localeCompare(b.title)
        );
      case 'views':
        return videosCopy.sort((a, b) => 
          (b.viewCount || 0) - (a.viewCount || 0)
        );
      default:
        return videosCopy;
    }
  }, [unwatchedVideos, sortBy]);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortMenu(false);
  };

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && !isLoading && !isLoadingMore && hasMoreVideos) {
      onLoadMore?.();
    }
  }, [isLoading, isLoadingMore, hasMoreVideos, onLoadMore]);

  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    };

    observerRef.current = new IntersectionObserver(handleObserver, options);

    if (loadMoreTriggerRef.current) {
      observerRef.current.observe(loadMoreTriggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleObserver]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    
    const query = searchQuery.toLowerCase();
    return videos.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  if (!hasVideos) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No videos found</p>
      </div>
    );
  }

  const sortOptions = [
    { value: 'newest', label: 'Newest', icon: <Clock size={20} /> },
    { value: 'oldest', label: 'Oldest', icon: <Calendar size={20} /> },
    { value: 'title', label: 'Title', icon: <SortDesc size={20} /> },
    { value: 'views', label: 'Most viewed', icon: <TrendingUp size={20} /> },
  ] as const;

  return (
    <div className="w-full space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {unwatchedVideos.length} {unwatchedVideos.length === 1 ? 'Video' : 'Videos'}
          </h2>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-red-600" />
            ) : (
              <Square size={16} />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {/* Sort Controls - Desktop */}
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {sortOptions.map(option => (
            <SortButton
              key={option.value}
              isActive={sortBy === option.value}
              onClick={() => setSortBy(option.value)}
              icon={option.icon}
              label={option.label}
            />
          ))}
        </div>

        {/* Sort Controls - Mobile */}
        <div className="sm:hidden flex items-center gap-2">
          <button
            onClick={() => setShowSortMenu(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Filter size={16} />
            <span className="text-gray-700 dark:text-gray-300">Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
          </button>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={() => {
              // Get the currently visible and selected videos
              const selectedIds = sortedVideos
                .filter(video => {
                  if (!searchQuery.trim()) return true;
                  const query = searchQuery.toLowerCase();
                  return (
                    video.title.toLowerCase().includes(query) ||
                    video.description?.toLowerCase().includes(query)
                  );
                })
                .filter(video => video.selected)
                .map(video => video.id);
              onMarkAsWatched(selectedIds);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg flex items-center justify-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle size={16} />
            Mark as Watched ({selectedCount})
          </button>
        )}
      </div>

      {/* Mobile Sort Menu */}
      {showSortMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 sm:hidden" onClick={() => setShowSortMenu(false)}>
          <div 
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-xl p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Sort Videos</h3>
              <button
                onClick={() => setShowSortMenu(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {sortOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg text-left
                    ${sortBy === option.value
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {option.icon}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {videos.length > 0 && (
        <VideoSearch onSearch={setSearchQuery} />
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all duration-300">
        {sortedVideos
          .filter(video => {
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            return (
              video.title.toLowerCase().includes(query) ||
              video.description?.toLowerCase().includes(query)
            );
          })
          .map(video => (
            <VideoCard
              key={video.id}
              video={video}
              onToggleSelect={handleToggleSelect}
              onMarkAsWatched={onMarkAsWatched}
              showChannelNames={showChannelNames}
            />
          ))}
      </div>

      {/* Loading trigger element */}
      <div ref={loadMoreTriggerRef} className="h-10 w-full">
        {isLoadingMore && (
          <div className="flex justify-center items-center py-4">
            <Loader size="md" />
          </div>
        )}
      </div>

      {/* No more videos message */}
      {!hasMoreVideos && unwatchedVideos.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more videos to load
        </div>
      )}
    </div>
  );
};

// Sort Button Component (Desktop)
interface SortButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const SortButton: React.FC<SortButtonProps> = ({
  isActive,
  onClick,
  icon,
  label
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-3 py-1.5 rounded-md text-sm
      transition-colors
      ${isActive 
        ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600' 
        : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
      }
    `}
    title={`Sort by ${label}`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default VideoGrid;