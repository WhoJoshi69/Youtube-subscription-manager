import React, { useEffect, useState } from 'react';
import PlaylistFetcher from './components/PlaylistFetcher';
import VideoGrid from './components/VideoGrid';
import WatchedVideosGrid from './components/WatchedVideosGrid';
import { usePlaylist } from './hooks/usePlaylist';
import { Moon, Sun } from 'lucide-react';

function App() {
  const {
    videos,
    watchedVideos,
    isLoading,
    error,
    fetchPlaylist,
    toggleSelect,
    markAsWatched
  } = usePlaylist();

  const [darkMode, setDarkMode] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="w-full flex justify-end mb-6">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <main className="flex flex-col items-center space-y-10">
          <PlaylistFetcher
            onFetchPlaylist={fetchPlaylist}
            isLoading={isLoading}
            error={error}
          />
          <VideoGrid
            videos={videos}
            onToggleSelect={toggleSelect}
            onMarkAsWatched={markAsWatched}
            isLoading={isLoading}
          />
          {watchedVideos.length > 0 && (
            <WatchedVideosGrid
              videos={watchedVideos}
              onToggleSelect={toggleSelect}
              onMarkAsWatched={markAsWatched}
              isLoading={false}
            />
          )}
        </main>

        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 YouTube Playlist Viewer. This is a demonstration project.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;