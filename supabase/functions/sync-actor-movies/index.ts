import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const tmdbApiKey = Deno.env.get('TMDB_API_KEY')
    if (!tmdbApiKey) {
      throw new Error('TMDB_API_KEY not configured')
    }

    // Get all unique actor IDs from favorite_actors
    const { data: actors, error: actorsError } = await supabaseClient
      .from('favorite_actors')
      .select('actor_id')
      .group('actor_id')

    if (actorsError) throw actorsError

    const uniqueActorIds = [...new Set(actors.map(a => a.actor_id))]
    
    for (const actorId of uniqueActorIds) {
      try {
        // Fetch actor's movie credits from TMDB
        const response = await fetch(
          `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbApiKey}`
        )
        const data = await response.json()

        if (data.cast) {
          // Filter for recent movies (last 6 months)
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

          const recentMovies = data.cast
            .filter((movie: any) => {
              if (!movie.release_date) return false
              const releaseDate = new Date(movie.release_date)
              return releaseDate >= sixMonthsAgo
            })
            .map((movie: any) => ({
              actor_id: actorId,
              movie_id: movie.id,
              movie_title: movie.title,
              movie_poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              release_date: movie.release_date,
              overview: movie.overview,
              vote_average: movie.vote_average
            }))

          // Upsert movies to database
          if (recentMovies.length > 0) {
            const { error: upsertError } = await supabaseClient
              .from('actor_movies')
              .upsert(recentMovies, { onConflict: 'actor_id,movie_id' })

            if (upsertError) {
              console.error(`Error upserting movies for actor ${actorId}:`, upsertError)
            }
          }
        }
      } catch (error) {
        console.error(`Error processing actor ${actorId}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced movies for ${uniqueActorIds.length} actors` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})