import React from 'react';
import { Video } from '../types';
import { Star, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MovieGridProps {
  videos: Video[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  lastVideoElementRef?: (node: HTMLDivElement) => void;
}

// Helper function to calculate days until release
const getDaysUntilRelease = (releaseDate: string): string => {
  if (!releaseDate) return '?';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const release = new Date(releaseDate);
  release.setHours(0, 0, 0, 0);
  
  const diffTime = release.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays.toString();
};

const MovieGrid: React.FC<MovieGridProps> = ({ 
  videos, 
  isLoading, 
  isLoadingMore, 
  lastVideoElementRef 
}) => {
  const navigate = useNavigate();

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 w-3/4"></div>
    </div>
  );

  // Show loading skeletons only for initial load
  if (isLoading && videos.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...Array(12)].map((_, i) => (
          <LoadingSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {/* Render existing videos */}
      {videos.map((video, index) => {
        const isTmdb = video.tmdbId && video.tmdbType;
        const detailUrl = isTmdb
          ? `/tmdb/${video.tmdbType}/${video.tmdbId}`
          : undefined;

        const releaseDate = new Date(video.publishedAt);
        const today = new Date();
        const isUnreleased = releaseDate > today;
        const daysUntil = isUnreleased ? getDaysUntilRelease(video.publishedAt) : null;

        return (
          <div
            key={video.id}
            ref={index === videos.length - 1 ? lastVideoElementRef : undefined}
            className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            onClick={() => {
              if (detailUrl) navigate(detailUrl);
            }}
            style={{ cursor: isTmdb ? 'pointer' : 'default' }}
          >
            {/* Poster Image */}
            <div className="aspect-[2/3] relative">
              <img
                src={
                  video.thumbnail
                    ? video.thumbnail
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&background=444&color=fff&size=256`
                }
                alt={video.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onError={e => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(video.title)}&background=444&color=fff&size=256`;
                }}
              />
              
              {/* Days Until Release Overlay */}
              {isUnreleased && daysUntil && (
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-white text-sm font-medium flex items-center gap-1 shadow-lg">
                  <Clock size={14} />
                  <span>{daysUntil === '?' ? '?' : `${daysUntil}d`}</span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="text-white text-center p-4">
                  <p className="text-sm line-clamp-4">{video.description}</p>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium">{video.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="p-2">
              <h3 className="text-sm font-medium line-clamp-2" title={video.title}>
                {video.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(video.publishedAt).getFullYear()}
              </p>
            </div>
          </div>
        );
      })}

      {/* Show loading skeletons at the bottom when loading more */}
      {isLoadingMore && (
        <>
          {[...Array(6)].map((_, i) => (
            <LoadingSkeleton key={`loading-more-${i}`} />
          ))}
        </>
      )}
    </div>
  );
};

export default MovieGrid; 