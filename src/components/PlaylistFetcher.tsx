import React, { useState } from 'react';
import { PlaylistFetcherProps } from '../types';
import { Search, YoutubeIcon } from 'lucide-react';

const PlaylistFetcher: React.FC<PlaylistFetcherProps> = ({ 
  onFetchPlaylist, 
  isLoading,
  error
}) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFetchPlaylist(url);
  };

  return (
    <div className="w-full">
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-2 mb-4">
          <YoutubeIcon size={32} className="text-red-600" />
          <h1 className="text-2xl font-bold">YouTube Playlist Viewer</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-2xl">
          Enter a YouTube playlist URL to view all videos in a grid format. 
          You can select videos with the checkbox and remove them from the grid.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/playlist?list=UUsBjURrPoezykLs9EqgamOA"
              className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Fetch Playlist</span>
              </>
            )}
          </button>
        </div>
        {error && (
          <div className="mt-2 text-red-500 text-sm">{error}</div>
        )}
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Example: https://www.youtube.com/playlist?list=UUsBjURrPoezykLs9EqgamOA
        </div>
      </form>
    </div>
  );
};

export default PlaylistFetcher;