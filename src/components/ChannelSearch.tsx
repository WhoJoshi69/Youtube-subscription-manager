import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { searchYouTubeChannel } from '../api/youtube';

interface ChannelSearchProps {
  onFetchPlaylist: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ChannelSearch: React.FC<ChannelSearchProps> = ({ 
  onFetchPlaylist, 
  isLoading,
  error 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);

    try {
      const results = await searchYouTubeChannel(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to search channels');
    } finally {
      setSearching(false);
    }
  };

  const handleChannelSelect = async (channelId: string) => {
    // Get the uploads playlist ID (it's the channel ID with UC replaced by UU)
    const uploadsPlaylistId = channelId.replace('UC', 'UU');
    const playlistUrl = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;
    await onFetchPlaylist(playlistUrl);
    setSearchResults([]); // Clear results after selection
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a YouTube channel..."
              className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800"
              disabled={searching || isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={searching || isLoading || !searchQuery.trim()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? (
              <>
                <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>Search Channel</span>
              </>
            )}
          </button>
        </div>
      </form>

      {searchError && (
        <div className="mb-4 text-red-500 text-sm">{searchError}</div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold mb-3">Search Results:</h3>
          <div className="grid gap-4">
            {searchResults.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleChannelSelect(channel.id)}
              >
                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {channel.title}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {channel.subscriberCount} subscribers
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 text-red-500 text-sm">{error}</div>
      )}
    </div>
  );
};

export default ChannelSearch; 