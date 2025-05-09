import React, { useEffect, useState } from 'react';
import PlaylistFetcher from './components/PlaylistFetcher';
import VideoGrid from './components/VideoGrid';
import WatchedVideosGrid from './components/WatchedVideosGrid';
import { usePlaylist } from './hooks/usePlaylist';
import { Moon, Sun, Youtube } from 'lucide-react';
import Subscriptions from './components/Subscriptions';
import History from './components/History';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { migrateWatchHistory } from './utils/migrateHistory';
import Header from './components/Header';
import './styles/logo.css';
import Trending from './components/Trending';
import { GradientLayout } from './components/Layout/GradientLayout';
import { Navigation } from './components/Navigation';

type Section = 'playlist' | 'subscriptions' | 'history' | 'trending';

function App() {
  const {
    videos,
    watchedVideos,
    isLoading,
    isLoadingMore,
    hasMoreVideos,
    error,
    fetchPlaylist,
    loadMoreVideos,
    toggleSelect,
    handleSelectAll,
    markAsWatched,
    setWatchedVideos,
    isPartialLoading,
    setIsPartialLoading,
    currentPlaylistUrl
  } = usePlaylist();

  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(null);

  // Initialize activeSection from URL or default to 'playlist'
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const path = window.location.pathname.substring(1);
    return (path === 'playlist' || path === 'subscriptions' || path === 'history' || path === 'trending') 
      ? path as Section 
      : 'playlist';
  });

  // Update URL when section changes
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    
    // Clear any existing errors when switching sections
    setError(null);
    
    // If switching to subscriptions, trigger a refresh
    if (section === 'subscriptions') {
      // We'll add a small delay to ensure the component is mounted
      setTimeout(() => {
        const event = new StorageEvent('storage', {
          key: 'youtube_watch_history'
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      if (path === 'playlist' || path === 'subscriptions' || path === 'history' || path === 'trending') {
        setActiveSection(path as Section);
      } else {
        setActiveSection('playlist');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check for preferred color scheme
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  // Apply dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const togglePartialLoading = () => {
    setIsPartialLoading(!isPartialLoading);
    
    // If we have a current playlist URL, refresh the playlist with the new setting
    if (currentPlaylistUrl) {
      // Small delay to ensure the state has updated
      setTimeout(() => {
        fetchPlaylist(currentPlaylistUrl, true);
      }, 50);
    }
  };

  const handleRemoveFromHistory = (videoIds: string[]) => {
    setWatchedVideos(prev => prev.filter(video => !videoIds.includes(video.id)));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Run migration when user is authenticated
        migrateWatchHistory().catch(console.error);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Remove the tmdbApiKey state since we'll use the environment variable
  const tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;

  if (!session) {
    return (
      <GradientLayout darkMode={darkMode}>
        <Auth />
      </GradientLayout>
    );
  }

  return (
    <GradientLayout darkMode={darkMode}>
      <div>
        <Header
          darkMode={darkMode}
          onThemeToggle={toggleTheme}
          isPartialLoading={isPartialLoading}
          onPartialLoadingToggle={togglePartialLoading}
        />
        
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
            {activeSection === 'playlist' ? (
              <>
                <PlaylistFetcher
                  onFetchPlaylist={(url) => fetchPlaylist(url, true)}
                  isLoading={isLoading}
                  error={error}
                />
                <VideoGrid
                  videos={videos}
                  onToggleSelect={toggleSelect}
                  onSelectAll={handleSelectAll}
                  onMarkAsWatched={markAsWatched}
                  isLoading={isLoading}
                  isLoadingMore={isLoadingMore}
                  hasMoreVideos={hasMoreVideos}
                  onLoadMore={loadMoreVideos}
                />
              </>
            ) : activeSection === 'subscriptions' ? (
              <Subscriptions />
            ) : activeSection === 'trending' ? (
              <Trending apiKey={tmdbApiKey} />
            ) : (
              <History
                watchedVideos={watchedVideos}
                onToggleSelect={toggleSelect}
                onSelectAll={handleSelectAll}
                onRemoveFromHistory={handleRemoveFromHistory}
                isLoading={isLoading}
              />
            )}
          </main>

          <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2024 WhoJoshi Subscription Manager</p>
          </footer>
        </div>

        <Navigation 
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
    </GradientLayout>
  );
}

export default App;