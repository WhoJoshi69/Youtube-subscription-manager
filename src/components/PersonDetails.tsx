import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackgroundGradient } from './ui/BackgroundGradient';
import Header from './Header';
import { GradientLayout } from './Layout/GradientLayout';
import { Timeline } from './ui/Timeline';

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

  const groupByYear = (items: any[]) => {
    const grouped = items.reduce((acc: { [key: string]: any[] }, item) => {
      const year = new Date(
        item.release_date || item.first_air_date || ''
      ).getFullYear();
      const yearStr = year.toString() || 'Unknown';
      
      if (!acc[yearStr]) {
        acc[yearStr] = [];
      }
      acc[yearStr].push(item);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([year, items]) => ({
        year,
        items: items.sort((a, b) => {
          const dateA = new Date(a.release_date || a.first_air_date || '');
          const dateB = new Date(b.release_date || b.first_air_date || '');
          return dateB.getTime() - dateA.getTime();
        }),
      }))
      .sort((a, b) => Number(b.year) - Number(a.year));
  };

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
            </h2>
            <Timeline 
              data={groupByYear(credits)} 
              type={activeTab} 
            />
          </div>
        </div>
      </div>
    </GradientLayout>
  );
};

export default PersonDetails;
