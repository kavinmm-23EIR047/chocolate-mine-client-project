import React from 'react';

const PureVegLabel = ({ size = 14, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 bg-[#009646] text-white rounded border border-white font-sans shrink-0 shadow-sm select-none ${className}`}
    >
      {/* Dynamic Indian Veg Symbol Square Wrapper */}
      <span
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex items-center justify-center border border-white bg-transparent rounded-[2px] shrink-0"
      >
        {/* Solid White Inner Dot */}
        <span className="w-[50%] h-[50%] bg-white rounded-full" />
      </span>

      {/* Bold Block White Text */}
      <span className="text-[10px] font-black uppercase tracking-wider leading-none">
        Pure Veg.
      </span>
    </span>
  );
};

export default PureVegLabel;