import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface WatchedTitle {
  tmdb_id: number;
  type: 'movie' | 'tv';
}

const WATCHED_TITLES_KEY = 'watched_titles';

export const useWatchedTitles = () => {
  const [watchedTitles, setWatchedTitles] = useState<WatchedTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data from local storage
  useEffect(() => {
    const stored = localStorage.getItem(WATCHED_TITLES_KEY);
    if (stored) {
      setWatchedTitles(JSON.parse(stored));
    }
  }, []);

  // Fetch watched titles from Supabase on mount
  useEffect(() => {
    const fetchWatchedTitles = async () => {
      try {
        // First get all entertainment entries that are in the History list
        const { data: watchedContent, error } = await supabase
          .from('list_entertainment_map')
          .select(`
            entertainment!inner(
              tmdb_id,
              type
            ),
            list:lists!inner(
              name
            )
          `)
          .eq('list.name', 'History');

        if (error) throw error;

        const titles = watchedContent
          ?.filter(item => item.entertainment && item.list)
          .map(item => ({
            tmdb_id: item.entertainment.tmdb_id,
            type: item.entertainment.type as 'movie' | 'tv'
          })) || [];

        setWatchedTitles(titles);
        localStorage.setItem(WATCHED_TITLES_KEY, JSON.stringify(titles));
      } catch (error) {
        console.error('Error fetching watched titles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWatchedTitles();
  }, []);

  const isWatched = (tmdbId: number, type: 'movie' | 'tv') => {
    return watchedTitles.some(title => 
      title.tmdb_id === tmdbId && title.type === type
    );
  };

  const markAsWatched = async (tmdbId: number, type: 'movie' | 'tv', title: string) => {
    try {
      // First, get or create the entertainment entry
      let { data: existingEnt } = await supabase
        .from('entertainment')
        .select('id')
        .eq('tmdb_id', tmdbId)
        .eq('type', type)
        .single();

      let entertainmentId;

      if (!existingEnt) {
        // Create entertainment entry if it doesn't exist
        const { data: newEnt, error: entError } = await supabase
          .from('entertainment')
          .insert({
            tmdb_id: tmdbId,
            type: type,
            title: title
          })
          .select()
          .single();

        if (entError) throw entError;
        entertainmentId = newEnt.id;
      } else {
        entertainmentId = existingEnt.id;
      }

      // Get the History list or create it if it doesn't exist
      let { data: historyList } = await supabase
        .from('lists')
        .select('id')
        .eq('name', 'History')
        .single();

      if (!historyList) {
        // Create History list if it doesn't exist
        const { data: newList, error: listError } = await supabase
          .from('lists')
          .insert({
            name: 'History',
            description: 'Watched titles',
            is_default: true
          })
          .select()
          .single();

        if (listError) throw listError;
        historyList = newList;
      }

      // Add to history list
      const { error: mapError } = await supabase
        .from('list_entertainment_map')
        .insert({
          list_id: historyList.id,
          entertainment_id: entertainmentId
        });

      if (mapError) throw mapError;

      // Update local state and storage
      const newTitle = { tmdb_id: tmdbId, type };
      const updatedTitles = [...watchedTitles, newTitle];
      setWatchedTitles(updatedTitles);
      localStorage.setItem(WATCHED_TITLES_KEY, JSON.stringify(updatedTitles));

      return true;
    } catch (error) {
      console.error('Error marking as watched:', error);
      return false;
    }
  };

  const removeFromWatched = async (tmdbId: number, type: 'movie' | 'tv') => {
    try {
      // Get the entertainment entry
      const { data: ent } = await supabase
        .from('entertainment')
        .select('id')
        .eq('tmdb_id', tmdbId)
        .eq('type', type)
        .single();

      if (!ent) return false;

      // Get the History list
      const { data: historyList } = await supabase
        .from('lists')
        .select('id')
        .eq('name', 'History')
        .single();

      if (!historyList) return false;

      // Remove from history list
      const { error: removeError } = await supabase
        .from('list_entertainment_map')
        .delete()
        .eq('entertainment_id', ent.id)
        .eq('list_id', historyList.id);

      if (removeError) throw removeError;

      // Update local state and storage
      const updatedTitles = watchedTitles.filter(
        title => !(title.tmdb_id === tmdbId && title.type === type)
      );
      setWatchedTitles(updatedTitles);
      localStorage.setItem(WATCHED_TITLES_KEY, JSON.stringify(updatedTitles));

      return true;
    } catch (error) {
      console.error('Error removing from watched:', error);
      return false;
    }
  };

  return {
    watchedTitles,
    isWatched,
    markAsWatched,
    removeFromWatched,
    isLoading
  };
}; 