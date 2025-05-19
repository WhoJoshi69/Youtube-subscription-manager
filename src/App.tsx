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
import { Routes, Route, useNavigate } from 'react-router-dom';
import Details from './components/Details';
import People from './components/People';
import PersonDetails from './components/PersonDetails';
import Home from './components/Home';
import Lists from './components/Lists';
import Collection from './components/Collection';

type Section = 'playlist' | 'subscriptions' | 'history' | 'trending' | 'people' | 'home' | 'lists';

function App() {
  // Remove global usePlaylist call

  const [darkMode, setDarkMode] = useState(true);
  const [session, setSession] = useState(null);

  // Playlist section state for partial loading
  const [isPartialLoading, setIsPartialLoading] = useState(true);

  // Initialize activeSection from URL or default to 'home'
  const [activeSection, setActiveSection] = useState<Section>(() => {
    const path = window.location.pathname.substring(1);
    return (path === 'home' || path === 'playlist' || path === 'subscriptions' || path === 'history' || path === 'trending' || path === 'people' || path === 'lists') 
      ? path as Section 
      : 'home';
  });

  const navigate = useNavigate();

  // Update URL when section changes
  // Remove setError, error is now local to playlist section
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    navigate(`/${section}`);

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
      if (path.startsWith('tmdb/') || path.startsWith('person/')) {
        // Don't change active section for detail pages
        return;
      }
      if (path === 'playlist' || path === 'subscriptions' || path === 'history' || path === 'trending' || path === 'people' || path === 'home' || path === 'lists') {
        setActiveSection(path as Section);
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

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

  // Partial loading toggle for playlist section
  const togglePartialLoading = () => {
    setIsPartialLoading((prev) => !prev);
    // The actual playlist refresh is handled inside the playlist section
  };

  // Remove handleRemoveFromHistory, setWatchedVideos is now local to playlist section

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
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <Home />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="home"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/home"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <Home />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="home"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/playlist"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <PlaylistSection
                    isPartialLoading={isPartialLoading}
                    setIsPartialLoading={setIsPartialLoading}
                  />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="playlist"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/subscriptions"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <Subscriptions />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="subscriptions"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/trending"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <Trending apiKey={tmdbApiKey} />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="trending"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/tmdb/:type/:id"
          element={<Details apiKey={tmdbApiKey} darkMode={darkMode} onThemeToggle={toggleTheme} />}
        />
        <Route path="/person/:id" element={<PersonDetails apiKey={tmdbApiKey} />} />
        <Route
          path="/people"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <People apiKey={tmdbApiKey} />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="people"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/lists"
          element={
            <div>
              <Header
                darkMode={darkMode}
                onThemeToggle={toggleTheme}
                isPartialLoading={isPartialLoading}
                onPartialLoadingToggle={togglePartialLoading}
              />
              <div className="container mx-auto px-4 sm:px-6 py-6">
                <main className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                  <Lists apiKey={tmdbApiKey} />
                </main>
                <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>© 2025 WhoJoshi Subscription Manager</p>
                </footer>
              </div>
              <Navigation 
                activeSection="lists"
                onSectionChange={handleSectionChange}
              />
            </div>
          }
        />
        <Route
          path="/collection/:id"
          element={<Collection apiKey={tmdbApiKey} darkMode={darkMode} onThemeToggle={toggleTheme} />}
        />
      </Routes>
    </GradientLayout>
  );
}

// Move usePlaylist and all playlist logic into a dedicated component
function PlaylistSection({
  isPartialLoading,
  setIsPartialLoading,
}: {
  isPartialLoading: boolean;
  setIsPartialLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const {
    videos,
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
    currentPlaylistUrl,
  } = usePlaylist();

  // Toggle partial loading and refresh playlist if needed
  const handlePartialLoadingToggle = () => {
    setIsPartialLoading((prev) => !prev);
    if (currentPlaylistUrl) {
      setTimeout(() => {
        fetchPlaylist(currentPlaylistUrl, true);
      }, 50);
    }
  };

  // Remove from history handler (if needed elsewhere, can be lifted)
  const handleRemoveFromHistory = (videoIds: string[]) => {
    setWatchedVideos((prev: any[]) => prev.filter((video: any) => !videoIds.includes(video.id)));
  };

  return (
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
  );
}

export default App;