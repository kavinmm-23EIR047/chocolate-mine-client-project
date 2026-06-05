import React from 'react';
import PureVegIcon from '../../assets/pure veg.webp';

const PureVegBadge = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-light px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-success ${className}`}>
      <img src={PureVegIcon} alt="Pure Veg" className="w-3.5 h-3.5 object-contain" />
      Pure Veg
    </span>
  );
};

export default PureVegBadge;
