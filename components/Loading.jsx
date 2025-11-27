import React from 'react';

const Loading = ({ size = 'default', className = '' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className="relative" style={{ width: sizeClasses[size], height: sizeClasses[size] }}>
        {/* Outer spinning ring */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-primary/20 rounded-full`}
        ></div>
        {/* Spinning arc */}
        <div 
          className={`absolute inset-0 ${sizeClasses[size]} border-4 border-transparent border-t-primary border-r-primary rounded-full animate-spin`}
          style={{ animationDuration: '1s' }}
        ></div>
        {/* Inner spinning ring - reverse */}
        <div 
          className={`absolute inset-2 ${size === 'small' ? 'h-4 w-4' : size === 'large' ? 'h-10 w-10' : 'h-6 w-6'} border-2 border-transparent border-b-primary/60 border-l-primary/60 rounded-full animate-spin`}
          style={{ animationDuration: '0.6s', animationDirection: 'reverse' }}
        ></div>
      </div>
    </div>
  );
};

export default Loading;

