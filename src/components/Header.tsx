import React from 'react';
import { Youtube, Moon, Sun, List, ListEnd } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  darkMode: boolean;
  onThemeToggle: () => void;
  isPartialLoading?: boolean;
  onPartialLoadingToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  onThemeToggle,
  isPartialLoading,
  onPartialLoadingToggle
}) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/home');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-sm rounded-b-2xl">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="p-2 rounded-xl bg-red-50/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <i className="fi fi-sr-world text-2xl text-red-600"></i>
            </div>
            <button 
              onClick={handleLogoClick}
              className="px-6 py-2 bg-black text-white rounded-lg font-bold transform hover:-translate-y-1 transition duration-400 ml-2 hidden sm:block hover:bg-gray-800"
            >
              WhoJoshi
            </button>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {onPartialLoadingToggle && (
              <button
                onClick={onPartialLoadingToggle}
                className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm group relative"
                aria-label="Toggle loading mode"
              >
                {isPartialLoading ? (
                  <List size={20} className="text-gray-700 dark:text-gray-300" />
                ) : (
                  <ListEnd size={20} className="text-gray-700 dark:text-gray-300" />
                )}
                {/* Tooltip */}
                <span className="absolute -bottom-12 left-50 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {isPartialLoading ? 'Partial Loading: On' : 'Partial Loading: Off'}
                </span>
              </button>
            )}
            
            <button
              onClick={onThemeToggle}
              className="p-2.5 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors backdrop-blur-sm"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={20} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon size={20} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 