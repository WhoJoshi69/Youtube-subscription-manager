import React, { useState } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { searchYouTubeChannel } from '../api/youtube';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useWatchHistory } from '../hooks/useWatchHistory';
import Loader from './Loader';
import { SearchInput } from './ui/SearchInput';

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
  const { subscribedChannels, subscribeToChannel, unsubscribeFromChannel } = useSubscriptions();
  const { markChannelAsWatched } = useWatchHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [markingWatched, setMarkingWatched] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>, value: string) => {
    if (!value.trim()) return;

    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSearchQuery(value);

    try {
      const results = await searchYouTubeChannel(value);
      setSearchResults(results);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Failed to search channels');
    } finally {
      setSearching(false);
    }
  };

  const handleChannelSelect = async (channelId: string) => {
    const uploadsPlaylistId = channelId.replace('UC', 'UU');
    const playlistUrl = `https://www.youtube.com/playlist?list=${uploadsPlaylistId}`;
    await onFetchPlaylist(playlistUrl);
    setSearchResults([]); // Clear results after selection
  };

  const handleMarkChannelWatched = async (channelId: string) => {
    setMarkingWatched(channelId);
    try {
      await markChannelAsWatched(channelId);
      setTimeout(() => {
        setMarkingWatched(null);
      }, 2000);
    } catch (error) {
      setSearchError('Failed to mark channel as watched');
      setMarkingWatched(null);
    }
  };

  const placeholders = [
    "Search for a YouTube channel...",
    "Enter channel name...",
    "Find your favorite creators...",
    "Discover new channels...",
    "Search by channel name..."
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <SearchInput
          placeholders={placeholders}
          onSubmit={handleSearch}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        />
        {searchError && (
          <div className="mt-4 text-red-500 text-sm text-center">{searchError}</div>
        )}
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Search Results:</h3>
          <div className="grid gap-4">
            {searchResults.map((channel) => {
              const isSubscribed = subscribedChannels.some(c => c.id === channel.id);
              const isMarking = markingWatched === channel.id;
              
              return (
                <div
                  key={channel.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
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
                  
                  <button
                    onClick={() => handleMarkChannelWatched(channel.id)}
                    disabled={isMarking}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isMarking 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                    }`}
                  >
                    {isMarking ? (
                      <>
                        <CheckCircle size={16} className="mr-2 inline" />
                        <span>Marked Watched</span>
                      </>
                    ) : (
                      'Mark Watched'
                    )}
                  </button>
                  <button
                    onClick={() => isSubscribed 
                      ? unsubscribeFromChannel(channel.id)
                      : subscribeToChannel(channel)
                    }
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isSubscribed
                        ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                  <button
                    onClick={() => handleChannelSelect(channel.id)}
                    disabled={isLoading}
                    className={`px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 ${
                      isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader size="sm" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      'View Videos'
                    )}
                  </button>
                </div>
              );
            })}
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