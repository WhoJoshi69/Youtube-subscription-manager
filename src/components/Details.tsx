import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { Moon, Sun } from 'lucide-react';
import { GradientLayout } from './Layout/GradientLayout';
import { BackgroundGradient } from './ui/BackgroundGradient';

interface DetailsProps {
  apiKey: string;
  darkMode?: boolean;
  onThemeToggle?: () => void;
}

const Details: React.FC<DetailsProps> = ({ apiKey, darkMode, onThemeToggle }) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [providers, setProviders] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [seasonDetails, setSeasonDetails] = useState<any>(null);
  const [showCast, setShowCast] = useState(true);
  const [activeTab, setActiveTab] = useState<'cast' | 'episodes' | 'recommendations'>('cast');
  const [movieRecs, setMovieRecs] = useState<any[]>([]);
  const [tvRecs, setTvRecs] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US`;
      const creditsUrl = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}&language=en-US`;
      const providersUrl = `https://api.themoviedb.org/3/${type}/${id}/watch/providers?api_key=${apiKey}`;
      const [detailsRes, creditsRes, providersRes] = await Promise.all([
        fetch(url),
        fetch(creditsUrl),
        fetch(providersUrl)
      ]);
      const detailsData = await detailsRes.json();
      const creditsData = await creditsRes.json();
      const providersData = await providersRes.json();
      setProviders(
        providersData.results?.IN ||
        providersData.results?.US ||
        Object.values(providersData.results || {})[0] ||
        null
      );
      setData(detailsData);
      setCredits(creditsData);
      setLoading(false);
    };
    fetchDetails();
  }, [type, id, apiKey]);

  useEffect(() => {
    if (type === 'tv' && id && selectedSeason !== null) {
      const fetchSeason = async () => {
        const seasonUrl = `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${apiKey}&language=en-US`;
        const res = await fetch(seasonUrl);
        const data = await res.json();
        setSeasonDetails(data);
      };
      fetchSeason();
    }
  }, [type, id, selectedSeason, apiKey]);

  useEffect(() => {
    if (type === 'tv' && data?.seasons && data.seasons.length > 0) {
      setSelectedSeason(data.seasons[0].season_number);
    }
  }, [type, data]);

  useEffect(() => {
    if (!id || !type) return;
    const fetchRecs = async () => {
      if (type === 'movie') {
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${apiKey}`);
        const movieData = await movieRes.json();
        setMovieRecs(movieData.results || []);
        // Optionally, fetch TV recs for the right grid
        const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${apiKey}`);
        const tvData = await tvRes.json();
        setTvRecs(tvData.results || []);
      } else if (type === 'tv') {
        const tvRes = await fetch(`https://api.themoviedb.org/3/tv/${id}/recommendations?api_key=${apiKey}`);
        const tvData = await tvRes.json();
        setTvRecs(tvData.results || []);
        // Optionally, fetch movie recs for the left grid
        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${apiKey}`);
        const movieData = await movieRes.json();
        setMovieRecs(movieData.results || []);
      }
    };
    fetchRecs();
  }, [id, type, apiKey]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Not found</div>;

  const director = credits?.crew?.find((c: any) => c.job === 'Director');
  const cast = credits?.cast?.slice(0, 100) || [];

  return (
    <GradientLayout darkMode={darkMode}>
      <Header
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black/60 dark:bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center">
          {/* Poster and Details */}
          <div className="w-full flex flex-col md:flex-row gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0" style={{ width: 256 }}>
              <BackgroundGradient className="rounded-3xl overflow-hidden">
                <img
                  src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                  alt={data.title || data.name}
                  style={{ borderRadius: '24px', aspectRatio: '2/3' }}
                  className="w-full h-full object-contain rounded-3xl"
                />
              </BackgroundGradient>
            </div>
            {/* Details */}
            <div className="flex-1 flex flex-col justify-between mt-6 md:mt-0">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                  {data.title || data.name}
                  <span className="text-gray-400 font-normal ml-2">
                    ({(data.release_date || data.first_air_date || '').slice(0, 4)})
                  </span>
                </h1>
                <div className="text-gray-300 mb-2">
                  {data.genres?.map((g: any) => g.name).join(', ')}
                </div>
                <div className="mb-2 flex items-center gap-1">
                  <span className="text-yellow-400 font-bold text-lg">⭐ {data.vote_average?.toFixed(1)}</span>
                  <span className="text-gray-400 text-sm">{data.runtime ? `${data.runtime} min` : ''}</span>
                </div>
                <p className="mb-4 text-gray-200">{data.overview}</p>
                {director && (
                  <p className="mb-4 text-gray-200">
                    <span className="font-semibold">Director:</span> {director.name}
                  </p>
                )}
                {providers && providers.flatrate && providers.flatrate.length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {providers.flatrate.map((provider: any) => (
                      <a
                        key={provider.provider_id}
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:scale-110 transition-transform"
                        title={provider.provider_name}
                      >
                        <img
                          src={`https://image.tmdb.org/t/p/w45${provider.logo_path}`}
                          alt={provider.provider_name}
                          className="w-8 h-8 rounded-3xl shadow"
                        />
                        <span className="sr-only">{provider.provider_name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Cast Grid - always below poster/details */}
          {type === 'tv' && (
            <>
              <div className="flex justify-center gap-4 my-6">
                <button
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${activeTab === 'cast' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('cast')}
                >
                  Cast
                </button>
                <button
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${activeTab === 'episodes' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('episodes')}
                >
                  Episodes
                </button>
                <button
                  className={`px-4 py-2 rounded-full font-semibold transition-colors ${activeTab === 'recommendations' ? 'bg-red-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                  onClick={() => setActiveTab('recommendations')}
                >
                  Recommendations
                </button>
              </div>

              {activeTab === 'cast' && (
                <div className="w-full mt-8">
                  <h2 className="text-xl font-semibold mb-2 text-white">Cast</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-4">
                    {cast.map((member: any) => (
                      <div
                        key={member.id}
                        className="flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg rounded-lg p-2 cursor-pointer"
                        onClick={() => navigate(`/person/${member.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={
                            member.profile_path
                              ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=444&color=fff&size=128`
                          }
                          alt={member.name}
                          className="rounded-3xl mb-1 w-24 h-32 object-cover bg-gray-700 transition-transform duration-200 group-hover:scale-110"
                          onError={e => {
                            // fallback to avatar if image fails to load
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=444&color=fff&size=128`;
                          }}
                        />
                        <div className="text-xs text-center text-gray-100 font-semibold">{member.name}</div>
                        {member.character && (
                          <div className="text-[11px] text-center text-gray-400 italic">{member.character}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'episodes' && (
                <div className="w-full mt-8">
                  <h2 className="text-xl font-semibold mb-2 text-white">Episodes</h2>
                  <div className="mb-4">
                    <select
                      className="bg-gray-800 text-white rounded px-3 py-2"
                      value={selectedSeason ?? ''}
                      onChange={e => setSelectedSeason(Number(e.target.value))}
                    >
                      <option value="" disabled>Select a season</option>
                      {data.seasons.map((season: any) => (
                        <option key={season.id} value={season.season_number}>
                          {season.name} ({season.episode_count} episodes)
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Episodes Grid */}
                  {seasonDetails && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-white">
                        {seasonDetails.name}
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {seasonDetails.episodes.map((ep: any) => (
                          <div
                            key={ep.id}
                            className="flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg rounded-lg p-2 cursor-pointer"
                          >
                            <div className="aspect-[16/9] w-full rounded-3xl overflow-hidden bg-gray-700">
                              <img
                                src={
                                  ep.still_path
                                    ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                                    : `https://ui-avatars.com/api/?name=Episode+${ep.episode_number}&background=444&color=fff&size=128`
                                }
                                alt={ep.name}
                                className="w-full h-full object-cover rounded-3xl"
                              />
                            </div>
                            <div className="text-xs text-center text-gray-100 font-semibold mt-1">{ep.episode_number}. {ep.name}</div>
                            {ep.overview && (
                              <div className="text-[11px] text-gray-400 mt-1 line-clamp-2">{ep.overview}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'recommendations' && (
                <div className="w-full mt-8 flex flex-col md:flex-row gap-8">
                  {/* Left: Movies */}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2 text-white">Recommended Movies</h2>
                    <div className="grid grid-cols-4 gap-4">
                      {movieRecs.map(movie => (
                        <div
                          key={movie.id}
                          className="bg-gray-800 rounded-3xl p-2 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg"
                          onClick={() => navigate(`/tmdb/movie/${movie.id}`)}
                        >
                          <div className="aspect-[2/3] w-full rounded-3xl overflow-hidden bg-gray-700">
                            <img
                              src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : ''}
                              alt={movie.title}
                              className="w-full h-full object-cover rounded-3xl"
                            />
                          </div>
                          <div className="text-xs text-center text-gray-100 font-semibold mt-1">{movie.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Partition line */}
                  <div className="hidden md:block w-px bg-gray-600 mx-4 my-2 rounded-full" />
                  {/* Right: TV Shows */}
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-2 text-white">Recommended TV Shows</h2>
                    <div className="grid grid-cols-4 gap-4">
                      {tvRecs.map(tv => (
                        <div
                          key={tv.id}
                          className="bg-gray-800 rounded-3xl p-2 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg"
                          onClick={() => navigate(`/tmdb/tv/${tv.id}`)}
                        >
                          <div className="aspect-[2/3] w-full rounded-3xl overflow-hidden bg-gray-700">
                            <img
                              src={tv.poster_path ? `https://image.tmdb.org/t/p/w185${tv.poster_path}` : ''}
                              alt={tv.name}
                              className="w-full h-full object-cover rounded-3xl"
                            />
                          </div>
                          <div className="text-xs text-center text-gray-100 font-semibold mt-1">{tv.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {type === 'movie' && (
            <>
              <div className="w-full mt-8">
                <h2 className="text-xl font-semibold mb-2 text-white">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-4">
                  {cast.map((member: any) => (
                    <div
                      key={member.id}
                      className="flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg rounded-lg p-2 cursor-pointer"
                      onClick={() => navigate(`/person/${member.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={
                          member.profile_path
                            ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=444&color=fff&size=128`
                        }
                        alt={member.name}
                        className="rounded-3xl mb-1 w-24 h-32 object-cover bg-gray-700 transition-transform duration-200 group-hover:scale-110"
                        onError={e => {
                          // fallback to avatar if image fails to load
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=444&color=fff&size=128`;
                        }}
                      />
                      <div className="text-xs text-center text-gray-100 font-semibold">{member.name}</div>
                      {member.character && (
                        <div className="text-[11px] text-center text-gray-400 italic">{member.character}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-full mt-8 flex flex-col md:flex-row gap-8">
                {/* Left: Movies */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2 text-white">Recommended Movies</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {movieRecs.map(movie => (
                      <div
                        key={movie.id}
                        className="bg-gray-800 rounded-3xl p-2 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg"
                        onClick={() => navigate(`/tmdb/movie/${movie.id}`)}
                      >
                        <div className="aspect-[2/3] w-full rounded-3xl overflow-hidden bg-gray-700">
                          <img
                            src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : ''}
                            alt={movie.title}
                            className="w-full h-full object-cover rounded-3xl"
                          />
                        </div>
                        <div className="text-xs text-center text-gray-100 font-semibold mt-1">{movie.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Partition line */}
                <div className="hidden md:block w-px bg-gray-600 mx-4 my-2 rounded-full" />
                {/* Right: TV Shows */}
                <div className="flex-1">
                  <h2 className="text-lg font-semibold mb-2 text-white">Recommended TV Shows</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {tvRecs.map(tv => (
                      <div
                        key={tv.id}
                        className="bg-gray-800 rounded-3xl p-2 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg"
                        onClick={() => navigate(`/tmdb/tv/${tv.id}`)}
                      >
                        <div className="aspect-[2/3] w-full rounded-3xl overflow-hidden bg-gray-700">
                          <img
                            src={tv.poster_path ? `https://image.tmdb.org/t/p/w185${tv.poster_path}` : ''}
                            alt={tv.name}
                            className="w-full h-full object-cover rounded-3xl"
                          />
                        </div>
                        <div className="text-xs text-center text-gray-100 font-semibold mt-1">{tv.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </GradientLayout>
  );
};

export default Details;
