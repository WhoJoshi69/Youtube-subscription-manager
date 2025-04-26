import React from 'react';
import { VideoGridProps } from '../types';
import VideoCard from './VideoCard';
import { CheckCircle } from 'lucide-react';

const VideoGrid: React.FC<VideoGridProps> = ({ 
  videos, 
  onToggleSelect, 
  onMarkAsWatched,
  isLoading 
}) => {
  const selectedCount = videos.filter(video => video.selected).length;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-40 py-16">
        <div className="h-10 w-10 rounded-full border-4 border-t-transparent border-red-600 animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading playlist videos...</p>
      </div>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Unwatched Videos ({videos.length})
        </h2>
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