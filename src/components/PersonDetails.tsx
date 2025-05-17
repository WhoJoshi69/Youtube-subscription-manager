import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BackgroundGradient } from './ui/BackgroundGradient';

interface PersonDetailsProps {
  apiKey: string;
}

const PersonDetails: React.FC<PersonDetailsProps> = ({ apiKey }) => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [movieCredits, setMovieCredits] = useState<any[]>([]);
  const [tvCredits, setTvCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile Image */}
        <div className="flex-shrink-0 mx-auto md:mx-0" style={{ width: 256 }}>
          <BackgroundGradient className="rounded-lg overflow-hidden">
            <img
              src={person.profile_path ? `https://image.tmdb.org/t/p/w500${person.profile_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=444&color=fff&size=256`}
              alt={person.name}
              className="w-full rounded-lg"
            />
          </BackgroundGradient>
        </div>
        {/* Details */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-2">{person.name}</h1>
          <p className="mb-4 text-gray-700 dark:text-gray-200">{person.biography || "No biography available."}</p>
          <div className="mb-2 text-gray-500">
            <span className="font-semibold">Known for: </span>
            {person.known_for_department}
          </div>
          <div className="mb-2 text-gray-500">
            <span className="font-semibold">Birthday: </span>
            {person.birthday || "N/A"}
          </div>
          {person.deathday && (
            <div className="mb-2 text-gray-500">
              <span className="font-semibold">Deathday: </span>
              {person.deathday}
            </div>
          )}
          <div className="mb-2 text-gray-500">
            <span className="font-semibold">Place of Birth: </span>
            {person.place_of_birth || "N/A"}
          </div>
        </div>
      </div>
      {/* Movies */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Movies</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movieCredits.map(movie => (
            <div key={movie.id} className="flex flex-col items-center">
              <img
                src={movie.poster_path ? `https://image.tmdb.org/t/p/w185${movie.poster_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.title)}&background=444&color=fff&size=128`}
                alt={movie.title}
                className="rounded mb-1 w-24 h-32 object-cover bg-gray-700"
              />
              <div className="text-xs text-center text-gray-100 font-semibold">{movie.title}</div>
              <div className="text-[11px] text-center text-gray-400 italic">{movie.character}</div>
            </div>
          ))}
        </div>
      </div>
      {/* TV Shows */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">TV Shows</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tvCredits.map(tv => (
            <div key={tv.id} className="flex flex-col items-center">
              <img
                src={tv.poster_path ? `https://image.tmdb.org/t/p/w185${tv.poster_path}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(tv.name)}&background=444&color=fff&size=128`}
                alt={tv.name}
                className="rounded mb-1 w-24 h-32 object-cover bg-gray-700"
              />
              <div className="text-xs text-center text-gray-100 font-semibold">{tv.name}</div>
              <div className="text-[11px] text-center text-gray-400 italic">{tv.character}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PersonDetails;
