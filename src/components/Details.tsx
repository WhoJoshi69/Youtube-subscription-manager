import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { Moon, Sun } from 'lucide-react';
import { GradientLayout } from './Layout/GradientLayout';

interface DetailsProps {
  apiKey: string;
  darkMode?: boolean;
  onThemeToggle?: () => void;
}

const Details: React.FC<DetailsProps> = ({ apiKey, darkMode, onThemeToggle }) => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const [data, setData] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const url = `https://api.themoviedb.org/3/${type}/${id}?api_key=${apiKey}&language=en-US`;
      const creditsUrl = `https://api.themoviedb.org/3/${type}/${id}/credits?api_key=${apiKey}&language=en-US`;
      const [detailsRes, creditsRes] = await Promise.all([
        fetch(url),
        fetch(creditsUrl)
      ]);
      const detailsData = await detailsRes.json();
      const creditsData = await creditsRes.json();
      setData(detailsData);
      setCredits(creditsData);
      setLoading(false);
    };
    fetchDetails();
  }, [type, id, apiKey]);

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
              <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-gray-800 transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                {data.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                    alt={data.title || data.name}
                    className="w-full h-full object-contain"
                    style={{ aspectRatio: '2/3' }}
                  />
                )}
              </div>
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
              </div>
            </div>
          </div>
          {/* Cast Grid - always below poster/details */}
          <div className="w-full mt-8">
            <h2 className="text-xl font-semibold mb-2 text-white">Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-4">
              {cast.map((member: any) => (
                <div
                  key={member.id}
                  className="flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg rounded-lg p-2 cursor-pointer"
                >
                  <img
                    src={
                      member.profile_path
                        ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=444&color=fff&size=128`
                    }
                    alt={member.name}
                    className="rounded mb-1 w-24 h-32 object-cover bg-gray-700 transition-transform duration-200 group-hover:scale-110"
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
        </div>
      </div>
    </GradientLayout>
  );
};

export default Details;
