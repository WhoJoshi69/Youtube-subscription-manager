import React, { useState, useEffect } from 'react'
import { Star, Eye, Calendar, TrendingUp } from 'lucide-react'
import { favoritesApi } from '../api/favorites'
import { FavoriteActor, NewMovieForFavorite } from '../types'

export default function Tracker() {
  const [favoriteActors, setFavoriteActors] = useState<FavoriteActor[]>([])
  const [newMovies, setNewMovies] = useState<NewMovieForFavorite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  const newMoviesCount = newMovies.filter(movie => movie.is_new).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Movie Tracker</h2>
          {newMoviesCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {newMoviesCount} new
            </span>
          )}
        </div>
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Favorite Actors */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Favorite Actors ({favoriteActors.length})
        </h3>
        
        {favoriteActors.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No favorite actors yet. Add some from movie details to track their new releases!
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favoriteActors.map((actor) => (
              <div key={actor.id} className="relative group">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {actor.actor_image ? (
                    <img 
                      src={actor.actor_image} 
                      alt={actor.actor_name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                      <Star className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{actor.actor_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveFavorite(actor.actor_id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from favorites"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Movies */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-500" />
          Recent Movies ({newMovies.length})
        </h3>
        
        {newMovies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No recent movies from your favorite actors.
          </p>
        ) : (
          <div className="space-y-4">
            {newMovies.map((movie) => (
              <div 
                key={`${movie.movie_id}-${movie.actor_id}`}
                className={`bg-white rounded-lg shadow-md p-4 ${movie.is_new ? 'border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex gap-4">
                  {movie.movie_poster ? (
                    <img 
                      src={movie.movie_poster} 
                      alt={movie.movie_title}
                      className="w-20 h-30 object-cover rounded"
                    />
                  ) : (
                    <div className="w-20 h-30 bg-gray-200 rounded flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">{movie.movie_title}</h4>
                        <p className="text-sm text-gray-600 mb-1">
                          Starring: {movie.actor_name}
                        </p>
                        {movie.release_date && (
                          <p className="text-sm text-gray-500 mb-2">
                            Released: {new Date(movie.release_date).toLocaleDateString()}
                          </p>
                        )}
                        {movie.vote_average && (
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{movie.vote_average}/10</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {movie.is_new && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                            New
                          </span>
                        )}
                        <button
                          onClick={() => handleMarkAsSeen(movie.movie_id, movie.actor_id)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                          title="Mark as seen"
                        >
                          <Eye className="w-4 h-4" />
                          {movie.is_new ? 'Mark Seen' : 'Seen'}
                        </button>
                      </div>
                    </div>
                    
                    {movie.overview && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {movie.overview}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}