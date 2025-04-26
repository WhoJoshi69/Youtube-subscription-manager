import React, { useState } from 'react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import VideoGrid from './VideoGrid';
import { Channel } from '../types';
import { Eye, EyeOff, Filter, RefreshCw, X } from 'lucide-react';

const Subscriptions: React.FC = () => {
  const {
    subscribedChannels,
    filteredChannels,
    videos,
    isLoading,
    error,
    unsubscribeFromChannel,
    toggleChannelFilter,
    refreshVideos,
    hideAllChannels,
    showAllChannels,
    toggleSelect,
    handleSelectAll,
    markAsWatched
  } = useSubscriptions();

  const [showFilters, setShowFilters] = useState(false);

  const handleVideoWatched = async (videoId: string) => {
    // Remove the watched video from the list
    await markAsWatched();
    // Optionally refresh the videos list
    refreshVideos();
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subscriptions</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Filter channels"
          >
            <Filter size={20} />
          </button>
          <button
            onClick={refreshVideos}
            disabled={isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh videos"
          >
            <RefreshCw 
              size={20} 
              className={isLoading ? 'animate-spin' : ''}
            />
          </button>
        </div>
      </div>

      {/* Channel Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filter Channels</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={showAllChannels}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Show all channels"
              >
                <Eye size={16} />
                <span>Show All</span>
              </button>
              <button
                onClick={hideAllChannels}
                className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                title="Hide all channels"
              >
                <EyeOff size={16} />
                <span>Hide All</span>
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {subscribedChannels.map(channel => (
              <ChannelFilterItem
                key={channel.id}
                channel={channel}
                isFiltered={filteredChannels.includes(channel.id)}
                onToggleFilter={() => toggleChannelFilter(channel.id)}
                onUnsubscribe={() => unsubscribeFromChannel(channel.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {/* Videos Grid */}
      {subscribedChannels.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            You haven't subscribed to any channels yet.
          </p>
        </div>
      ) : (
        <VideoGrid
          videos={videos}
          isLoading={isLoading}
          showChannelNames={true}
          onToggleSelect={toggleSelect}
          onSelectAll={handleSelectAll}
          onMarkAsWatched={handleVideoWatched}
        />
      )}
    </div>
  );
};

const ChannelFilterItem: React.FC<{
  channel: Channel;
  isFiltered: boolean;
  onToggleFilter: () => void;
  onUnsubscribe: () => void;
}> = ({ channel, isFiltered, onToggleFilter, onUnsubscribe }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
    <img
      src={channel.thumbnail}
      alt={channel.title}
      className="w-10 h-10 rounded-full"
    />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium truncate" title={channel.title}>
        {channel.title}
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleFilter}
        className={`p-1.5 rounded-lg transition-colors ${
          isFiltered
            ? 'bg-gray-200 dark:bg-gray-600'
            : 'hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        title={isFiltered ? 'Show channel' : 'Hide channel'}
      >
        {isFiltered ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
      <button
        onClick={onUnsubscribe}
        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
        title="Unsubscribe"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

export default Subscriptions; 