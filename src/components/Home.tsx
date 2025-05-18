import React from 'react';
import { BackgroundLines } from "./ui/BackgroundLines";

const Home: React.FC = () => {
  return (
    <BackgroundLines>
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-4xl md:text-6xl font-bold text-center text-gray-900 dark:text-white mb-4">
          Welcome to Darshi's Place
        </h1>
        <p className="text-lg md:text-2xl text-center text-gray-700 dark:text-gray-300">
          Your cozy corner for YouTube watching and discovery. Enjoy the vibes!
        </p>
      </div>
    </BackgroundLines>
  );
};

export default Home;
