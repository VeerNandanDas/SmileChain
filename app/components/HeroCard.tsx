"use client";

import { motion } from 'framer-motion';
import { Flame, Zap, Trophy, Coins } from 'lucide-react';

interface HeroCardProps {
  totalSmiles: number;
  streak: number;
  level: number;
  xp: number;
  xpToNext: number;
  totalRewards: string;
  authenticated: boolean;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Newbie Smiler',
  2: 'Happy Face',
  3: 'Grin Master',
  4: 'Joy Spreader',
  5: 'Smile Champion',
  6: 'Radiant Soul',
  7: 'Bliss Bringer',
  8: 'Euphoria King',
  9: 'Smile Legend',
  10: 'Pro Smiler 👑',
};

const HeroCard = ({ totalSmiles, streak, level, xp, xpToNext, totalRewards, authenticated }: HeroCardProps) => {
  const xpProgress = xpToNext > 0 ? Math.min((xp / xpToNext) * 100, 100) : 0;
  const levelTitle = LEVEL_TITLES[Math.min(level, 10)] || LEVEL_TITLES[10];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="smile-card p-6 md:p-8 mb-8 overflow-hidden relative"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 via-green-50 to-blue-50 opacity-60 pointer-events-none" />

      <div className="relative z-10">
        {/* Title */}
        <div className="text-center mb-6">
          <motion.h1
            className="text-3xl md:text-4xl font-black mb-2"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            Hi, I'm Mr. Based Smiles{' '}
            <motion.span
              className="inline-block"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              😄
            </motion.span>
          </motion.h1>
          <p className="text-gray-500 font-medium">
            Smile and earn 0.001{' '}
            <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="inline h-4 w-4 mb-0.5" />{' '}
            on{' '}
            <img src="https://avatars.githubusercontent.com/u/108554348?v=4" alt="Base" className="inline h-4 w-4 mb-0.5 rounded-full" />
          </p>
        </div>

        {/* Stats Grid */}
        {authenticated && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white/70 rounded-2xl p-4 text-center border border-gray-100"
            >
              <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500 animate-fire" />
              <p className="text-2xl font-black">{streak}</p>
              <p className="text-xs text-gray-500 font-medium">Day Streak</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white/70 rounded-2xl p-4 text-center border border-gray-100"
            >
              <Zap className="h-5 w-5 mx-auto mb-1 text-purple-500" />
              <p className="text-2xl font-black">{totalSmiles}</p>
              <p className="text-xs text-gray-500 font-medium">Total Smiles</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white/70 rounded-2xl p-4 text-center border border-gray-100"
            >
              <Trophy className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-black">Lv.{level}</p>
              <p className="text-xs text-gray-500 font-medium">{levelTitle}</p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-white/70 rounded-2xl p-4 text-center border border-gray-100"
            >
              <Coins className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-black">{totalRewards}</p>
              <p className="text-xs text-gray-500 font-medium">USDC Earned</p>
            </motion.div>
          </div>
        )}

        {/* XP Progress */}
        {authenticated && (
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
              <span>Level {level}</span>
              <span>{xp}/{xpToNext} XP</span>
            </div>
            <div className="progress-track h-3">
              <motion.div
                className="progress-fill h-full"
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HeroCard;
