import React, { useState, useMemo } from 'react';
import { VideoGridProps } from '../types';
import VideoCard from './VideoCard';
import { 
  CheckCircle, 
  CheckSquare, 
  Square, 
  SortDesc, 
  Calendar, 
  TrendingUp, 
  Clock 
} from 'lucide-react';

type SortOption = 'newest' | 'oldest' | 'title' | 'views';

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  onToggleSelect, 
  onSelectAll,
  onMarkAsWatched,
  isLoading,
}) => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const selectedCount = videos.filter(video => video.selected).length;
  const hasVideos = videos.length > 0;

  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    const videoIds = videos.map(video => video.id);
    onSelectAll(newSelectedState ? videoIds : []);
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40 py-16">
        <div className="h-10 w-10 rounded-full border-4 border-t-transparent border-red-600 animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading videos...</p>
      </div>
    );
  }

  if (!hasVideos) {
    return null;
  }

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

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <SortButton
              isActive={sortBy === 'newest'}
              onClick={() => setSortBy('newest')}
              icon={<Clock size={16} />}
              label="Newest"
            />
            <SortButton
              isActive={sortBy === 'oldest'}
              onClick={() => setSortBy('oldest')}
              icon={<Calendar size={16} />}
              label="Oldest"
            />
            <SortButton
              isActive={sortBy === 'title'}
              onClick={() => setSortBy('title')}
              icon={<SortDesc size={16} />}
              label="Title"
            />
            <SortButton
              isActive={sortBy === 'views'}
              onClick={() => setSortBy('views')}
              icon={<TrendingUp size={16} />}
              label="Views"
            />
          </div>

          {selectedCount > 0 && (
            <button
              onClick={onMarkAsWatched}
              disabled={selectedCount === 0}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle size={16} />
              Mark as Watched ({selectedCount})
            </button>
          )}
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedVideos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>
    </div>
  );
};

// Sort Button Component
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
      transition-colors whitespace-nowrap
      ${isActive 
        ? 'bg-white dark:bg-gray-700 shadow-sm text-red-600' 
        : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
      }
    `}
    title={`Sort by ${label}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);

export default VideoGrid;