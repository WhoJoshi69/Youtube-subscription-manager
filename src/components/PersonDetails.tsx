import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackgroundGradient } from './ui/BackgroundGradient';
import Header from './Header';
import { GradientLayout } from './Layout/GradientLayout';

const PersonDetails: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const navigate = useNavigate();

  // Fetch person details only once
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=en-US`)
      .then(res => res.json())
      .then(data => setPerson(data))
      .finally(() => setLoading(false));
  }, [id, apiKey]);

  // Fetch credits on tab change
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const url =
      activeTab === 'movies'
        ? `https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${apiKey}&language=en-US`
        : `https://api.themoviedb.org/3/person/${id}/tv_credits?api_key=${apiKey}&language=en-US`;
    fetch(url)
      .then(res => res.json())
      .then(data => setCredits(data.cast || []))
      .finally(() => setLoading(false));
  }, [id, apiKey, activeTab]);

  if (loading) return <div>Loading...</div>;
  if (!person) return <div>Not found</div>;

  return (
    <GradientLayout>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black/60 dark:bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center">
          <div className="w-full flex flex-col md:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0 mx-auto md:mx-0" style={{ width: 256 }}>
              <BackgroundGradient className="rounded-3xl overflow-hidden">
                <img
                  src={person.profile_path
                    ? `https://image.tmdb.org/t/p/w500${person.profile_path}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=444&color=fff&size=256`}
                  alt={person.name}
                  style={{ borderRadius: '24px', aspectRatio: '2/3' }}
                  className="w-full h-full object-contain rounded-3xl"
                />
              </BackgroundGradient>
            </div>
            {/* Details */}
            <div className="flex-1 flex flex-col justify-between mt-6 md:mt-0">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">{person.name}</h1>
                <p className="mb-4 text-gray-200">{person.biography || "No biography available."}</p>
                <div className="mb-2 text-gray-400">
                  <span className="font-semibold">Known for: </span>
                  {person.known_for_department}
                </div>
                <div className="mb-2 text-gray-400">
                  <span className="font-semibold">Birthday: </span>
                  {person.birthday || "N/A"}
                </div>
                {person.deathday && (
                  <div className="mb-2 text-gray-400">
                    <span className="font-semibold">Deathday: </span>
                    {person.deathday}
                  </div>
                )}
                <div className="mb-2 text-gray-400">
                  <span className="font-semibold">Place of Birth: </span>
                  {person.place_of_birth || "N/A"}
                </div>
              </div>
            </div>
          </div>
          {/* Toggle and Grid */}
          <div className="w-full mt-8">
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                  activeTab === 'movies'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setActiveTab('movies')}
              >
                Movies
              </button>
              <button
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                  activeTab === 'tv'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setActiveTab('tv')}
              >
                TV Shows
              </button>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-white">
              {activeTab === 'movies' ? 'Movies' : 'TV Shows'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {credits.map(item => (
                <div
                  key={item.id}
                  className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(
                      activeTab === 'movies'
                        ? `/tmdb/movie/${item.id}`
                        : `/tmdb/tv/${item.id}`
                    )
                  }
                >
                  <div className="aspect-[2/3] relative w-full">
                    <img
                      src={item.poster_path
                        ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            activeTab === 'movies' ? item.title : item.name
                          )}&background=444&color=fff&size=256`}
                      alt={activeTab === 'movies' ? item.title : item.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center p-4">
                        <div className="text-xs font-semibold">
                          {activeTab === 'movies' ? item.title : item.name}
                        </div>
                        {item.character && (
                          <div className="text-[11px] italic mt-1">{item.character}</div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <h3
                      className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-gray-100"
                      title={activeTab === 'movies' ? item.title : item.name}
                    >
                      {activeTab === 'movies' ? item.title : item.name}
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      {item.character}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </GradientLayout>
  );
};

export default PersonDetails;
