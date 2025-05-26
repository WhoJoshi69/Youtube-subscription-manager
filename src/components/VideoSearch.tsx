import React, { useState } from 'react';
import { SearchInput } from './ui/SearchInput';

interface VideoSearchProps {
  onSearch: (query: string) => void;
}

export const VideoSearch: React.FC<VideoSearchProps> = ({ onSearch }) => {
  const [searchValue, setSearchValue] = useState('');
  
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Optionally trigger search on each change
    onSearch(value);
  };

  return (
    <div className="mb-6">
      <SearchInput
        placeholders={placeholders}
        value={searchValue}
        onChange={handleChange}
        onSubmit={handleSubmit}
        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
      />
    </div>
  );
}; 