import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { VideoSearch } from './VideoSearch';
import SpecialVideoGrid from './SpecialVideoGrid';
import PasswordProtection from './PasswordProtection';

interface SpecialVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  source_url: string;
  upload_date: string;
  page_url: string;
  watched: boolean;
  selected: boolean;
}

const CORRECT_PASSWORD = 'noice';

const Special: React.FC = () => {
  const [videos, setVideos] = useState<SpecialVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [allVideos, setAllVideos] = useState<SpecialVideo[]>([]); // Store all videos
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fetch videos only once when component mounts
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('pvideos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      const formattedVideos = data.map(video => ({
        ...video,
        selected: false,
      }));

      setAllVideos(formattedVideos); // Store all videos
      setVideos(formattedVideos); // Initially show all videos
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Only fetch videos when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchVideos();
    }
  }, [isAuthenticated, fetchVideos]);

  // Filter videos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setVideos(allVideos);
      return;
    }

    const filtered = allVideos.filter(video =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setVideos(filtered);
  }, [searchQuery, allVideos]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleToggleSelect = (videoId: string) => {
    setVideos(prevVideos =>
      prevVideos.map(video => ({
        ...video,
        selected: video.id === videoId ? !video.selected : video.selected,
      }))
    );
    // Also update allVideos
    setAllVideos(prevVideos =>
      prevVideos.map(video => ({
        ...video,
        selected: video.id === videoId ? !video.selected : video.selected,
      }))
    );
  };

  const handleSelectAll = (videoIds: string[]) => {
    setVideos(prevVideos =>
      prevVideos.map(video => ({
        ...video,
        selected: videoIds.includes(video.id),
      }))
    );
    // Also update allVideos
    setAllVideos(prevVideos =>
      prevVideos.map(video => ({
        ...video,
        selected: videoIds.includes(video.id),
      }))
    );
  };

  const handleMarkAsWatched = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('pvideos')
        .update({ watched: true })
        .eq('id', videoId);

      if (error) {
        console.error('Error marking video as watched:', error);
        return;
      }

      // Update both videos and allVideos states
      const updateVideos = (prevVideos: SpecialVideo[]) =>
        prevVideos.map(video => ({
          ...video,
          watched: video.id === videoId ? true : video.watched,
          selected: video.id === videoId ? false : video.selected,
        }));

      setVideos(updateVideos);
      setAllVideos(updateVideos);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('pvideos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        return;
      }

      // Update both videos and allVideos states
      const updateVideos = (prevVideos: SpecialVideo[]) =>
        prevVideos.filter(video => video.id !== videoId);

      setVideos(updateVideos);
      setAllVideos(updateVideos);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <PasswordProtection
        onCorrectPassword={() => setIsAuthenticated(true)}
        correctPassword={CORRECT_PASSWORD}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Special Videos</h1>
      
      <VideoSearch onSearch={handleSearch} />
      
      <SpecialVideoGrid
        videos={videos}
        isLoading={isLoading}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onMarkAsWatched={handleMarkAsWatched}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Special;