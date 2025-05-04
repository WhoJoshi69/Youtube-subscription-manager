"use client";

import { SearchInput } from "../components/ui/SearchInput";

export function SearchDemo() {
  const placeholders = [
    "Search for videos...",
    "Enter a YouTube URL...",
    "Looking for something specific?",
    "Type a keyword to search...",
    "Enter playlist URL...",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Search value:", e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>, value: string) => {
    console.log("Search submitted:", value);
    // Handle your search logic here
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <SearchInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 