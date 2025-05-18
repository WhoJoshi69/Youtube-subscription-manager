import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Film, Tv, Filter, Plus, ListPlus } from 'lucide-react';
import { SearchInput } from './ui/SearchInput';
import MovieGrid from './MovieGrid';
import { Video } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ListsProps {
  apiKey: string;
}

interface List {
  id: string;
  name: string;
  description: string;
  created_at: string;
  is_default: boolean;
  is_public: boolean;
}

const Lists: React.FC<ListsProps> = ({ apiKey }) => {
  const [activeTab, setActiveTab] = useState<'movies' | 'tvshows'>('movies');
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  // Fetch user's lists
  useEffect(() => {
    const fetchLists = async () => {
      if (!user) {
        setLists([]);
        setSelectedList(null);
        return;
      }

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lists:', error);
        return;
      }

      setLists(data);
      if (data.length > 0 && !selectedList) {
        setSelectedList(data[0]);
      }
    };

    fetchLists();
  }, [user]);

  // Fetch list content when list or tab changes
  useEffect(() => {
    if (!selectedList) return;

    const fetchListContent = async () => {
      setIsLoading(true);
      setVideos([]); // Clear existing videos before fetching new ones
      
      // First, get all entertainment IDs in the current list
      const { data: listEntertainments, error: listError } = await supabase
        .from('list_entertainment_map')
        .select(`
          entertainment_id
        `)
        .eq('list_id', selectedList.id);

      if (listError) {
        console.error('Error fetching list content:', listError);
        setIsLoading(false);
        return;
      }

      if (!listEntertainments?.length) {
        setVideos([]);
        setIsLoading(false);
        return;
      }

      // Get all entertainment entries with their list memberships
      const { data, error } = await supabase
        .from('entertainment')
        .select(`
          id,
          tmdb_id,
          title,
          type,
          poster_path,
          release_date,
          overview,
          vote_average,
          list_entertainment_map!inner(
            list:lists(
              id,
              name
            )
          )
        `)
        .in('id', listEntertainments.map(le => le.entertainment_id))
        .eq('type', activeTab === 'movies' ? 'movie' : 'tv');

      if (error) {
        console.error('Error fetching entertainment content:', error);
        setIsLoading(false);
        return;
      }

      const convertedVideos: Video[] = data
        .map(item => ({
          id: `tmdb-${item.tmdb_id}`,
          tmdbId: item.tmdb_id,
          tmdbType: item.type,
          title: item.title,
          description: item.overview,
          thumbnail: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
          publishedAt: item.release_date,
          channelTitle: item.type === 'movie' ? 'Movies' : 'TV Shows',
          selected: false,
          watched: false,
          rating: item.vote_average,
          // Add list memberships directly to the video object
          lists: item.list_entertainment_map
            .map(mapping => mapping.list)
            .filter(Boolean)
            .map(list => ({
              id: list.id,
              name: list.name
            }))
        }));

      setVideos(convertedVideos);
      setIsLoading(false);
    };

    fetchListContent();
  }, [selectedList, activeTab]);

  const handleCreateList = async () => {
    setError(null); // Clear any previous errors
    
    if (!user) {
      setError('Please log in to create a list');
      return;
    }

    if (!newListName.trim()) {
      setError('Please enter a list name');
      return;
    }

    const { data, error: createError } = await supabase
      .from('lists')
      .insert([
        {
          name: newListName.trim(),
          description: newListDescription.trim(),
          is_default: false,
          is_public: false,
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (createError) {
      console.error('Error creating list:', createError);
      setError('Failed to create list. Please try again.');
      return;
    }

    setLists(prev => [data, ...prev]);
    setSelectedList(data);
    setShowNewListModal(false);
    setNewListName('');
    setNewListDescription('');
  };

  const handleNavigateToDetails = (type: string, id: string) => {
    navigate(`/tmdb/${type}/${id}`);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Lists</h2>
          <button
            onClick={() => setShowNewListModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <ListPlus size={16} />
            <span>New List</span>
          </button>
        </div>

        <div className="flex gap-2">
          <motion.button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative
              ${activeTab === 'movies'
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Film size={16} />
            <span className="hidden sm:inline">Movies</span>
            {activeTab === 'movies' && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-red-600 rounded-lg -z-10"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>

          <motion.button
            onClick={() => setActiveTab('tvshows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 relative
              ${activeTab === 'tvshows'
                ? 'text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Tv size={16} />
            <span className="hidden sm:inline">TV Shows</span>
            {activeTab === 'tvshows' && (
              <motion.div
                layoutId="activeTabBackground"
                className="absolute inset-0 bg-red-600 rounded-lg -z-10"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        </div>
      </div>

      {/* Lists Selection */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {lists.map(list => (
          <button
            key={list.id}
            onClick={() => setSelectedList(list)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
              ${selectedList?.id === list.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            {list.name}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 sm:flex-initial sm:w-96">
        <SearchInput
          placeholders={["Search in list..."]}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedList?.id}-${activeTab}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <MovieGrid 
            videos={videos.filter(video => 
              video.title.toLowerCase().includes(searchQuery.toLowerCase())
            )}
            isLoading={isLoading}
            lastVideoElementRef={() => {}}
            onVideoClick={(video) => {
              if (video.tmdbId && video.tmdbType) {
                handleNavigateToDetails(video.tmdbType, video.tmdbId.toString());
              }
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New List</h3>
            {error && (
              <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                  placeholder="Enter list name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newListDescription}
                  onChange={e => setNewListDescription(e.target.value)}
                  className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                  placeholder="Enter list description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewListModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateList}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white"
                >
                  Create List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists; 