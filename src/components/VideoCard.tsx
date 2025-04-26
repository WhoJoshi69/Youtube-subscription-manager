import React, { useState } from 'react';
import { VideoCardProps } from '../types';
import { Calendar, CheckSquare, Square, PlayCircle, Eye, CheckCircle } from 'lucide-react';
import { formatPublishedDate } from '../utils/dateUtils';
import { formatViewCount } from '../utils/formatters';
import { useWatchHistory } from '../hooks/useWatchHistory';

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onToggleSelect,
  onMarkAsWatched,
  showWatchedStatus = false
}) => {
  const { markAsWatched } = useWatchHistory();
  const [isVanishing, setIsVanishing] = useState(false);

  const handleThumbnailClick = () => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMarkAsWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsVanishing(true);
      await markAsWatched(video);
      
      // Wait for animation to complete before notifying parent
      setTimeout(() => {
        onMarkAsWatched?.(video.id);
      }, 300); // Match this with animation duration
    } catch (error) {
      console.error('Failed to mark video as watched:', error);
      setIsVanishing(false);
    }
  };

  const formattedDate = formatPublishedDate(video.publishedAt);

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm 
                  transition-all duration-300 transform
                  ${isVanishing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Selection checkbox */}
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={video.selected}
            onChange={() => onToggleSelect(video.id)}
            className="w-4 h-4 rounded-md border-gray-300 text-red-600 
                       focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700"
          />
        </div>

        {/* Watch button overlay */}
        <button
          onClick={handleMarkAsWatched}
          className="absolute bottom-2 right-2 p-2 bg-black/50 hover:bg-black/70 
                     rounded-full text-white opacity-0 group-hover:opacity-100 
                     transition-all duration-200 backdrop-blur-sm hover:scale-110 
                     transform z-10"
          title="Mark as watched"
        >
          <Eye size={20} />
        </button>

        {/* Watched status indicator */}
        {showWatchedStatus && video.watched && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 
                          px-2 py-1 bg-green-500/80 text-white rounded-full 
                          text-sm backdrop-blur-sm z-20">
            <CheckCircle size={16} />
            <span>Watched</span>
          </div>
        )}

        {/* Vanishing effect overlay */}
        {isVanishing && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm
                          animate-vanish-puff z-30" />
        )}
      </div>

      {/* Video info */}
      <div className="p-4">
        <h3 className="text-sm font-medium line-clamp-2 mb-1 text-gray-900 dark:text-white">
          {video.title}
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {video.channelTitle}
        </p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {new Date(video.publishedAt).toLocaleDateString()}
          </span>
          {video.viewCount && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(video.viewCount)} views
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;