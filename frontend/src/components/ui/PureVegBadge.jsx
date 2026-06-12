import React from 'react';

const PureVegLabel = ({ size = 12, className = '', hideText = false }) => {
  return (
    <span
      className={`inline-flex items-center ${hideText ? '' : 'gap-1.5 px-2 py-0.5'} bg-white text-[#008539] rounded ${hideText ? '' : 'border border-[#008539]/20 shadow-sm'} font-sans shrink-0 select-none ${className}`}
    >
      {/* Official FSSAI Veg Symbol: Green Square with Green Dot on White Background */}
      <span
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex items-center justify-center border-2 border-[#008539] bg-white rounded-[2px] shrink-0 p-[2px]"
      >
        {/* Solid Green Inner Dot */}
        <span className="w-full h-full bg-[#008539] rounded-full" />
      </span>

      {/* Bold Block Text */}
      {!hideText && (
        <span className="text-[9px] font-black uppercase tracking-wider leading-none">
          Pure Veg
        </span>
      )}
    </span>
  );
};

export default PureVegLabel;