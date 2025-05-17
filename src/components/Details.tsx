import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

interface DetailsProps {
  apiKey: string;
}

const Details: React.FC<DetailsProps> = ({ apiKey }) => {
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
    <div
      className="min-h-screen"
      style={{
        background: data.backdrop_path
          ? `linear-gradient(rgba(30,30,30,0.95),rgba(30,30,30,0.98)), url(https://image.tmdb.org/t/p/original${data.backdrop_path}) center/cover no-repeat`
          : '#222'
      }}
    >
      <div className="max-w-5xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-8">
        <img
          src={data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : ''}
          alt={data.title || data.name}
          className="rounded-lg shadow-lg w-64 h-auto"
        />
        <div className="flex-1 text-white">
          <h1 className="text-4xl font-bold mb-2">{data.title || data.name} <span className="text-gray-300 text-2xl">({(data.release_date || data.first_air_date || '').slice(0,4)})</span></h1>
          <div className="mb-2 text-lg text-gray-300">{data.genres?.map((g: any) => g.name).join(', ')}</div>
          <div className="mb-4 text-yellow-400 font-semibold">{data.vote_average ? `⭐ ${data.vote_average.toFixed(1)}` : ''}</div>
          <p className="mb-4 text-gray-200">{data.overview}</p>
          {director && (
            <p className="mb-4"><strong>Director:</strong> {director.name}</p>
          )}
          <h2 className="text-2xl font-semibold mb-2 mt-6">Cast</h2>
          <div className="flex flex-wrap gap-4">
            {cast.map((member: any) => (
              <div key={member.id} className="w-24">
                <img
                  src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : ''}
                  alt={member.name}
                  className="rounded mb-1 w-24 h-32 object-cover bg-gray-200"
                />
                <div className="text-xs text-center text-gray-100">{member.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Details;
