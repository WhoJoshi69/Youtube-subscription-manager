import { useState, useEffect } from 'react'
import { favoritesApi } from '../api/favorites'
import { FavoriteActor } from '../types'

export const useFavorites = () => {
  const [favoriteActors, setFavoriteActors] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadFavorites = async () => {
    try {
      setLoading(true)
      const favorites = await favoritesApi.getFavoriteActors()
      setFavoriteActors(new Set(favorites.map(f => f.actor_id)))
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (actorId: number, actorName: string, actorImage?: string) => {
    try {
      if (favoriteActors.has(actorId)) {
        await favoritesApi.removeFavoriteActor(actorId)
        setFavoriteActors(prev => {
          const newSet = new Set(prev)
          newSet.delete(actorId)
          return newSet
        })
      } else {
        await favoritesApi.addFavoriteActor(actorId, actorName, actorImage)
        setFavoriteActors(prev => new Set(prev).add(actorId))
        
        // Sync actor movies when adding to favorites
        try {
          await favoritesApi.syncActorMovies(actorId)
        } catch (syncError) {
          console.error('Error syncing actor movies:', syncError)
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      throw error
    }
  }

  const isFavorite = (actorId: number) => favoriteActors.has(actorId)

  useEffect(() => {
    loadFavorites()
  }, [])

  return {
    favoriteActors,
    loading,
    toggleFavorite,
    isFavorite,
    loadFavorites
  }
}