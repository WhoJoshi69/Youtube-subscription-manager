import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  light?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  className = '',
  light = false
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        border-t-transparent 
        ${light ? 'border-white' : 'border-red-600'} 
        animate-spin 
        ${className}
      `}
    />
  );
};

export default Loader; 