import React, { useState, useMemo } from 'react';
import { Video } from '../types';
import VideoGrid from './VideoGrid';
import { Filter, RefreshCw, Clock, Calendar, Search, X, SortDesc } from 'lucide-react';

interface HistoryProps {
  watchedVideos: Video[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onRemoveFromHistory: (ids: string[]) => void;
  isLoading: boolean;
}

type FilterTimeRange = 'all' | 'today' | 'week' | 'month';
type SortOrder = 'newest' | 'oldest';

const History: React.FC<HistoryProps> = ({
  watchedVideos,
  onToggleSelect,
  onSelectAll,
  onRemoveFromHistory,
  isLoading
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<FilterTimeRange>('all');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Get unique channels from watched videos
  const channels = useMemo(() => {
    const channelMap = new Map<string, { title: string; count: number }>();
    watchedVideos.forEach(video => {
      const current = channelMap.get(video.channelTitle) || { title: video.channelTitle, count: 0 };
      channelMap.set(video.channelTitle, { ...current, count: current.count + 1 });
    });
    return Array.from(channelMap.entries()).map(([title, data]) => ({
      title,
      count: data.count
    }));
  }, [watchedVideos]);

  // Filter videos based on current filters
  const filteredVideos = useMemo(() => {
    let filtered = [...watchedVideos];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(query) ||
        video.channelTitle.toLowerCase().includes(query)
      );
    }

    // Apply channel filter
    if (selectedChannels.length > 0) {
      filtered = filtered.filter(video =>
        selectedChannels.includes(video.channelTitle)
      );
    }

    // Apply time range filter
    const now = new Date();
    switch (timeRange) {
      case 'today':
        filtered = filtered.filter(video => {
          const videoDate = new Date(video.publishedAt);
          return videoDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(video => {
          const videoDate = new Date(video.publishedAt);
          return videoDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(video => {
          const videoDate = new Date(video.publishedAt);
          return videoDate >= monthAgo;
        });
        break;
    }

    // Apply sort order
    filtered.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [watchedVideos, searchQuery, selectedChannels, timeRange, sortOrder]);

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="text-gray-500" size={24} />
          <h2 className="text-2xl font-bold">Watch History</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters 
                ? 'bg-gray-200 dark:bg-gray-700' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Show filters"
          >
            <Filter size={20} />
          </button>
          <button
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Change sort order"
          >
            <SortDesc size={20} className={sortOrder === 'oldest' ? 'rotate-180' : ''} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Filters</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in history..."
              className="w-full px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Time Range Filter */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Time Range</h4>
            <div className="flex flex-wrap gap-2">
              {(['all', 'today', 'week', 'month'] as FilterTimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    timeRange === range
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Channel Filter */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Channels</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {channels.map(({ title, count }) => (
                <button
                  key={title}
                  onClick={() => setSelectedChannels(prev =>
                    prev.includes(title)
                      ? prev.filter(c => c !== title)
                      : [...prev, title]
                  )}
                  className={`px-3 py-2 rounded-lg text-sm text-left flex items-center justify-between ${
                    selectedChannels.includes(title)
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span className="truncate flex-1" title={title}>{title}</span>
                  <span className="ml-2 text-xs opacity-75">({count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {watchedVideos.length === 0 ? (
        <div className="text-center py-12">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Your watch history is empty
          </p>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredVideos.length} of {watchedVideos.length} videos
          </div>
          <VideoGrid
            videos={filteredVideos}
            onToggleSelect={onToggleSelect}
            onSelectAll={onSelectAll}
            onMarkAsWatched={() => {
              const selectedIds = filteredVideos.filter(v => v.selected).map(v => v.id);
              onRemoveFromHistory(selectedIds);
            }}
            isLoading={isLoading}
            showChannelNames={true}
          />
        </>
      )}
    </div>
  );
};

export default History; 