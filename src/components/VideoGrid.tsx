import React, { useState, useMemo, useCallback } from 'react';
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

type SortOption = 'newest' | 'oldest' | 'title' | 'views';

const VideoGrid: React.FC<VideoGridProps> = ({
  videos,
  onToggleSelect,
  onMarkAsWatched,
  isLoading,
  showChannelNames = false
}) => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const selectedCount = videos.filter(video => video.selected).length;
  const hasVideos = videos.length > 0;
  const { watchedVideos } = useWatchHistory();

  // Create a Set of watched video IDs for O(1) lookup
  const watchedVideoIds = new Set(watchedVideos.map(v => v.id));

  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    const videoIds = videos.map(video => video.id);
    onToggleSelect(newSelectedState ? videoIds : []);
  };

  const handleVideoWatched = useCallback((videoId: string) => {
    onToggleSelect([videoId]);
  }, [onToggleSelect]);

  // Sort videos based on selected option
  const sortedVideos = useMemo(() => {
    const videosCopy = [...videos];
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
  }, [videos, sortBy]);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setShowSortMenu(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
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
          <h2 className="text-xl font-semibold">
            {videos.length} {videos.length === 1 ? 'Video' : 'Videos'}
          </h2>
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
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
            <span>Sort by: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
          </button>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={onMarkAsWatched}
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

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedVideos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            isWatched={watchedVideoIds.has(video.id)}
            onToggleSelect={onToggleSelect}
            onMarkAsWatched={onMarkAsWatched}
          />
        ))}
      </div>
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