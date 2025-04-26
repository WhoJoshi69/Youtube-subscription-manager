import React from 'react';
import { VideoCardProps } from '../types';
import { Calendar, CheckSquare, Square, PlayCircle } from 'lucide-react';
import { formatPublishedDate } from '../utils/dateUtils';

const VideoCard: React.FC<VideoCardProps> = ({ video, onToggleSelect }) => {
  const handleThumbnailClick = () => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = formatPublishedDate(video.publishedAt);

  return (
    <div className={`relative group overflow-hidden rounded-lg transition-all duration-300 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg ${
      video.selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' : ''
    }`}>
      <div 
        className="relative aspect-video overflow-hidden cursor-pointer group"
        onClick={handleThumbnailClick}
      >
        {/* Thumbnail Image */}
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
          <PlayCircle size={48} className="text-white transform scale-90 group-hover:scale-100 transition-transform duration-300" />
        </div>

        {/* Selection Checkbox */}
        <div 
          className="absolute top-2 right-2 z-10 cursor-pointer rounded-md p-1 bg-black/60 hover:bg-black/80 transition-colors"
          onClick={(e) => {
            e.stopPropagation(); // Prevent thumbnail click when clicking checkbox
            onToggleSelect(video.id);
          }}
        >
          {video.selected ? 
            <CheckSquare size={24} className="text-blue-400" /> : 
            <Square size={24} className="text-white" />
          }
        </div>

        {/* Duration Badge - if we had duration info */}
        {/* <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
          {video.duration}
        </div> */}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 
          className="font-medium text-gray-900 dark:text-white line-clamp-2 h-12 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
          onClick={handleThumbnailClick}
        >
          {video.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors">
            {video.channelTitle}
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            <span title={video.publishedAt}>{formattedDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;