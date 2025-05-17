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
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{data.title || data.name}</h1>
      <p className="text-gray-500 mb-2">{data.release_date || data.first_air_date}</p>
      <p className="mb-4">{data.overview}</p>
      {director && (
        <p className="mb-4"><strong>Director:</strong> {director.name}</p>
      )}
      <h2 className="text-xl font-semibold mb-2">Cast</h2>
      <div className="flex flex-wrap gap-4">
        {cast.map((member: any) => (
          <div key={member.id} className="w-24">
            <img
              src={member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : ''}
              alt={member.name}
              className="rounded mb-1 w-24 h-32 object-cover bg-gray-200"
            />
            <div className="text-xs text-center">{member.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Details;
