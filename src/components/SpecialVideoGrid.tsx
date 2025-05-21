import React, { useState } from 'react';
import { Filter, CheckCircle, Square, CheckSquare } from 'lucide-react';
import SpecialVideoCard from './SpecialVideoCard';

interface SpecialVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  source_url: string;
  upload_date: string;
  watched: boolean;
  selected: boolean;
}

interface SpecialVideoGridProps {
  videos: SpecialVideo[];
  isLoading: boolean;
  onToggleSelect: (videoId: string) => void;
  onSelectAll: (videoIds: string[]) => void;
  onMarkAsWatched: (videoId: string) => void;
}

const SpecialVideoGrid: React.FC<SpecialVideoGridProps> = ({
  videos,
  isLoading,
  onToggleSelect,
  onSelectAll,
  onMarkAsWatched,
}) => {
  const [showWatched, setShowWatched] = useState(true);
  const [isAllSelected, setIsAllSelected] = useState(false);

  const filteredVideos = showWatched ? videos : videos.filter(v => !v.watched);
  const selectedCount = videos.filter(v => v.selected).length;

  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    onSelectAll(newSelectedState ? filteredVideos.map(v => v.id) : []);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No videos found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isAllSelected ? (
              <CheckSquare size={16} className="text-red-600" />
            ) : (
              <Square size={16} />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>

          <button
            onClick={() => setShowWatched(!showWatched)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Filter size={16} />
            {showWatched ? 'Hide Watched' : 'Show All'}
          </button>
        </div>

        {selectedCount > 0 && (
          <button
            onClick={() => {
              const selectedIds = videos.filter(v => v.selected).map(v => v.id);
              selectedIds.forEach(id => onMarkAsWatched(id));
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-green-600 hover:bg-green-700 text-white ml-auto"
          >
            <CheckCircle size={16} />
            Mark Selected as Watched ({selectedCount})
          </button>
        )}
      </div>

      {/* Updated Grid */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gridAutoRows: 'auto',
          gridAutoFlow: 'dense'
        }}
      >
        {filteredVideos.map((video) => (
          <div key={video.id} className="transition-all duration-300">
            <SpecialVideoCard
              video={video}
              onToggleSelect={onToggleSelect}
              onMarkAsWatched={onMarkAsWatched}
            />
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        Showing {filteredVideos.length} of {videos.length} videos
      </div>
    </div>
  );
};

export default SpecialVideoGrid; 