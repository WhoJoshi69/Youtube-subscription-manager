import React, { useState } from 'react';
import { Eye, CheckCircle, Trash2 } from 'lucide-react';
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
  onDelete: (videoId: string) => void;
}

const SpecialVideoCard: React.FC<SpecialVideoCardProps> = ({
  video,
  onToggleSelect,
  onMarkAsWatched,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isVanishing, setIsVanishing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleMarkAsWatched = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsVanishing(true);
    setTimeout(() => {
      onMarkAsWatched(video.id);
    }, 300);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsVanishing(true);
    setTimeout(() => {
      onDelete(video.id);
    }, 300);
  };

  if (isVanishing) {
    return null;
  }

  return (
    <div
      className={`relative group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm 
                  hover:shadow-lg transition-all duration-300
                  ${isVanishing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowDeleteConfirm(false);
      }}
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-video">
        <a 
          href={video.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-full"
          onClick={(e) => {
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

        {/* Action Buttons */}
        <div className={`absolute top-2 right-2 flex gap-2 transition-opacity duration-200 z-10
                        ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* Watch Button */}
          {!video.watched && (
            <button
              onClick={handleMarkAsWatched}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white 
                       transition-all duration-200 transform hover:scale-110"
              title="Mark as watched"
            >
              <Eye size={16} />
            </button>
          )}
          
          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={handleDelete}
              className="p-2 rounded-full bg-red-600/50 hover:bg-red-600/70 text-white 
                       transition-all duration-200 transform hover:scale-110"
              title="Delete video"
            >
              <Trash2 size={16} />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={confirmDelete}
                className="px-2 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs
                         transition-all duration-200"
              >
                Confirm
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-2 py-1 rounded-full bg-gray-600 hover:bg-gray-700 text-white text-xs
                         transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

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