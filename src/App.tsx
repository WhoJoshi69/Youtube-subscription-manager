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

type Section = 'playlist' | 'subscriptions' | 'history';

function App() {
  const {
    videos,
    watchedVideos,
    isLoading,
    error,
    fetchPlaylist,
    toggleSelect,
    handleSelectAll,
    markAsWatched,
    setWatchedVideos
  } = usePlaylist();

  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(null);

  // Initialize activeSection from URL or default to 'playlist'
  const [activeSection, setActiveSection] = useState<Section>(() => {
    // Get the path from the URL (removing the leading slash)
    const path = window.location.pathname.substring(1);
    // Check if it's a valid section
    return (path === 'playlist' || path === 'subscriptions' || path === 'history') 
      ? path as Section 
      : 'playlist';
  });

  // Update URL when section changes
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    // Update the URL without full page reload
    window.history.pushState({}, '', `/${section}`);
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      if (path === 'playlist' || path === 'subscriptions' || path === 'history') {
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

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-black dark:to-gray-900 text-gray-900 dark:text-white">
      <Header
        darkMode={darkMode}
        onThemeToggle={toggleTheme}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
          {activeSection === 'playlist' ? (
            <>
              <PlaylistFetcher
                onFetchPlaylist={fetchPlaylist}
                isLoading={isLoading}
                error={error}
              />
              <VideoGrid
                videos={videos}
                onToggleSelect={toggleSelect}
                onSelectAll={handleSelectAll}
                onMarkAsWatched={markAsWatched}
                isLoading={isLoading}
              />
            </>
          ) : activeSection === 'subscriptions' ? (
            <Subscriptions />
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
    </div>
  );
}

export default App;