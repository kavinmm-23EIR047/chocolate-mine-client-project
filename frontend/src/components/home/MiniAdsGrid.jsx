import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const MINI_ADS = [
  {
    img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80',
    label: 'Same Day Delivery',
    sub: 'Same day delivery',
  },
  {
    img: 'https://images.unsplash.com/photo-1548365328-8c6db3220e4c?w=600&q=80',
    label: 'Custom Cakes',
    sub: 'Your design, our craft',
    to: '/custom-cake',
  },
  {
    img: 'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=600&q=80',
    label: 'Fresh Daily',
    sub: 'Baked every morning',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

const MiniAdsGrid = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {MINI_ADS.map((ad, i) => {
        const card = (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={i}
            className="relative rounded-2xl overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all duration-700 bg-white dark:bg-card h-52"
          >
            <img
              src={ad.img}
              alt={ad.label}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              className="absolute inset-0 flex flex-col justify-end p-5"
              style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.8) 0%,transparent 60%)' }}
            >
              <p className="font-bold text-lg text-white drop-shadow-sm">{ad.label}</p>
              <p className="text-[11px] mt-1 text-white/70 font-semibold uppercase tracking-wider">{ad.sub}</p>
            </div>
          </motion.div>
        );
        return ad.to ? (
          <Link key={i} to={ad.to} className="block">
            {card}
          </Link>
        ) : (
          <div key={i}>{card}</div>
        );
      })}
    </section>
  );
};

export default MiniAdsGrid;
