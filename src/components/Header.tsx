import React, { useState } from 'react';
import { Youtube, Menu, X, Search, Moon, Sun } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onThemeToggle: () => void;
  activeSection: 'playlist' | 'subscriptions' | 'history';
  onSectionChange: (section: 'playlist' | 'subscriptions' | 'history') => void;
}

const Header: React.FC<HeaderProps> = ({
  darkMode,
  onThemeToggle,
  activeSection,
  onSectionChange
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'playlist', label: 'Playlists' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'history', label: 'History' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Youtube size={28} className="text-red-600" />
            <h1 className="ml-2 text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              WhoJoshi
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeSection === item.id
                    ? 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'
                  }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {darkMode ? (
                <Sun size={20} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Moon size={20} className="text-gray-700" />
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Open menu"
            >
              {isMobileMenuOpen ? (
                <X size={20} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu size={20} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`block w-full px-3 py-2 rounded-md text-base font-medium transition-colors
                    ${activeSection === item.id
                      ? 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-500'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 