import React, { useState, useEffect, useRef } from 'react';
import { VideoCardProps } from '../types';
import { Calendar, CheckSquare, Square, PlayCircle, Eye, CheckCircle } from 'lucide-react';
import { formatPublishedDate } from '../utils/dateUtils';
import { formatViewCount } from '../utils/formatters';
import Loader from './Loader';

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isWatched = false,
  onToggleSelect,
  onMarkAsWatched,
  showWatchedStatus = false
}) => {
  const [isVanishing, setIsVanishing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading images 50px before they enter viewport
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      if (imageRef.current) {
        observer.unobserve(imageRef.current);
      }
    };
  }, []);

  const handleThumbnailClick = () => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    window.open(videoUrl, '_blank', 'noopener,noreferrer');
  };

  const handleMarkAsWatched = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsVanishing(true);
    setTimeout(() => {
      onMarkAsWatched?.(video.id);
    }, 300);
  };

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm 
                  transition-all duration-300 transform
                  ${isVanishing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail container */}
      <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
        <img
          ref={imageRef}
          src={shouldLoad ? video.thumbnail : ''}
          alt={video.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isImageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsImageLoaded(true)}
          loading="lazy"
        />
        
        {/* Loading placeholder */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader size="md" />
          </div>
        )}

        {/* Selection checkbox */}
        <div 
          className={`absolute top-2 left-2 z-10 transition-all duration-200
                      ${isHovered || video.selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSelect(video.id);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg 
                       transition-all duration-200 
                       ${video.selected 
                         ? 'bg-red-600 text-white' 
                         : 'bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm'}`}
          >
            {video.selected ? (
              <CheckSquare size={18} className="transform scale-110" />
            ) : (
              <Square size={18} />
            )}
          </button>
        </div>

        {/* Play button in center */}
        <button
          onClick={handleThumbnailClick}
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                     w-12 h-12 flex items-center justify-center rounded-full
                     bg-black/50 hover:bg-red-600 text-white
                     transition-all duration-200 backdrop-blur-sm
                     ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
                     z-10`}
          title="Play video"
        >
          <PlayCircle size={28} className="transform translate-x-[1px]" />
        </button>

        {/* Watch button overlay */}
        <button
          onClick={handleMarkAsWatched}
          className={`absolute bottom-2 right-2 p-2 rounded-full text-white 
                     transition-all duration-200 backdrop-blur-sm hover:scale-110 
                     transform z-10
                     ${isHovered ? 'opacity-100' : 'opacity-0'}
                     ${isWatched 
                       ? 'bg-green-600/50 hover:bg-green-600/70' 
                       : 'bg-black/50 hover:bg-black/70'}`}
          title={isWatched ? "Already watched" : "Mark as watched"}
        >
          {isWatched ? <CheckCircle size={20} /> : <Eye size={20} />}
        </button>

        {/* Watched status indicator */}
        {showWatchedStatus && isWatched && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 
                         px-2 py-1 bg-green-500/80 text-white rounded-full 
                         text-sm backdrop-blur-sm z-20">
            <CheckCircle size={16} />
            <span>Watched</span>
          </div>
        )}

        {isVanishing && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm
                         animate-vanish-puff z-30" />
        )}

        {/* Dark overlay on hover */}
        <div 
          className={`absolute inset-0 bg-black/20 transition-opacity duration-200
                      ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        />
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
            {formatPublishedDate(video.publishedAt)}
          </span>
          {video.viewCount && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {formatViewCount(video.viewCount)} views
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;