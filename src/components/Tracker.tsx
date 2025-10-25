import React, { useState, useEffect } from 'react'
import { Star, Eye, Calendar, TrendingUp, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { favoritesApi } from '../api/favorites'
import { FavoriteActor, NewMovieForFavorite } from '../types'

export default function Tracker() {
  const [favoriteActors, setFavoriteActors] = useState<FavoriteActor[]>([])
  const [newMovies, setNewMovies] = useState<NewMovieForFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredActorId, setHoveredActorId] = useState<number | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [actors, movies] = await Promise.all([
        favoritesApi.getFavoriteActors(),
        favoritesApi.getNewMoviesForFavorites()
      ])
      setFavoriteActors(actors)
      setNewMovies(movies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsSeen = async (movieId: number, actorId: number) => {
    try {
      await favoritesApi.markMovieAsSeen(movieId, actorId)
      setNewMovies(prev => prev.map(movie => 
        movie.movie_id === movieId && movie.actor_id === actorId 
          ? { ...movie, is_new: false }
          : movie
      ))
    } catch (err) {
      console.error('Failed to mark as seen:', err)
    }
  }

  const handleRemoveFavorite = async (actorId: number) => {
    try {
      await favoritesApi.removeFavoriteActor(actorId)
      setFavoriteActors(prev => prev.filter(actor => actor.actor_id !== actorId))
      setNewMovies(prev => prev.filter(movie => movie.actor_id !== actorId))
    } catch (err) {
      console.error('Failed to remove favorite:', err)
    }
  }

  const handleMovieClick = (movieId: number) => {
    navigate(`/tmdb/movie/${movieId}`, {
      state: {
        from: 'tracker'
      }
    })
  }

  const handleActorClick = (actorId: number) => {
    navigate(`/person/${actorId}`)
  }

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 w-3/4"></div>
    </div>
  )

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Movie Tracker</h2>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-3">Favorite Actors</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-4">
            {[...Array(10)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Recent Movies</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <LoadingSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const newMoviesCount = newMovies.filter(movie => movie.is_new).length

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold">Movie Tracker</h2>
          {newMoviesCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {newMoviesCount} new
            </span>
          )}
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Favorite Actors - Match Details page cast styling */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Favorite Actors ({favoriteActors.length})
        </h3>
        
        {favoriteActors.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No favorite actors yet. Add some from movie details to track their new releases!
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-10 gap-4">
            {favoriteActors.map((actor) => (
              <div
                key={actor.id}
                className="relative flex flex-col items-center transition-transform duration-200 hover:scale-105 hover:bg-gray-800/60 hover:shadow-lg rounded-lg p-2 cursor-pointer group"
                onClick={() => handleActorClick(actor.actor_id)}
                onMouseEnter={() => setHoveredActorId(actor.actor_id)}
                onMouseLeave={() => setHoveredActorId(null)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFavorite(actor.actor_id)
                  }}
                  className={`absolute top-1 right-1 z-10 p-1 rounded-full transition-all bg-red-500 text-white hover:bg-red-600 ${
                    hoveredActorId === actor.actor_id ? 'opacity-100' : 'opacity-0'
                  }`}
                  title="Remove from favorites"
                >
                  <X className="w-3 h-3" />
                </button>
                
                <img
                  src={
                    actor.actor_image
                      ? actor.actor_image
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.actor_name)}&background=444&color=fff&size=128`
                  }
                  alt={actor.actor_name}
                  className="rounded-3xl mb-1 w-24 h-32 object-cover bg-gray-700 transition-transform duration-200 group-hover:scale-110"
                  onError={e => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.actor_name)}&background=444&color=fff&size=128`
                  }}
                />
                <div className="text-xs text-center text-gray-100 font-semibold">{actor.actor_name}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Movies - Match MovieGrid styling */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          Recent Movies ({newMovies.length})
        </h3>
        
        {newMovies.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No recent movies from your favorite actors.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {newMovies.map((movie) => {
              const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : null
              
              return (
                <div
                  key={`${movie.movie_id}-${movie.actor_id}`}
                  className="relative group cursor-pointer"
                  onClick={() => handleMovieClick(movie.movie_id)}
                >
                  {/* New badge */}
                  {movie.is_new && (
                    <div className="absolute top-2 left-2 z-10 bg-red-500/90 text-white text-xs px-2 py-1 rounded-full font-medium">
                      New
                    </div>
                  )}

                  {/* Mark as seen button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleMarkAsSeen(movie.movie_id, movie.actor_id)
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full text-white 
                               transition-all duration-200 backdrop-blur-sm hover:scale-110 
                               transform z-10 ${
                                 movie.is_new 
                                   ? 'bg-black/50 hover:bg-black/70' 
                                   : 'bg-green-500/80'
                               }`}
                    title={movie.is_new ? "Mark as seen" : "Already seen"}
                  >
                    <Eye size={16} />
                  </button>

                  <div className="aspect-[2/3] relative">
                    <img
                      src={
                        movie.movie_poster
                          ? movie.movie_poster
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.movie_title)}&background=444&color=fff&size=256`
                      }
                      alt={movie.movie_title}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg"
                      loading="lazy"
                      onError={e => {
                        e.currentTarget.onerror = null
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(movie.movie_title)}&background=444&color=fff&size=256`
                      }}
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                      <div className="text-white text-center p-4">
                        <p className="text-sm line-clamp-4">{movie.overview}</p>
                        <div className="mt-2 flex items-center justify-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">{movie.vote_average?.toFixed(1)}</span>
                        </div>
                        <p className="text-xs mt-1 text-gray-300">
                          Starring: {movie.actor_name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <h3 className="text-sm font-medium line-clamp-2" title={movie.movie_title}>
                      {movie.movie_title}
                    </h3>
                    {releaseYear && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {releaseYear}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {movie.actor_name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}