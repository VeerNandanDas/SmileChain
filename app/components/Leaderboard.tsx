"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Crown, Activity } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  smiles: number;
  rewards: string;
  isCurrentUser?: boolean;
}

interface FeedItem {
  id: string;
  message: string;
  timestamp: Date;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
}

const TABS = ['Leaderboard', 'Live Activity'] as const;
const TIME_FILTERS = ['Daily', 'Weekly', 'All-time'] as const;

const MOCK_NAMES = ['Aman', 'Priya', 'Harshit', 'Sana', 'Raj', 'Ananya', 'Vikram', 'Meera', 'Arjun', 'Kavya'];
const MOCK_EVENTS = [
  (n: string) => `🎉 ${n} just earned 0.001 USDC`,
  (n: string) => `😄 ${n} scored 5/5 on their smile!`,
  (n: string) => `🔥 ${n} hit a 3-day streak`,
  (n: string) => `⬆️ ${n} leveled up!`,
  (n: string) => `📸 ${n} captured a winning smile`,
  (n: string) => `🏆 ${n} unlocked a badge`,
  (n: string) => `💝 ${n} funded the treasury`,
  (n: string) => `😊 ${n} smiled back at a photo`,
];

const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, username: 'Harshit', smiles: 87, rewards: '0.042' },
  { rank: 2, username: 'Aman', smiles: 65, rewards: '0.031' },
  { rank: 3, username: 'Priya', smiles: 52, rewards: '0.024' },
  { rank: 4, username: 'Vikram', smiles: 41, rewards: '0.019' },
  { rank: 5, username: 'Ananya', smiles: 38, rewards: '0.016' },
  { rank: 6, username: 'Raj', smiles: 29, rewards: '0.012' },
  { rank: 7, username: 'Sana', smiles: 22, rewards: '0.008' },
  { rank: 8, username: 'Kavya', smiles: 15, rewards: '0.005' },
];

const generateMockItem = (): FeedItem => ({
  id: `${Date.now()}-${Math.random()}`,
  message: MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)](MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)]),
  timestamp: new Date(),
});

const timeAgo = (date: Date): string => {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
  return <span className="text-xs font-bold text-gray-400">#{rank}</span>;
};

const Leaderboard = ({ entries }: LeaderboardProps) => {
  const [mainTab, setMainTab] = useState<typeof TABS[number]>('Leaderboard');
  const [timeFilter, setTimeFilter] = useState<typeof TIME_FILTERS[number]>('All-time');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Initialize feed items client-side only (fewer items to keep it clean)
  useEffect(() => {
    setFeedItems(Array.from({ length: 3 }, () => ({
      ...generateMockItem(),
      timestamp: new Date(Date.now() - Math.random() * 120000),
    })));
  }, []);

  // Auto-generate new feed items (slower, fewer)
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedItems(prev => [generateMockItem(), ...prev].slice(0, 8));
    }, 8000 + Math.random() * 7000);
    return () => clearInterval(interval);
  }, []);

  // Merge real entries with seed data so the board is never empty
  const allEntries = entries.length > 0 ? entries : SEED_LEADERBOARD;

  const getFilteredEntries = () => {
    switch (timeFilter) {
      case 'Daily': return allEntries.slice(0, 5).map((e, i) => ({ ...e, smiles: Math.max(1, Math.floor(e.smiles / 30)), rank: i + 1 }));
      case 'Weekly': return allEntries.slice(0, 7).map((e, i) => ({ ...e, smiles: Math.max(1, Math.floor(e.smiles / 4)), rank: i + 1 }));
      default: return allEntries;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="smile-card p-4 h-full flex flex-col"
    >
      {/* Main Tabs: Leaderboard / Live Activity */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-3">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setMainTab(tab)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mainTab === tab ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab === 'Leaderboard' ? <Trophy className="h-3.5 w-3.5" /> : <Activity className="h-3.5 w-3.5" />}
            {tab}
            {tab === 'Live Activity' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* === Leaderboard Tab === */}
      {mainTab === 'Leaderboard' && (
        <>
          {/* Time filter */}
          <div className="flex gap-1 bg-gray-50 rounded-lg p-0.5 mb-3">
            {TIME_FILTERS.map(t => (
              <button key={t} onClick={() => setTimeFilter(t)}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                  timeFilter === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-0.5 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {getFilteredEntries().map((entry, i) => (
                <motion.div key={`${timeFilter}-${entry.rank}`}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl leaderboard-row ${entry.isCurrentUser ? 'current-user' : ''}`}>
                  <div className="w-6 flex justify-center">{getRankIcon(entry.rank)}</div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-200 to-blue-200 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">
                      {entry.username}
                      {entry.isCurrentUser && <span className="text-[10px] text-green-500 ml-1">(You)</span>}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-black">{entry.smiles} 😊</p>
                    <p className="text-[9px] text-gray-400">{entry.rewards} USDC</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {getFilteredEntries().length === 0 && (
              <p className="text-center text-gray-400 py-6 text-xs">No data yet. Start smiling!</p>
            )}
          </div>
        </>
      )}

      {/* === Live Activity Tab === */}
      {mainTab === 'Live Activity' && (
        <div className="space-y-0.5 flex-1 overflow-y-auto">
          <AnimatePresence initial={false}>
            {feedItems.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="feed-item px-3 py-2 rounded-xl">
                <p className="text-xs font-medium">{item.message}</p>
                <p className="text-[9px] text-gray-400 mt-0.5">{timeAgo(item.timestamp)}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default Leaderboard;
