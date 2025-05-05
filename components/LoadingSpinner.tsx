import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...'
}) => {
  const sizeMap = {
    small: 'w-10 h-10',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className={`${sizeMap[size]} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}></div>
      {message && <p className="mt-4 text-slate-300">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
