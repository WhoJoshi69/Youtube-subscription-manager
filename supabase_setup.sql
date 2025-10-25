-- Create favorite_actors table
CREATE TABLE IF NOT EXISTS favorite_actors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL, -- TMDB person ID
  actor_name TEXT NOT NULL,
  actor_image TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, actor_id)
);

-- Create actor_movies table to track movies by favorite actors
CREATE TABLE IF NOT EXISTS actor_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id INTEGER NOT NULL,
  movie_id INTEGER NOT NULL, -- TMDB movie ID
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  release_date DATE,
  overview TEXT,
  vote_average DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(actor_id, movie_id)
);

-- Create user_movie_tracking to track which movies user has seen notifications for
CREATE TABLE IF NOT EXISTS user_movie_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL,
  actor_id INTEGER NOT NULL,
  seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_id, actor_id)
);

-- Enable Row Level Security
ALTER TABLE favorite_actors ENABLE ROW LEVEL SECURITY;
ALTER TABLE actor_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_movie_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for favorite_actors
CREATE POLICY "Users can view their own favorite actors" ON favorite_actors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite actors" ON favorite_actors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite actors" ON favorite_actors
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for actor_movies (public read)
CREATE POLICY "Anyone can view actor movies" ON actor_movies
  FOR SELECT USING (true);

CREATE POLICY "Service role can insert actor movies" ON actor_movies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update actor movies" ON actor_movies
  FOR UPDATE USING (true);

-- Create policies for user_movie_tracking
CREATE POLICY "Users can view their own movie tracking" ON user_movie_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own movie tracking" ON user_movie_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_favorite_actors_user_id ON favorite_actors(user_id);
CREATE INDEX IF NOT EXISTS idx_actor_movies_actor_id ON actor_movies(actor_id);
CREATE INDEX IF NOT EXISTS idx_actor_movies_release_date ON actor_movies(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_user_movie_tracking_user_id ON user_movie_tracking(user_id);

-- Create a function to get new movies for user's favorite actors
CREATE OR REPLACE FUNCTION get_new_movies_for_favorites(user_uuid UUID)
RETURNS TABLE (
  movie_id INTEGER,
  movie_title TEXT,
  movie_poster TEXT,
  release_date DATE,
  overview TEXT,
  vote_average DECIMAL(3,1),
  actor_id INTEGER,
  actor_name TEXT,
  actor_image TEXT,
  is_new BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.movie_id,
    am.movie_title,
    am.movie_poster,
    am.release_date,
    am.overview,
    am.vote_average,
    fa.actor_id,
    fa.actor_name,
    fa.actor_image,
    (umt.movie_id IS NULL) as is_new
  FROM favorite_actors fa
  JOIN actor_movies am ON fa.actor_id = am.actor_id
  LEFT JOIN user_movie_tracking umt ON (
    umt.user_id = user_uuid AND 
    umt.movie_id = am.movie_id AND 
    umt.actor_id = am.actor_id
  )
  WHERE fa.user_id = user_uuid
    AND am.release_date >= CURRENT_DATE - INTERVAL '6 months'
  ORDER BY am.release_date DESC, am.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;