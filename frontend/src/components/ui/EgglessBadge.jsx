import React from 'react';

const EgglessIcon = ({ size = 14, className = '', hideText = false }) => {
  return (
    <span
      className={`inline-flex items-center ${hideText ? '' : 'gap-1.5 px-2 py-0.5'} bg-white text-[#D97706] rounded ${hideText ? '' : 'border border-[#D97706]/20 shadow-sm'} font-sans shrink-0 select-none ${className}`}
    >
      {/* Group: Official FSSAI Veg Dot Style + Egg Icon */}
      <div className="flex items-center shrink-0">
        <span
          style={{ width: `${size}px`, height: `${size}px` }}
          className="flex items-center justify-center border-2 border-[#D97706] bg-white rounded-[2px] shrink-0 p-[1.5px]"
        >
          {/* Yellow Egg Shape */}
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 2C8.686 2 6 6.477 6 12c0 4.418 2.686 10 6 10s6-5.582 6-10c0-5.523-2.686-10-6-10z" />
          </svg>
        </span>
      </div>

      {/* Premium Compact Typography */}
      {!hideText && (
        <span className="text-[9px] font-black uppercase tracking-wider leading-none">
          Eggless
        </span>
      )}
    </span>
  );
};

export default EgglessIcon;