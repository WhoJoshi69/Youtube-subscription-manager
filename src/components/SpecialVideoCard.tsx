import React, { useState } from 'react';
import { Eye, CheckCircle } from 'lucide-react';
import { formatPublishedDate } from '../utils/dateUtils';

interface SpecialVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  source_url: string;
  upload_date: string;
  watched: boolean;
  selected: boolean;
}

interface SpecialVideoCardProps {
  video: SpecialVideo;
  onToggleSelect: (videoId: string) => void;
  onMarkAsWatched: (videoId: string) => void;
}

const SpecialVideoCard: React.FC<SpecialVideoCardProps> = ({
  video,
  onToggleSelect,
  onMarkAsWatched,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVanishing, setIsVanishing] = useState(false);

  const handleMarkAsWatched = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsVanishing(true);
    setTimeout(() => {
      onMarkAsWatched(video.id);
    }, 500); // Match this with the animation duration
  };

  if (isVanishing) {
    return (
      <div className="animate-vanish col-span-1 aspect-video" />
    );
  }

  return (
    <div
      className={`relative group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm 
                  hover:shadow-lg transition-all duration-300 transform
                  ${isVanishing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video">
        {/* Make the video link a separate clickable area */}
        <a 
          href={video.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={(e) => {
            // Prevent click if we're clicking the watch button
            if ((e.target as HTMLElement).closest('button')) {
              e.preventDefault();
            }
          }}
        >
          <img
            src={video.thumbnail_url || ''}
            alt={video.title}
            className="w-full h-full object-cover"
          />
        </a>
        
        {/* Watched Badge */}
        {video.watched && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
            <CheckCircle size={12} />
            <span>Watched</span>
          </div>
        )}

        {/* Watch Button - Now a separate clickable area */}
        {!video.watched && (
          <button
            onClick={handleMarkAsWatched}
            className={`absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white 
                       transition-all duration-200 transform hover:scale-110 z-10
                       ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            <Eye size={16} />
          </button>
        )}

        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/30 transition-opacity duration-200 pointer-events-none
                        ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{formatPublishedDate(video.upload_date)}</span>
          <input
            type="checkbox"
            checked={video.selected}
            onChange={() => onToggleSelect(video.id)}
            className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SpecialVideoCard; 