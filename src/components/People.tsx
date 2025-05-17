import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SearchInput } from './ui/SearchInput';

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
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">People</h2>
        <div className="relative flex-1 sm:flex-initial sm:w-96">
          <input
            type="text"
            className="w-full p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
            placeholder="Search for actors, directors..."
            value={selectedPerson ? selectedPerson.name : searchQuery}
            onChange={e => {
              setSelectedPerson(null);
              setSearchQuery(e.target.value);
            }}
            autoComplete="off"
          />
          {suggestions.length > 0 && !selectedPerson && (
            <div className="absolute z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded w-full max-h-60 overflow-y-auto">
              {suggestions.map(person => (
                <div
                  key={person.id}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    setSelectedPerson(person);
                    setSearchQuery(person.name);
                    setSuggestions([]);
                  }}
                >
                  <img
                    src={person.profile_path ? `https://image.tmdb.org/t/p/w45${person.profile_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=444&color=fff&size=32`}
                    alt={person.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span>{person.name}</span>
                </div>
              ))}
            </div>
          )}
          {selectedPerson && (
            <button
              className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
              onClick={() => setSelectedPerson(null)}
              title="Clear person"
            >×</button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {people.map((person, idx) => (
          <div
            key={person.id}
            ref={idx === people.length - 1 ? lastPersonElementRef : undefined}
            className="group flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="aspect-[2/3] relative">
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
