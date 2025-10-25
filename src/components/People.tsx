import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchInput } from './ui/SearchInput';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { saveState, loadState, STORAGE_KEYS } from '../utils/stateStorage';
import { useFavorites } from '../hooks/useFavorites';

interface Person {
  id: number;
  name: string;
  profile_path: string | null;
  known_for: { title?: string; name?: string }[];
}

interface PeopleProps {
  apiKey: string;
}

const People: React.FC<PeopleProps> = ({ apiKey }) => {
  const initialState = loadState(STORAGE_KEYS.PEOPLE) || {
    people: [],
    searchQuery: '',
    filters: {
      sortBy: 'popularity.desc'
    },
    page: 1
  };

  const [people, setPeople] = useState(initialState.people);
  const [searchQuery, setSearchQuery] = useState(initialState.searchQuery);
  const [filters, setFilters] = useState(initialState.filters);
  const [page, setPage] = useState(initialState.page);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [hoveredPersonId, setHoveredPersonId] = useState<number | null>(null);

  const { toggleFavorite, isFavorite } = useFavorites();
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPersonElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const navigate = useNavigate();

  const handleToggleFavorite = async (e: React.MouseEvent, person: Person) => {
    e.stopPropagation(); // Prevent navigation when clicking favorite button
    try {
      const actorImage = person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : undefined;
      await toggleFavorite(person.id, person.name, actorImage);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    if (!searchQuery) {
      setPeople([]);
      setHasMore(false);
      return;
    }
    setIsLoading(true);
    fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}&page=${page}`)
      .then(res => res.json())
      .then(data => {
        setPeople(prev => page === 1 ? data.results : [...prev, ...data.results]);
        setHasMore(page < data.total_pages);
      })
      .finally(() => setIsLoading(false));
  }, [searchQuery, page, apiKey]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    fetch(`https://api.themoviedb.org/3/search/person?api_key=${apiKey}&query=${encodeURIComponent(searchQuery)}`)
      .then(res => res.json())
      .then(data => setSuggestions(data.results || []));
  }, [searchQuery, apiKey]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveState(STORAGE_KEYS.PEOPLE, {
      people,
      searchQuery,
      filters,
      page
    });
  }, [people, searchQuery, filters, page]);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">People</h2>
        <div className="relative flex-1 sm:flex-initial sm:w-96">
          <input
            type="text"
            className="w-full p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            placeholder="Search for actors, directors..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
            }}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {people.map((person, idx) => (
          <div
            key={person.id}
            ref={idx === people.length - 1 ? lastPersonElementRef : undefined}
            className="relative group flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/person/${person.id}`)}
            onMouseEnter={() => setHoveredPersonId(person.id)}
            onMouseLeave={() => setHoveredPersonId(null)}
          >
            <div className="aspect-[2/3] relative">
              {/* Favorite Star Button */}
              <button
                onClick={(e) => handleToggleFavorite(e, person)}
                className={`absolute top-2 right-2 z-10 p-1 rounded-full transition-all ${
                  isFavorite(person.id) 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-black/50 text-gray-300 hover:bg-black/70'
                } ${hoveredPersonId === person.id ? 'opacity-100' : 'opacity-0'}`}
                title={isFavorite(person.id) ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star className={`w-4 h-4 ${isFavorite(person.id) ? 'fill-current' : ''}`} />
              </button>
              
              <img
                src={
                  person.profile_path
                    ? `https://image.tmdb.org/t/p/w300${person.profile_path}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=444&color=fff&size=256`
                }
                alt={person.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-2">
              <h3 className="text-sm font-medium line-clamp-2" title={person.name}>
                {person.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {person.known_for?.map(kf => kf.title || kf.name).filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        ))}
      </div>
      {isLoading && <div className="text-center text-gray-500">Loading...</div>}
      {!isLoading && people.length === 0 && searchQuery && (
        <div className="text-center text-gray-500">No people found.</div>
      )}
    </div>
  );
};

export default People;
