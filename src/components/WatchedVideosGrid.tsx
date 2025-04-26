import React from 'react';
import { VideoGridProps } from '../types';
import VideoCard from './VideoCard';
import { History } from 'lucide-react';

const WatchedVideosGrid: React.FC<VideoGridProps> = ({ 
  videos,
  onToggleSelect,
  onMarkAsWatched,
  isLoading
}) => {
  if (videos.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
        <History className="mx-auto text-gray-400 mb-4" size={32} />
        <p className="text-gray-600 dark:text-gray-400">No watched videos yet</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <History size={20} />
          Watched Videos ({videos.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onToggleSelect={onToggleSelect}
            showWatchedStatus={true}
          />
        ))}
      </div>
    </div>
  );
};

export default WatchedVideosGrid; 