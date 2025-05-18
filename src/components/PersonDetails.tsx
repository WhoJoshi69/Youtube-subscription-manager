import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackgroundGradient } from './ui/BackgroundGradient';
import Header from './Header';
import { GradientLayout } from './Layout/GradientLayout';
import { Timeline } from './ui/Timeline';
import { motion } from 'framer-motion';

interface Credit {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  poster_path: string | null;
  media_type: 'movie' | 'tv';
  character?: string;
  job?: string;
  department?: string;
}

const PersonDetails: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'movie' | 'tv'>('movie');
  const navigate = useNavigate();

  // Fetch person details only once
  useEffect(() => {
    if (!id) return;
    fetch(`https://api.themoviedb.org/3/person/${id}?api_key=${apiKey}&language=en-US`)
      .then(res => res.json())
      .then(data => setPerson(data))
      .catch(error => console.error('Error fetching person:', error));
  }, [id, apiKey]);

  // Fetch credits whenever tab changes
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setCredits([]); // Clear existing credits

    fetch(`https://api.themoviedb.org/3/person/${id}/combined_credits?api_key=${apiKey}&language=en-US`)
      .then(res => res.json())
      .then(data => {
        // Filter credits based on active tab
        const allCredits = [...(data.cast || []), ...(data.crew || [])];
        const filteredCredits = allCredits.filter(credit => credit.media_type === activeTab);
        setCredits(filteredCredits);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching credits:', error);
        setLoading(false);
      });
  }, [id, apiKey, activeTab]); // Added activeTab as dependency

  const groupByYear = (items: Credit[]) => {
    const grouped = items.reduce((acc: { [key: string]: Credit[] }, item) => {
      const date = item.release_date || item.first_air_date || '';
      const year = new Date(date).getFullYear().toString() || 'Unknown';
      
      if (!acc[year]) {
        acc[year] = [];
      }
      acc[year].push(item);
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

  if (!person) return <div>Not found</div>;

  return (
    <GradientLayout>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-black/60 dark:bg-gray-900/80 rounded-2xl shadow-lg p-6 flex flex-col items-center">
          {/* Person details section */}
          <div className="w-full flex flex-col md:flex-row gap-8">
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

          {/* Media type toggle */}
          <div className="w-full mt-8">
            <div className="flex gap-2 mb-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-semibold transition-colors relative ${
                  activeTab === 'movie'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setActiveTab('movie')}
              >
                Movies
                {activeTab === 'movie' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-red-600 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-full font-semibold transition-colors relative ${
                  activeTab === 'tv'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                }`}
                onClick={() => setActiveTab('tv')}
              >
                TV Shows
                {activeTab === 'tv' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-red-600 rounded-full -z-10"
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            </div>

            <motion.h2
              key={activeTab}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold mb-2 text-white"
            >
              {activeTab === 'movie' ? 'Movies' : 'TV Shows'} Timeline
            </motion.h2>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <Timeline 
                data={groupByYear(credits)}
                type={activeTab === 'movie' ? 'movies' : 'tv'}
              />
            )}
          </div>
        </div>
      </div>
    </GradientLayout>
  );
};

export default PersonDetails;
