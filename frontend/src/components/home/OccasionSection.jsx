import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDeliveryLocation } from '../../context/LocationContext';
import api from '../../utils/api';

const OccasionSection = () => {
  const [occasions, setOccasions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location: deliveryCity } = useDeliveryLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const occasionRes = await api.get('/occasions?activeOnly=true');
        setOccasions(occasionRes.data.data || []);
      } catch (error) {
        console.error('Error fetching occasion data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [deliveryCity]);

  const handleOccasionClick = (occasionName) => {
    const slug = occasionName.toLowerCase().replace(/\s+/g, '-');
    navigate(`/occasion/${slug}`);
  };

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-12">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-heading mb-3 tracking-tighter uppercase">
            Shop By Occasions
          </h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-xs text-muted uppercase tracking-widest mt-4">
            Find the perfect gift for every moment
          </p>
        </div>

        {/* Occasion Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-muted/20 rounded-2xl" />
                <div className="h-8 bg-muted/20 rounded-full w-3/4 mx-auto mt-4" />
              </div>
            ))
          ) : (
            occasions.map((occ, idx) => (
              <motion.div
                key={occ._id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.5 }}
                onClick={() => handleOccasionClick(occ.label || occ.name)}
                className="group cursor-pointer"
              >
                {/* Image Container */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/5] shadow-md group-hover:shadow-xl transition-all duration-500">
                  <img
                    src={occ.image}
                    alt={occ.label || occ.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Dark overlay on hover */}
                  <div className="absolute inset-0 bg-footer/0 group-hover:bg-footer/20 transition-colors duration-500" />
                </div>
                
                {/* Title */}
                <div className="text-center mt-4">
                  <h3 className="text-sm sm:text-base font-black text-heading uppercase tracking-wider group-hover:text-primary transition-colors">
                    {occ.label || occ.name}
                  </h3>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Optional: View All Button */}
        {occasions.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/shop')}
              className="px-8 py-3 rounded-full border-2 border-primary text-primary font-black text-xs uppercase tracking-wider hover:bg-primary hover:text-button-text transition-all duration-300 shadow-soft"
            >
              Explore All Occasions
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default OccasionSection;