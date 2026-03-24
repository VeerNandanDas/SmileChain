"use client";

import { motion } from 'framer-motion';
import { Award, Flame, Star, Smile, Shield, Zap } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  unlocked: boolean;
}

interface UserStatsPanelProps {
  totalSmiles: number;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalRewards: string;
}

const getBadges = (totalSmiles: number, streak: number): Badge[] => [
  {
    id: 'first-smile',
    name: 'First Smile',
    icon: <Smile className="h-5 w-5" />,
    description: 'Captured your first smile',
    unlocked: totalSmiles >= 1,
  },
  {
    id: '10-smiles',
    name: '10 Smiles',
    icon: <Star className="h-5 w-5" />,
    description: 'Captured 10 smiles',
    unlocked: totalSmiles >= 10,
  },
  {
    id: '50-smiles',
    name: 'Smile Machine',
    icon: <Zap className="h-5 w-5" />,
    description: 'Captured 50 smiles',
    unlocked: totalSmiles >= 50,
  },
  {
    id: '7-day-streak',
    name: '7-Day Streak',
    icon: <Flame className="h-5 w-5" />,
    description: 'Smiled 7 days in a row',
    unlocked: streak >= 7,
  },
  {
    id: 'pro-smiler',
    name: 'Pro Smiler',
    icon: <Award className="h-5 w-5" />,
    description: 'Reached Level 5',
    unlocked: false, // computed from level in parent
  },
  {
    id: 'guardian',
    name: 'Smile Guardian',
    icon: <Shield className="h-5 w-5" />,
    description: 'Funded the smile treasury',
    unlocked: false,
  },
];

const UserStatsPanel = ({ totalSmiles, streak, level, xp, xpToNext, totalRewards }: UserStatsPanelProps) => {
  const badges = getBadges(totalSmiles, streak);
  // Unlock pro-smiler badge based on level
  const badgesWithLevel = badges.map(b =>
    b.id === 'pro-smiler' ? { ...b, unlocked: level >= 5 } : b
  );
  const unlockedCount = badgesWithLevel.filter(b => b.unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="smile-card p-5 mb-8"
    >
      <h3 className="font-black text-lg mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-yellow-500" />
        Achievements
        <span className="text-sm font-medium text-gray-400 ml-auto">{unlockedCount}/{badgesWithLevel.length}</span>
      </h3>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {badgesWithLevel.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * i }}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl text-center transition-all ${
              badge.unlocked
                ? 'bg-gradient-to-b from-yellow-50 to-green-50 border border-yellow-200'
                : 'bg-gray-50 border border-gray-100 opacity-40'
            }`}
            title={badge.description}
          >
            <div className={`p-2 rounded-full ${badge.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
              {badge.icon}
            </div>
            <span className="text-[10px] font-bold leading-tight">{badge.name}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default UserStatsPanel;
