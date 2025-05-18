import React, { useState, useEffect, useRef, useCallback } from 'react';
import MovieGrid from './MovieGrid';
import { Video } from '../types';
import { Film, Tv, Filter, SortDesc, Calendar, Star, Search, X, Clock } from 'lucide-react';
import { SearchInput } from './ui/SearchInput';
import { useLocation, useNavigate } from 'react-router-dom';

interface FilterState {
  sortBy: string;
  year?: number;
  voteAverage?: number;
  withGenres?: string[];
  releaseDateGte?: string;
  releaseDateLte?: string;
  voteCountGte?: number;
  language?: string;
  region?: string;
  releaseStatus: 'all' | 'released' | 'unreleased';
}

interface Genre {
  id: number;
  name: string;
}

interface TrendingProps {
  apiKey: string;
}

interface TMDBVideo {
  id: number;
  title: string;
  name: string;
  overview: string;
  poster_path: string;
  release_date: string;
  first_air_date: string;
  vote_average: number;
}

const Trending: React.FC<TrendingProps> = ({ apiKey }) => {
  const [activeTab, setActiveTab] = useState<'movies' | 'tvshows'>('movies');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'popularity.desc',
    releaseStatus: 'all'
  });
  const [genres, setGenres] = useState<Genre[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [personQuery, setPersonQuery] = useState('');
  const [personSuggestions, setPersonSuggestions] = useState<any[]>([]);
  const [personFilter, setPersonFilter] = useState<{id: number, name: string} | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<{id: number, name: string} | null>(null);
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(-1);
  
  // Reference to track the current active tab for cleanup
  const currentTab = useRef(activeTab);
  const location = useLocation();
  const navigate = useNavigate();

  // Add state to store the scroll position
  const [scrollPosition, setScrollPosition] = useState(0);

  // Add effect to restore scroll position when returning
  useEffect(() => {
    // Check if we're returning from details page
    const isReturning = location.state?.from === 'details';
    if (isReturning && location.state?.previousScroll) {
      window.scrollTo(0, location.state.previousScroll);
    }
  }, [location]);

  const fetchGenres = async (type: 'movie' | 'tv') => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/genre/${type}/list?api_key=${apiKey}`
      );
      if (!response.ok) throw new Error('Failed to fetch genres');
      const data = await response.json();
      setGenres(data.genres);
    } catch (err) {
      console.error('Error fetching genres:', err);
    }
  };

  const fetchContent = async (type: 'movie' | 'tv', pageNum: number, isLoadingMore = false) => {
    if (isLoadingMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Determine if any filter is active
      const isFiltering = !!(
        filters.sortBy !== 'popularity.desc' ||
        filters.year ||
        filters.voteAverage ||
        (filters.withGenres && filters.withGenres.length > 0) ||
        personFilter ||
        filters.releaseStatus !== 'all'
      );

      // Build the base URL based on whether we're searching or getting trending
      const baseUrl = searchQuery
        ? `https://api.themoviedb.org/3/search/${type}`
        : isFiltering
          ? `https://api.themoviedb.org/3/discover/${type}`
          : `https://api.themoviedb.org/3/trending/${type}/day`;

      // Build query parameters
      const queryParams = new URLSearchParams({
        api_key: apiKey,
        page: pageNum.toString(),
      });

      // Add search query if searching
      if (searchQuery) {
        queryParams.append('query', searchQuery);
      }

      // Only add filter params if using discover
      if (baseUrl.includes('/discover/')) {
        if (filters.sortBy) queryParams.append('sort_by', filters.sortBy);
        if (filters.voteAverage) queryParams.append('vote_average.gte', filters.voteAverage.toString());
        if (filters.withGenres?.length) queryParams.append('with_genres', filters.withGenres.join(','));
        if (filters.year) {
          if (type === 'movie') {
            queryParams.append('primary_release_year', filters.year.toString());
          } else if (type === 'tv') {
            queryParams.append('first_air_date_year', filters.year.toString());
          }
        }
        if (selectedPerson) {
          queryParams.append('with_people', selectedPerson.id.toString());
        }
        if (personFilter) {
          queryParams.append('with_people', personFilter.id.toString());
        }
        // Add release status filtering
        const today = new Date().toISOString().split('T')[0];
        if (filters.releaseStatus === 'released') {
          if (type === 'movie') {
            queryParams.append('primary_release_date.lte', today);
          } else {
            queryParams.append('first_air_date.lte', today);
          }
        } else if (filters.releaseStatus === 'unreleased') {
          if (type === 'movie') {
            queryParams.append('primary_release_date.gte', today);
          } else {
            queryParams.append('first_air_date.gte', today);
          }
        }
        // ...add other filters as needed
      }

      const response = await fetch(
        `${baseUrl}?${queryParams.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch content');
      }
      const data = await response.json();
      
      // Convert TMDB format to our Video format
      const convertedVideos: Video[] = data.results.map((item: TMDBVideo) => ({
        id: `tmdb-${item.id}`,
        tmdbId: item.id,
        tmdbType: type,
        title: item.title || item.name,
        description: item.overview,
        thumbnail: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        publishedAt: item.release_date || item.first_air_date,
        channelTitle: type === 'movie' ? 'Movies' : 'TV Shows',
        selected: false,
        watched: false,
        rating: item.vote_average
      }));

      // Update hasMore based on TMDB's total_pages
      setHasMore(pageNum < data.total_pages);

      // If loading more, append to existing videos
      // If new search (page 1), replace existing videos
      setVideos(prev => 
        isLoadingMore ? [...prev, ...convertedVideos] : convertedVideos
      );

      if (personFilter && activeTab === 'tvshows') {
        setIsLoading(true);
        fetch(`https://api.themoviedb.org/3/person/${personFilter.id}/tv_credits?api_key=${apiKey}`)
          .then(res => res.json())
          .then(data => {
            // Merge cast and crew, remove duplicates by show ID
            const allShows = [...(data.cast || []), ...(data.crew || [])];
            const uniqueShows = Array.from(new Map(allShows.map(show => [show.id, show])).values());
            setVideos(uniqueShows.map(show => ({
              id: `tmdb-${show.id}`,
              tmdbId: show.id,
              tmdbType: 'tv',
              title: show.name,
              description: show.overview,
              thumbnail: show.poster_path ? `https://image.tmdb.org/t/p/w500${show.poster_path}` : '',
              publishedAt: show.first_air_date,
              channelTitle: 'TV Shows',
              selected: false,
              watched: false,
              rating: show.vote_average
            })));
            setHasMore(false); // No pagination for this endpoint
          })
          .finally(() => setIsLoading(false));
        return; // Don't run the normal discover/tv fetch
      }
    } catch (err) {
      setError('Failed to fetch content');
      console.error('Error fetching content:', err);
    } finally {
      if (isLoadingMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Intersection Observer callback
  const observer = useRef<IntersectionObserver | null>(null);
  const lastVideoElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading || isLoadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore]);

  // Effect for tab changes
  useEffect(() => {
    currentTab.current = activeTab;
    setPage(1);
    setVideos([]);
    setHasMore(true);
    fetchGenres(activeTab === 'movies' ? 'movie' : 'tv');
    fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
  }, [activeTab, apiKey]);

  // Effect for search query changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        setIsSearching(true);
        setPage(1);
        setVideos([]);
        setHasMore(true);
        fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
      } else {
        setIsSearching(false);
        setPage(1);
        setVideos([]);
        setHasMore(true);
        fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
      }
    }, 500); // Debounce search for 500ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, activeTab]);

  // Add this new effect to handle page changes
  useEffect(() => {
    if (page > 1) {
      fetchContent(activeTab === 'movies' ? 'movie' : 'tv', page, true);
    }
  }, [page]); // This effect will run whenever page changes

  useEffect(() => {
    if (personQuery.length < 2) {
      setPersonSuggestions([]);
      return;
    }
    fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(personQuery)}`)
      .then(res => res.json())
      .then(data => setPersonSuggestions(data.results || []));
  }, [personQuery, apiKey]);

  useEffect(() => {
    setPage(1);
    setVideos([]);
    setHasMore(true);
    fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
  }, [selectedPerson]);

  useEffect(() => {
    if (location.state && location.state.personFilter) {
      setPersonFilter(location.state.personFilter);
      // Optionally, clear the state so it doesn't persist on next navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    setHighlightedSuggestion(-1);
  }, [personSuggestions]);

  const placeholders = [
    "Search movies & TV shows...",
    "Find your next favorite...",
    "Discover trending content...",
    "Search by title...",
    "Find movies and shows..."
  ];

  // Add a reset filters function
  const resetFilters = () => {
    setFilters({
      sortBy: 'popularity.desc',
      releaseStatus: 'all'
    });
    // Reset person filter if it exists
    if (personFilter) {
      setPersonFilter(null);
      setPersonQuery('');
    }
    // Fetch content with reset filters
    setPage(1);
    setVideos([]);
    setHasMore(true);
    fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
  };

  // Add function to handle filter application
  const applyFilters = () => {
    setPage(1);
    setVideos([]);
    setHasMore(true);
    fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
  };

  // Add keyboard event handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  // Modify the navigation to details
  const handleNavigateToDetails = (type: string, id: string) => {
    // Save current scroll position and filters state
    const currentScroll = window.scrollY;
    navigate(`/tmdb/${type}/${id}`, {
      state: {
        from: 'trending',
        previousScroll: currentScroll,
        filters,
        activeTab,
        searchQuery,
        personFilter
      }
    });
  };

  // Add effect to restore state when returning
  useEffect(() => {
    const savedState = location.state;
    if (savedState?.from === 'details') {
      // Restore previous state
      if (savedState.filters) setFilters(savedState.filters);
      if (savedState.activeTab) setActiveTab(savedState.activeTab);
      if (savedState.searchQuery) setSearchQuery(savedState.searchQuery);
      if (savedState.personFilter) setPersonFilter(savedState.personFilter);
      
      // Refetch content with restored state
      setPage(1);
      setVideos([]);
      setHasMore(true);
      fetchContent(savedState.activeTab === 'movies' ? 'movie' : 'tv', 1);
    }
  }, [location.state]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">
          {isSearching ? 'Search Results' : 'Trending'}
        </h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Increase the width of the search container */}
          <div className="relative flex-1 sm:flex-initial sm:w-96">
            <SearchInput
              placeholders={placeholders}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onSubmit={(e, value) => setSearchQuery(value)}
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${showFilters
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Filter size={16} />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Movies/TV Shows Toggle */}
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${activeTab === 'movies'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Film size={16} />
            <span className="hidden sm:inline">Movies</span>
          </button>
          <button
            onClick={() => setActiveTab('tvshows')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2
              ${activeTab === 'tvshows'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Tv size={16} />
            <span className="hidden sm:inline">TV Shows</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
          {/* Release Status Toggle - Add this section first */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Clock size={16} />
              Release Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilters(prev => ({ ...prev, releaseStatus: 'all' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filters.releaseStatus === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, releaseStatus: 'released' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filters.releaseStatus === 'released'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                Released
              </button>
              <button
                onClick={() => setFilters(prev => ({ ...prev, releaseStatus: 'unreleased' }))}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filters.releaseStatus === 'unreleased'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                Coming Soon
              </button>
            </div>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
              className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            >
              <option value="popularity.desc">Popularity Descending</option>
              <option value="popularity.asc">Popularity Ascending</option>
              <option value="vote_average.desc">Rating Descending</option>
              <option value="vote_average.asc">Rating Ascending</option>
              <option value="release_date.desc">Release Date Descending</option>
              <option value="release_date.asc">Release Date Ascending</option>
              <option value="revenue.desc">Revenue Descending</option>
              <option value="revenue.asc">Revenue Ascending</option>
            </select>
          </div>

          {/* Year Filter - Updated with keyboard handler */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Year</label>
            <input
              type="number"
              value={filters.year || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
              onKeyDown={handleKeyDown}
              placeholder="Enter year"
              className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            />
          </div>

          {/* Minimum Rating - Updated with keyboard handler */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Rating</label>
            <input
              type="number"
              min="0"
              max="10"
              step="0.5"
              value={filters.voteAverage || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, voteAverage: parseFloat(e.target.value) || undefined }))}
              onKeyDown={handleKeyDown}
              placeholder="Enter minimum rating"
              className="w-full p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
            />
          </div>

          {/* Genres */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Genres</label>
            <div className="flex flex-wrap gap-2">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => {
                    setFilters(prev => {
                      const currentGenres = prev.withGenres || [];
                      const genreId = genre.id.toString();
                      return {
                        ...prev,
                        withGenres: currentGenres.includes(genreId)
                          ? currentGenres.filter(id => id !== genreId)
                          : [...currentGenres, genreId]
                      };
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.withGenres?.includes(genre.id.toString())
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Person Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Actor or Director</label>
            <div className="relative">
              <SearchInput
                placeholders={["Search actor or director..."]}
                value={personFilter ? personFilter.name : personQuery}
                onChange={e => {
                  setPersonFilter(null);
                  setPersonQuery(e.target.value);
                  setHighlightedSuggestion(-1);
                }}
                onKeyDown={e => {
                  if (personSuggestions.length === 0) return;
                  if (e.key === "ArrowDown") {
                    setHighlightedSuggestion(prev =>
                      prev < personSuggestions.length - 1 ? prev + 1 : 0
                    );
                    e.preventDefault();
                  } else if (e.key === "ArrowUp") {
                    setHighlightedSuggestion(prev =>
                      prev > 0 ? prev - 1 : personSuggestions.length - 1
                    );
                    e.preventDefault();
                  } else if (e.key === "Enter" && highlightedSuggestion >= 0) {
                    const person = personSuggestions[highlightedSuggestion];
                    setPersonFilter({ id: person.id, name: person.name });
                    setPersonQuery(person.name);
                    setPersonSuggestions([]);
                    setHighlightedSuggestion(-1);
                    e.preventDefault();
                  }
                }}
                onSubmit={(_, value) => {
                  setPersonQuery(value);
                  setPage(1);
                  setVideos([]);
                  setHasMore(true);
                  fetchContent(activeTab === 'movies' ? 'movie' : 'tv', 1);
                }}
                className="w-full"
              />
              {personSuggestions.length > 0 && !personFilter && (
                <div className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded w-full max-h-60 overflow-y-auto">
                  {personSuggestions.map((person, idx) => (
                    <div
                      key={person.id}
                      className={`py-3 px-2 min-h-[56px] hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 ${
                        idx === highlightedSuggestion ? "bg-gray-200 dark:bg-gray-600" : ""
                      }`}
                      onClick={() => {
                        setPersonFilter({ id: person.id, name: person.name });
                        setPersonQuery(person.name);
                        setPersonSuggestions([]);
                        setHighlightedSuggestion(-1);
                      }}
                    >
                      <img
                        src={person.profile_path ? `https://image.tmdb.org/t/p/w45${person.profile_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=444&color=fff&size=56`}
                        alt={person.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <span className="truncate">{person.name}</span>
                    </div>
                  ))}
                </div>
              )}
              {personFilter && (
                <button
                  className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                  onClick={() => setPersonFilter(null)}
                  title="Clear person filter"
                >×</button>
              )}
            </div>
          </div>

          {/* Buttons container */}
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Reset Filters
            </button>
            <button
              onClick={applyFilters}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <MovieGrid 
        videos={videos} 
        isLoading={isLoading}
        isLoadingMore={isLoadingMore}
        lastVideoElementRef={lastVideoElementRef}
        onVideoClick={(video) => {
          if (video.tmdbId && video.tmdbType) {
            handleNavigateToDetails(video.tmdbType, video.tmdbId.toString());
          }
        }}
      />
    </div>
  );
};

export default Trending; 