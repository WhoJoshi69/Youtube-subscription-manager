import React, { useState } from 'react';
import { PlaylistFetcherProps } from '../types';
import { YoutubeIcon } from 'lucide-react';
import ChannelSearch from './ChannelSearch';
import Loader from './Loader';

const PlaylistFetcher: React.FC<PlaylistFetcherProps> = ({ 
  onFetchPlaylist, 
  isLoading,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'channel'>('channel');

  return (
    <div className="w-full">
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'channel'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
            }`}
            onClick={() => setActiveTab('channel')}
          >
            Search Channel
          </button>
          <button
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'url'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-red-600'
            }`}
            onClick={() => setActiveTab('url')}
          >
            Playlist URL
          </button>
        </div>

        {activeTab === 'channel' ? (
          <ChannelSearch
            onFetchPlaylist={onFetchPlaylist}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <URLInput
            onFetchPlaylist={onFetchPlaylist}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  );
};

// Separate URL input component
const URLInput: React.FC<PlaylistFetcherProps> = ({ 
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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/playlist?list=..."
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader size="sm" light />
              <span>Loading...</span>
            </>
          ) : (
            <span>Load Playlist</span>
          )}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
    </form>
  );
};

export default PlaylistFetcher;