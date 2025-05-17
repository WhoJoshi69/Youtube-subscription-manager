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
  const cast = credits?.cast?.slice(0, 8) || [];

  return (
    <GradientLayout darkMode={darkMode}>
      <Header
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black/60 dark:bg-gray-900/80 rounded-2xl shadow-lg flex flex-col md:flex-row gap-8 p-6">
          <div className="flex-shrink-0 w-full md:w-64 aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
            {data.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w500${data.poster_path}`}
                alt={data.title || data.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between">
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
              <div className="mb-2 flex items-center gap-2">
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
            <div>
              <h2 className="text-xl font-semibold mb-2 text-white">Cast</h2>
              <div className="flex flex-wrap gap-4">
                {cast.map((member: any) => (
                  <div key={member.id} className="w-24">
                    <img
                      src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : ''}
                      alt={member.name}
                      className="rounded mb-1 w-24 h-32 object-cover bg-gray-700"
                    />
                    <div className="text-xs text-center text-gray-100">{member.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GradientLayout>
  );
};

export default Details;
