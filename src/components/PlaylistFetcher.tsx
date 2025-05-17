import React, { useState } from 'react';
import { SearchInput } from './ui/SearchInput';
import { searchYouTubeChannel } from '../api/youtube';
import { CheckCircle } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useWatchHistory } from '../hooks/useWatchHistory';
import Loader from './Loader';

interface PlaylistFetcherProps {
  onFetchPlaylist: (url: string) => void;
  isLoading: boolean;
  error: string | null;
}

const PlaylistFetcher: React.FC<PlaylistFetcherProps> = ({
  onFetchPlaylist,
  isLoading,
  error
}) => {
  const { subscribedChannels, subscribeToChannel, unsubscribeFromChannel } = useSubscriptions();
  const { markChannelAsWatched } = useWatchHistory();
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
  }>>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [markingWatched, setMarkingWatched] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const placeholders = [
    "Enter a YouTube playlist URL or channel name...",
    "Search by channel name or paste playlist link...",
    "Enter channel name or playlist URL...",
    "Find videos by channel or playlist...",
    "Search channels or enter playlist URL..."
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>, value: string) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim();
    
    // Check if the input is a URL (contains http:// or https://)
    if (query.includes('http://') || query.includes('https://')) {
      // Clear any previous search results when handling a URL
      setSearchResults([]);
      setSearchError(null);
      // Handle as playlist URL
      onFetchPlaylist(query);
    } else {
      // Handle as channel search
      setSearching(true);
      setSearchError(null);
      try {
        const results = await searchYouTubeChannel(query);
        setSearchResults(results);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : 'Failed to search channels');
      } finally {
        setSearching(false);
      }
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

  return (
    <div className="mb-8">
      <div className="max-w-3xl mx-auto">
        <SearchInput
          placeholders={placeholders}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onSubmit={handleSubmit}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        />
        {searchError && (
          <div className="mt-4 text-red-500 text-sm text-center">
            {searchError}
          </div>
        )}

        {/* Channel Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Search Results:</h3>
            <div className="grid gap-4">
              {searchResults.map((channel) => {
                const isSubscribed = subscribedChannels.some(c => c.id === channel.id);
                const isMarking = markingWatched === channel.id;
                
                return (
                  <div
                    key={channel.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow"
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

        {error && !searchError && (
          <div className="mt-4 text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistFetcher;