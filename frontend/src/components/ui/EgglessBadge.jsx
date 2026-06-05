import React from 'react';

const EgglessIcon = ({ size = 20, className = '' }) => {
  return (
    <svg
      style={{ width: `${size * 0.85}px`, height: `${size}px` }}
      viewBox="0 0 20 24"
      fill="none"
      xmlns="http://www.w3.org/2000/s"
      className={`inline-block shrink-0 text-[#54382B] dark:text-[#EED4C5] ${className}`}
    >
      {/* <path
        d="M10 2C5.5 2 3.5 7.5 3.5 13C3.5 18.5 6.5 22 10 22C13.5 22 16.5 18.5 16.5 13C16.5 7.5 14.5 2 10 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      /> */}
    </svg>
  );
};

export default EgglessIcon;