import React from 'react';
import { VideoCardProps } from '../types';
import { Calendar, CheckSquare, Square } from 'lucide-react';

const VideoCard: React.FC<VideoCardProps> = ({ video, onToggleSelect }) => {
  return (
    <div className={`relative group overflow-hidden rounded-lg transition-all duration-300 bg-white dark:bg-gray-800 shadow-md hover:shadow-lg ${
      video.selected ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' : ''
    }`}>
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div 
          className="absolute top-2 right-2 z-10 cursor-pointer rounded-md p-1 bg-black/60 hover:bg-black/80 transition-colors"
          onClick={() => onToggleSelect(video.id)}
        >
          {video.selected ? 
            <CheckSquare size={24} className="text-blue-400" /> : 
            <Square size={24} className="text-white" />
          }
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 h-12">
          {video.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {video.channelTitle}
          </p>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Calendar size={14} className="mr-1" />
            {video.publishedAt}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;