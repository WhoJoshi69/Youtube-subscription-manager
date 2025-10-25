# Favorites & Movie Tracker Setup

This guide will help you set up the favorites feature and movie tracker for your YouTube Subscription Manager.

## Prerequisites

1. **Supabase Project**: Make sure you have a Supabase project set up
2. **Environment Variables**: Your `.env` file should already have:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_TMDB_API_KEY=your_tmdb_api_key
   ```

## Database Setup

1. **Run the SQL Setup**: Execute the SQL commands in `supabase_setup.sql` in your Supabase SQL editor:
   - This creates the necessary tables: `favorite_actors`, `actor_movies`, `user_movie_tracking`
   - Sets up Row Level Security (RLS) policies
   - Creates indexes for performance
   - Adds a function to get new movies for favorite actors

2. **Deploy the Sync Function** (Optional - for automatic updates):
   ```bash
   supabase functions deploy sync-actor-movies
   ```

## Features

### 1. Favorite Actors
- **Add to Favorites**: Click the star icon on any actor in movie/TV show cast lists
- **View Favorites**: Go to the "Tracker" section to see all your favorite actors
- **Remove Favorites**: Click the star again or use the remove button in the Tracker

### 2. Movie Tracker
- **New Releases**: Automatically tracks new movies from your favorite actors (last 6 months)
- **Mark as Seen**: Click "Mark Seen" to remove movies from your new releases list
- **Actor Management**: Add/remove favorite actors directly from the tracker

### 3. Navigation
- New "Tracker" section added to the bottom navigation
- Access via the trending up icon in the floating dock

## How It Works

1. **Adding Favorites**: When you add an actor to favorites, their recent movies are automatically synced
2. **Movie Tracking**: The system tracks movies released in the last 6 months by your favorite actors
3. **Notifications**: New movies appear with a "New" badge until you mark them as seen
4. **Background Sync**: The sync function can be scheduled to run periodically to update movie data

## Manual Movie Sync

If you want to manually sync an actor's movies, you can call the sync function:

```javascript
import { favoritesApi } from './src/api/favorites'

// Sync movies for a specific actor
await favoritesApi.syncActorMovies(actorId)
```

## Troubleshooting

1. **Authentication Issues**: Make sure you're logged in to Supabase
2. **Missing Movies**: Run the sync function or wait for the scheduled sync
3. **Performance**: The system is optimized with indexes, but large numbers of favorites may affect performance

## Database Schema

- `favorite_actors`: Stores user's favorite actors
- `actor_movies`: Stores movies by actors (shared across users)
- `user_movie_tracking`: Tracks which movies users have seen notifications for
- `get_new_movies_for_favorites()`: Function to efficiently get new movies for a user

## Security

- All tables use Row Level Security (RLS)
- Users can only access their own favorites and tracking data
- Actor movies are publicly readable but only writable by service role