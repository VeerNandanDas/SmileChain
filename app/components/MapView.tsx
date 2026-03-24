"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users } from 'lucide-react';

const MapView = () => {
  const [nearbyCount, setNearbyCount] = useState(42);

  useEffect(() => {
    const interval = setInterval(() => {
      setNearbyCount(prev => Math.max(10, prev + Math.floor(Math.random() * 5) - 2));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="smile-card p-4 h-full flex flex-col"
    >
      <h3 className="font-black text-sm mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-blue-500" />
        Smiles in Greater Noida
      </h3>

      {/* OpenStreetMap embed - Greater Noida */}
      <div className="relative flex-1 min-h-[240px] rounded-xl overflow-hidden border border-gray-100">
        <iframe
          title="Greater Noida Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=77.42%2C28.42%2C77.58%2C28.52&layer=mapnik&marker=28.4744,77.5040"
          className="w-full h-full border-0 rounded-xl"
          style={{ minHeight: '240px' }}
          loading="lazy"
        />

        {/* Overlay stats */}
        <div className="absolute bottom-3 left-3 right-3 glass rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-green-500" />
            <span className="text-xs font-bold">{nearbyCount} users</span>
            <span className="text-[10px] text-gray-500">smiling nearby</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-[10px] text-green-600 font-semibold">Live</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapView;
