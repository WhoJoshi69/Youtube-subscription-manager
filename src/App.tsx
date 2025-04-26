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
  const [activeSection, setActiveSection] = useState<'playlist' | 'subscriptions' | 'history'>('playlist');
  const [session, setSession] = useState(null);

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
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white">
      <div className="container mx-auto px-6 sm:px-8 py-8 max-w-7xl">
        <header className="w-full flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Youtube size={24} className="text-red-600" />
              <h1 className="text-xl font-bold">WhoJoshi Subscription Manager</h1>
            </div>
            <div className="flex gap-2 ml-8">
              <button
                onClick={() => setActiveSection('playlist')}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeSection === 'playlist'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActiveSection('subscriptions')}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeSection === 'subscriptions'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => setActiveSection('history')}
                className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
                  activeSection === 'history'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                History
              </button>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        <main className="flex flex-col items-center space-y-8">
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