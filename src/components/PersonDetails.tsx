import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackgroundGradient } from './ui/BackgroundGradient';
import Header from './Header';
import { GradientLayout } from './Layout/GradientLayout';

interface PersonDetailsProps {
  apiKey: string;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({ apiKey }) => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [movieCredits, setMovieCredits] = useState<any[]>([]);
  const [tvCredits, setTvCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movies' | 'tv'>('movies');
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=en-US`).then(res => res.json()),
      fetch(`https://api.themoviedb.org/3/person/${id}/movie_credits?api_key=${apiKey}&language=en-US`).then(res => res.json()),
      fetch(`https://api.themoviedb.org/3/person/${id}/tv_credits?api_key=${apiKey}&language=en-US`).then(res => res.json()),
    ]).then(([personData, movieData, tvData]) => {
      setPerson(personData);
      setMovieCredits(movieData.cast || []);
      setTvCredits(tvData.cast || []);
    }).finally(() => setLoading(false));
  }, [id, apiKey]);

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
          {/* Movies */}
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

            {activeTab === 'movies' ? (
              <>
                <h2 className="text-xl font-semibold mb-2 text-white">Movies</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {movieCredits.map(movie => (
                    <div
                      key={movie.id}
                      className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/tmdb/movie/${movie.id}`)}
                    >
                      <div className="aspect-[2/3] relative w-full">
                        <img
                          src={movie.poster_path
                            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=444&color=fff&size=256`}
                          alt={movie.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="text-white text-center p-4">
                            <div className="text-xs font-semibold">{movie.title}</div>
                            {movie.character && (
                              <div className="text-[11px] italic mt-1">{movie.character}</div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-gray-100" title={movie.title}>
                          {movie.title}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{movie.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2 text-white">TV Shows</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {tvCredits.map(tv => (
                    <div
                      key={tv.id}
                      className="group relative flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/tmdb/tv/${tv.id}`)}
                    >
                      <div className="aspect-[2/3] relative w-full">
                        <img
                          src={tv.poster_path
                            ? `https://image.tmdb.org/t/p/w500${tv.poster_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(tv.name)}&background=444&color=fff&size=256`}
                          alt={tv.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="text-sm font-medium line-clamp-2 text-gray-900 dark:text-gray-100" title={tv.name}>
                          {tv.name}
                        </h3>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{tv.character}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </GradientLayout>
  );
};

export default PersonDetails;
