import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Film, Tv, Filter, Plus, ListPlus, ArrowUpDown, Clock, SortAsc, Star, Calendar, Clock3, Shuffle } from 'lucide-react';
import { SearchInput } from './ui/SearchInput';
import MovieGrid from './MovieGrid';
import { Video } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Dropdown from './ui/Dropdown';
import Toggle from './ui/Toggle';
import AnimatedButton from './ui/AnimatedButton';
import { saveState, loadState, STORAGE_KEYS } from '../utils/stateStorage';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a' | 'rating';
type ReleaseStatus = 'released' | 'unreleased';

interface List {
  id: string;
  name: string;
  description: string | null;
}

const Lists: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const initialState = loadState(STORAGE_KEYS.LISTS) || {
    lists: [],
    activeList: null,
    searchQuery: '',
    sortBy: 'name'
  };

  const [lists, setLists] = useState(initialState.lists);
  const [activeList, setActiveList] = useState(initialState.activeList);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [sortBy, setSortBy] = useState(initialState.sortBy);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movies' | 'tvshows'>('movies');
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus>('released');
  const [randomPick, setRandomPick] = useState<Video | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(STORAGE_KEYS.LISTS, {
      lists,
      activeList,
      searchQuery,
      sortBy
    });
  }, [lists, activeList, searchQuery, sortBy]);

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

  // Fetch list content
  useEffect(() => {
    if (!selectedList) return;

    const fetchListContent = async () => {
      setIsLoading(true);
      
      try {
        // Get entertainment IDs for the selected list
        const { data: mappings, error: mappingsError } = await supabase
          .from('list_entertainment_map')
          .select('entertainment_id')
          .eq('list_id', selectedList.id);

        if (mappingsError) throw mappingsError;

        if (!mappings?.length) {
          setVideos([]);
          setIsLoading(false);
          return;
        }

        // Get entertainment details
        const { data: entertainmentData, error: entertainmentError } = await supabase
          .from('entertainment')
          .select(`
            id,
            tmdb_id,
            title,
            type,
            poster_path,
            release_date,
            overview,
            vote_average
          `)
          .in('id', mappings.map(m => m.entertainment_id))
          .eq('type', activeTab === 'movies' ? 'movie' : 'tv');

        if (entertainmentError) throw entertainmentError;

        // Get list memberships
        const { data: listMappings, error: listError } = await supabase
          .from('list_entertainment_map')
          .select(`
            entertainment_id,
            list:lists(id, name)
          `)
          .in('entertainment_id', mappings.map(m => m.entertainment_id));

        if (listError) throw listError;

        // Create a map of entertainment_id to lists
        const listsByEntertainmentId = new Map();
        listMappings?.forEach(mapping => {
          if (mapping.list) {
            if (!listsByEntertainmentId.has(mapping.entertainment_id)) {
              listsByEntertainmentId.set(mapping.entertainment_id, []);
            }
            listsByEntertainmentId.get(mapping.entertainment_id).push(mapping.list);
          }
        });

        // Convert to Video format
        const convertedVideos: Video[] = entertainmentData.map(item => ({
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
          lists: listsByEntertainmentId.get(item.id) || []
        }));

        setVideos(convertedVideos);
      } catch (error) {
        console.error('Error fetching list content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchListContent();
  }, [selectedList, activeTab]);

  const sortOptions = [
    {
      value: 'newest',
      label: 'Newest First',
      icon: <Clock size={16} className="text-gray-500" />
    },
    {
      value: 'oldest',
      label: 'Oldest First',
      icon: <Clock size={16} className="text-gray-500 transform rotate-180" />
    },
    {
      value: 'a-z',
      label: 'A to Z',
      icon: <SortAsc size={16} className="text-gray-500" />
    },
    {
      value: 'z-a',
      label: 'Z to A',
      icon: <SortAsc size={16} className="text-gray-500 transform rotate-180" />
    },
    {
      value: 'rating',
      label: 'Highest Rating',
      icon: <Star size={16} className="text-gray-500" />
    }
  ];

  const getSortedVideos = (videos: Video[]) => {
    const today = new Date();
    
    // Filter by search query and release status
    const filteredVideos = videos.filter(video => {
      const videoDate = new Date(video.publishedAt);
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = releaseStatus === 'released' 
        ? videoDate <= today 
        : videoDate > today;
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    return [...filteredVideos].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        case 'oldest':
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        default:
          return 0;
      }
    });
  };

  const handleCreateList = async () => {
    if (!user || !newListName.trim()) return;

    const { data, error } = await supabase
      .from('lists')
      .insert([
        {
          name: newListName.trim(),
          description: newListDescription.trim(),
          user_id: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating list:', error);
      return;
    }

    setLists(prev => [data, ...prev]);
    setSelectedList(data);
    setShowNewListModal(false);
    setNewListName('');
    setNewListDescription('');
  };

  const handleRandomPick = () => {
    const filteredVideos = getSortedVideos(videos);
    if (filteredVideos.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * filteredVideos.length);
    setRandomPick(filteredVideos[randomIndex]);

    // Add a nice animation by using setTimeout
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetRandomPick = () => {
    setRandomPick(null);
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
          >
            <Film size={16} />
            <span>Movies</span>
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
          >
            <Tv size={16} />
            <span>TV Shows</span>
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

      {/* Lists grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {lists.map(list => (
          <button
            key={list.id}
            onClick={() => setSelectedList(list)}
            className={`p-4 rounded-lg text-left transition-colors
              ${selectedList?.id === list.id
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <h3 className="font-medium truncate">{list.name}</h3>
            {list.description && (
              <p className="text-sm truncate opacity-75">{list.description}</p>
            )}
          </button>
        ))}
      </div>

      {selectedList && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-48">
                <Dropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as SortOption)}
                  icon={<ArrowUpDown size={16} className="text-gray-500" />}
                />
              </div>

              <SearchInput
                placeholders={["Search in list..."]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto"
              />
            </div>

            <div className="flex items-center gap-4">
              <Toggle
                options={['released', 'unreleased']}
                value={releaseStatus}
                onChange={(value) => setReleaseStatus(value as ReleaseStatus)}
                icons={[
                  <Calendar size={16} />,
                  <Clock3 size={16} />
                ]}
              />

              <AnimatedButton
                onClick={randomPick ? resetRandomPick : handleRandomPick}
                className={randomPick ? 'opacity-75 hover:opacity-100' : ''}
              >
                <Shuffle size={16} />
                <span className="text-sm">{randomPick ? 'Reset' : 'Random'}</span>
              </AnimatedButton>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedList.id}-${activeTab}-${releaseStatus}-${randomPick ? 'random' : 'all'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {randomPick ? (
                <div className="mt-8">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
                    className="max-w-2xl mx-auto"
                  >
                    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 text-center">
                      <h3 className="text-2xl font-bold text-white mb-6">🎲 Random Pick</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div className="aspect-[2/3] relative rounded-lg overflow-hidden">
                          <img
                            src={randomPick.thumbnail}
                            alt={randomPick.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-left">
                          <h4 className="text-xl font-bold text-white mb-2">{randomPick.title}</h4>
                          <p className="text-gray-300 text-sm mb-4">{randomPick.description}</p>
                          {randomPick.rating && (
                            <div className="flex items-center gap-1 mb-4">
                              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              <span className="text-white font-medium">{randomPick.rating.toFixed(1)}</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              if (randomPick.tmdbId && randomPick.tmdbType) {
                                navigate(`/tmdb/${randomPick.tmdbType}/${randomPick.tmdbId}`);
                              }
                            }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <MovieGrid 
                  videos={getSortedVideos(videos)}
                  isLoading={isLoading}
                  lastVideoElementRef={() => {}}
                  onVideoClick={(video) => {
                    if (video.tmdbId && video.tmdbType) {
                      navigate(`/tmdb/${video.tmdbType}/${video.tmdbId}`);
                    }
                  }}
                  showListSelection={true}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* New List Modal */}
      {showNewListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Create New List</h3>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="List name"
              className="w-full p-2 mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
            />
            <textarea
              value={newListDescription}
              onChange={(e) => setNewListDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full p-2 mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 h-24"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewListModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Lists; 