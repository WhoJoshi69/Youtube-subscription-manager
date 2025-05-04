import React from 'react';
import { SearchInput } from './ui/SearchInput';

interface VideoSearchProps {
  onSearch: (query: string) => void;
}

export const VideoSearch: React.FC<VideoSearchProps> = ({ onSearch }) => {
  const placeholders = [
    "Search in videos...",
    "Filter by title...",
    "Looking for a specific video?",
    "Type to search videos...",
    "Search your playlist..."
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, value: string) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <div className="mb-6">
      <SearchInput
        placeholders={placeholders}
        onSubmit={handleSubmit}
        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
      />
    </div>
  );
}; 