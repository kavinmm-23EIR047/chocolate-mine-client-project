import React from 'react';
import { Egg } from 'lucide-react';

const EgglessBadge = ({ className = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-light px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-success ${className}`}>
      <Egg size={14} />
      Eggless
    </span>
  );
};

export default EgglessBadge;
