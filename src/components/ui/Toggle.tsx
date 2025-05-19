import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  options: [string, string];
  value: string;
  onChange: (value: string) => void;
  icons?: [React.ReactNode, React.ReactNode];
}

const Toggle: React.FC<ToggleProps> = ({ options, value, onChange, icons }) => {
  return (
    <div className="relative flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
      {options.map((option, index) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className="relative z-10 px-4 py-1.5 text-sm font-medium transition-colors duration-200"
        >
          <span className={`flex items-center gap-2 ${
            value === option 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {icons?.[index]}
            {option}
          </span>
          {value === option && (
            <motion.div
              layoutId="toggleBackground"
              className="absolute inset-0 bg-red-600 rounded-md"
              style={{ zIndex: -1 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default Toggle; 