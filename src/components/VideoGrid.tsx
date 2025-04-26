import React, { useState } from 'react';
import { VideoGridProps } from '../types';
import VideoCard from './VideoCard';
import { CheckCircle, CheckSquare, Square } from 'lucide-react';

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  onToggleSelect, 
  onSelectAll,
  onMarkAsWatched,
  isLoading 
}) => {
  const [isAllSelected, setIsAllSelected] = useState(false);
  const selectedCount = videos.filter(video => video.selected).length;
  const hasVideos = videos.length > 0;

  const handleSelectAll = () => {
    const newSelectedState = !isAllSelected;
    setIsAllSelected(newSelectedState);
    const videoIds = videos.map(video => video.id);
    onSelectAll(newSelectedState ? videoIds : []);
  };

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
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCount} selected
            </span>
          )}
          <button
            onClick={onMarkAsWatched}
            disabled={selectedCount === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
              selectedCount > 0 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
            }`}
          >
            <CheckCircle size={16} />
            Mark as Watched {selectedCount > 0 && `(${selectedCount})`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map(video => (
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

export default VideoGrid;