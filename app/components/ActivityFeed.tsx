"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';

interface FeedItem {
  id: string;
  message: string;
  timestamp: Date;
}

const MOCK_NAMES = ['Aman', 'Priya', 'Harshit', 'Sana', 'Raj', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya'];
const MOCK_EVENTS = [
  (name: string) => `🎉 ${name} just earned 0.001 USDC`,
  (name: string) => `😄 ${name} scored 5/5 on their smile!`,
  (name: string) => `🔥 ${name} reached a 3-day streak`,
  (name: string) => `⬆️ ${name} leveled up to Level 2`,
  (name: string) => `📸 ${name} captured a winning smile`,
  (name: string) => `🏆 ${name} unlocked "10 Smiles" badge`,
  (name: string) => `💝 ${name} funded the smile treasury`,
  (name: string) => `😊 ${name} smiled back at a photo`,
];

const generateMockItem = (): FeedItem => {
  const name = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
  const event = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)];
  return {
    id: `${Date.now()}-${Math.random()}`,
    message: event(name),
    timestamp: new Date(),
  };
};

const timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
};

interface ActivityFeedProps {
  realEvents?: FeedItem[];
}

const ActivityFeed = ({ realEvents = [] }: ActivityFeedProps) => {
  const [items, setItems] = useState<FeedItem[]>(() => {
    // Seed with 5 initial items
    return Array.from({ length: 5 }, () => ({
      ...generateMockItem(),
      timestamp: new Date(Date.now() - Math.random() * 300000),
    }));
  });

  // Merge real events
  useEffect(() => {
    if (realEvents.length > 0) {
      setItems(prev => [...realEvents, ...prev].slice(0, 15));
    }
  }, [realEvents]);

  // Auto-generate mock events
  useEffect(() => {
    const interval = setInterval(() => {
      setItems(prev => [generateMockItem(), ...prev].slice(0, 15));
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="smile-card p-5"
    >
      <h3 className="font-black text-lg mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-green-500" />
        Live Activity
        <span className="relative flex h-2 w-2 ml-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </h3>

      <div className="space-y-1 max-h-[320px] overflow-y-auto pr-1">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="feed-item px-3 py-2.5 rounded-xl"
            >
              <p className="text-sm font-medium">{item.message}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(item.timestamp)}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ActivityFeed;
