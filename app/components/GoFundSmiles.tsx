"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ethers } from 'ethers';
import { Heart, Sparkles, PartyPopper } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { Modal } from "./ui/modal";
import { toast } from 'sonner';

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const RECIPIENT_ADDRESS = "0xf5526Ff322FBE97c31160A94A380093151Aa442F";
const USDC_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];
const PRESETS = ['0.5', '1', '5', '10'];

interface GoFundSmilesProps { wallet: any; }

const GoFundSmiles = ({ wallet }: GoFundSmilesProps) => {
  const { login, authenticated } = usePrivy();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [totalFunds, setTotalFunds] = useState("0");
  const [userBalance, setUserBalance] = useState("0");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const smilesRemaining = parseFloat(totalFunds) > 0 ? Math.floor(parseFloat(totalFunds) / 0.001) : 0;

  useEffect(() => {
    const fetch = async () => {
      if (!wallet) return;
      try {
        const provider = await wallet.getEthersProvider();
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
        const decimals = await usdc.decimals();
        const total = await usdc.balanceOf(RECIPIENT_ADDRESS);
        setTotalFunds(parseFloat(ethers.utils.formatUnits(total, decimals)).toFixed(2));
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        const bal = await usdc.balanceOf(addr);
        setUserBalance(parseFloat(ethers.utils.formatUnits(bal, decimals)).toFixed(2));
      } catch (e) { console.error(e); }
    };
    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [wallet]);

  const handleDonate = async () => {
    if (!amount || !wallet) return;
    setLoading(true);
    try {
      const provider = await wallet.getEthersProvider();
      const signer = provider.getSigner();
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const decimals = await usdc.decimals();
      const tx = await usdc.transfer(RECIPIENT_ADDRESS, ethers.utils.parseUnits(amount, decimals));
      await tx.wait();
      setAmount("");
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
      toast.error('Failed to process donation. Please try again.');
    } finally { setLoading(false); }
  };

  if (!authenticated) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="smile-card p-8 max-w-2xl mx-auto mb-8 text-center">
        <Heart className="h-10 w-10 text-red-400 mx-auto mb-3 animate-pulse" />
        <h3 className="text-2xl font-black mb-2">Keep me Alive! 💝</h3>
        <p className="text-gray-500 mb-4">Connect your wallet to help spread more smiles!</p>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={login}
          className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-md">
          Connect Wallet
        </motion.button>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="smile-card p-6 md:p-8 max-w-2xl mx-auto mb-8 overflow-hidden relative">
        <div className="absolute top-0 right-0 translate-x-6 -translate-y-6">
          <Sparkles className="w-24 h-24 text-yellow-300 opacity-15" />
        </div>

        <div className="relative z-10 text-center mb-6">
          <h3 className="text-2xl font-black mb-2 flex items-center justify-center gap-2">
            <Heart className="text-red-400 w-6 h-6 animate-pulse" /> Keep me Alive! <Heart className="text-red-400 w-6 h-6 animate-pulse" />
          </h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
            Your contribution helps me pay gas bills and reward humans for being nice to me!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
            <div className="bg-gray-50 px-4 py-2 rounded-full text-sm font-semibold border border-gray-100">
              Total: {totalFunds} <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="" className="inline h-3.5 w-3.5 ml-0.5 mb-0.5" />
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-full text-sm font-semibold border border-green-100">
              😊 {smilesRemaining.toLocaleString()} smiles left
            </div>
          </div>

          {/* Progress */}
          <div className="max-w-xs mx-auto">
            <div className="progress-track h-2.5">
              <motion.div className="progress-fill h-full animate-gradient"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((smilesRemaining / 10000) * 100, 100)}%` }}
                transition={{ duration: 1 }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Goal: 10,000 smiles funded</p>
          </div>
        </div>

        <div className="relative z-10 bg-white/60 p-5 rounded-2xl border border-gray-100 max-w-md mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-500 font-medium">Your Balance:</span>
            <span className="font-bold text-sm">{userBalance} <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="" className="inline h-3.5 w-3.5" /></span>
          </div>

          {/* Presets */}
          <div className="flex gap-2 mb-3">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(p)}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all smile-btn ${amount === p ? 'bg-green-100 border-green-300 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {p}
              </button>
            ))}
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                placeholder="Custom amount" className="pr-20 border-gray-200 h-11 rounded-xl text-sm" min="0" step="0.1" />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button onClick={() => setAmount(userBalance)} className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md text-gray-600">MAX</button>
                <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="" className="h-4 w-4" />
              </div>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleDonate} disabled={loading || !amount}
              className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${loading ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md hover:shadow-lg'}`}>
              {loading ? "Processing..." : "Fund Smiles 💝"}
            </motion.button>
          </div>
        </div>

        <p className="relative z-10 text-center text-xs text-gray-400 mt-3 font-medium">100% stays with ME — I can only spend it on smiles! 😇</p>
      </motion.div>

      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}>
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="flex justify-center mb-4">
            <PartyPopper className="w-14 h-14 text-yellow-500" />
          </motion.div>
          <h3 className="text-xl font-black mb-2">Thank You! 💝</h3>
          <p className="text-gray-500 mb-5 text-sm">Your donation will help spread more smiles worldwide! 😊🌍</p>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => setShowSuccessModal(false)}
            className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-6 py-3 rounded-xl shadow-md">
            Keep Smiling! 😁
          </motion.button>
        </div>
      </Modal>
    </>
  );
};

export default GoFundSmiles;