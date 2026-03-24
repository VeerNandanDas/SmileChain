"use client";

import { motion } from 'framer-motion';
import { Wallet, LogOut, Smile } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

const Navbar = () => {
  const { login, authenticated, logout, user } = usePrivy();

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 glass px-4 py-3"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-2xl"
          >
            😁
          </motion.span>
          <span className="font-black text-lg tracking-tight">SmileChain</span>
        </div>

        {/* Wallet Status */}
        <div className="flex items-center gap-3">
          {authenticated ? (
            <>
              <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">
                  {user?.wallet?.address ? truncateAddress(user.wallet.address) : 'Connected'}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-full hover:bg-red-50 transition-colors"
                title="Disconnect"
              >
                <LogOut className="h-4 w-4 text-gray-500" />
              </button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={login}
              className="flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white px-5 py-2.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg transition-shadow"
            >
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
