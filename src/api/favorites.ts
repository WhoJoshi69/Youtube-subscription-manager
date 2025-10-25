import { supabase } from '../lib/supabase'
import { FavoriteActor, NewMovieForFavorite } from '../types'

export const favoritesApi = {
  // Add actor to favorites
  async addFavoriteActor(actorId: number, actorName: string, actorImage?: string): Promise<FavoriteActor> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('favorite_actors')
      .insert({
        user_id: user.id,
        actor_id: actorId,
        actor_name: actorName,
        actor_image: actorImage
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Remove actor from favorites
  async removeFavoriteActor(actorId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('favorite_actors')
      .delete()
      .eq('user_id', user.id)
      .eq('actor_id', actorId)

    if (error) throw error
  },

  // Get user's favorite actors
  async getFavoriteActors(): Promise<FavoriteActor[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('favorite_actors')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Check if actor is favorited
  async isActorFavorited(actorId: number): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorite_actors')
      .select('id')
      .eq('user_id', user.id)
      .eq('actor_id', actorId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  // Get new movies for favorite actors
  async getNewMoviesForFavorites(): Promise<NewMovieForFavorite[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .rpc('get_new_movies_for_favorites', { user_uuid: user.id })

    if (error) throw error
    return data || []
  },

  // Mark movie as seen
  async markMovieAsSeen(movieId: number, actorId: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_movie_tracking')
      .insert({
        user_id: user.id,
        movie_id: movieId,
        actor_id: actorId
      })

    if (error && error.code !== '23505') throw error // Ignore duplicate key errors
  },

  // Sync actor movies (this would be called by a background job or manually)
  async syncActorMovies(actorId: number): Promise<void> {
    // This would fetch from TMDB API and update the actor_movies table
    // Implementation depends on your TMDB API setup
    const response = await fetch(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${import.meta.env.VITE_TMDB_API_KEY}`)
    const data = await response.json()
    
    if (data.cast) {
      const movies = data.cast
        .filter((movie: any) => movie.release_date && new Date(movie.release_date) >= new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)) // Last 6 months
        .map((movie: any) => ({
          actor_id: actorId,
          movie_id: movie.id,
          movie_title: movie.title,
          movie_poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          release_date: movie.release_date,
          overview: movie.overview,
          vote_average: movie.vote_average
        }))

      for (const movie of movies) {
        await supabase
          .from('actor_movies')
          .upsert(movie, { onConflict: 'actor_id,movie_id' })
      }
    }
  }
}