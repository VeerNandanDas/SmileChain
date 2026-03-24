"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Gift } from 'lucide-react';

import Navbar from './Navbar';
import HeroCard from './HeroCard';
import SmileCameraCard, { SmileCameraCardRef } from './SmileCameraCard';
import UserStatsPanel from './UserStatsPanel';
import Leaderboard from './Leaderboard';
import MapView from './MapView';
import { ImageGrid } from './ImageGrid';
import GoFundSmiles from './GoFundSmiles';
import { compressImage, uploadImage, loadExistingPhotos, handleSmileBack, deletePhoto } from '../utils/camera';

// ─── Config ─────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CONTRACT_ADDRESS = "0xf5526Ff322FBE97c31160A94A380093151Aa442F";
const CONTRACT_ABI = [
  "function analyzeSmile(string memory photoUrl) external payable",
  "function getOracleFee() external view returns (uint256)",
  "event SmileAnalysisReceived(bytes32 indexed requestId, string photoUrl, uint8 smileScore)"
];

const BASE_CHAIN_ID = 8453;
const BASE_CONFIG = {
  chainId: BASE_CHAIN_ID,
  name: 'Base',
  rpcUrls: { default: 'https://mainnet.base.org', public: 'https://mainnet.base.org' },
  blockExplorers: { default: { name: 'BaseScan', url: 'https://basescan.org' } },
  nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
};

// ─── Types ──────────────────────────────────────────────
interface ImageItem {
  url: string;
  timestamp: string;
  isLoading: boolean;
  smileCount: number;
  smileScore: number | undefined;
  hasWon: boolean | undefined;
  isNounish: boolean;
}

// ─── Gamification helpers ───────────────────────────────
function computeGamification(images: ImageItem[]) {
  const wins = images.filter(i => i.hasWon);
  const total = images.length;
  const rewards = (wins.length * 0.001).toFixed(3);

  const days = new Set(images.map(i => new Date(i.timestamp).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let d = 0; d < 365; d++) {
    const check = new Date(today);
    check.setDate(check.getDate() - d);
    if (days.has(check.toDateString())) streak++;
    else break;
  }

  const xp = total * 10 + wins.length * 50;
  const level = Math.min(10, Math.floor(xp / 100) + 1);
  const xpInLevel = xp - (level - 1) * 100;

  return { totalSmiles: total, totalRewards: rewards, streak, xp: xpInLevel, xpToNext: 100, level };
}

function computeLeaderboard(images: ImageItem[], currentUserId?: string) {
  const userMap: Record<string, { smiles: number; wins: number }> = {};
  images.forEach(img => {
    const parts = img.url.split('/');
    const uid = parts[parts.length - 2] || 'anon';
    if (!userMap[uid]) userMap[uid] = { smiles: 0, wins: 0 };
    userMap[uid].smiles++;
    if (img.hasWon) userMap[uid].wins++;
  });

  return Object.entries(userMap)
    .sort((a, b) => b[1].smiles - a[1].smiles)
    .slice(0, 10)
    .map(([uid, d], i) => ({
      rank: i + 1,
      username: uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid,
      smiles: d.smiles,
      rewards: (d.wins * 0.001).toFixed(3),
      isCurrentUser: currentUserId ? uid === currentUserId : false,
    }));
}

// ─── How It Works Steps ─────────────────────────────────
const HOW_IT_WORKS = [
  { emoji: '🔗', title: 'Connect', desc: 'Link your wallet' },
  { emoji: '📸', title: 'Smile', desc: 'Capture your best smile' },
  { emoji: '🤖', title: 'AI Scores', desc: 'On-chain AI rates your smile 1-5' },
  { emoji: '💰', title: 'Earn', desc: 'Score 4+ and win 0.001 USDC!' },
];

// ─── Component ──────────────────────────────────────────
const App = () => {
  const { login, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [captureStep, setCaptureStep] = useState(-1);
  const processedImages = useRef(new Set<string>());
  const cameraRef = useRef<SmileCameraCardRef>(null);

  const userRef = useRef(user);
  const nounsRef = useRef(false);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { nounsRef.current = localStorage.getItem('nounsFilterEnabled') === 'true'; }, []);

  useEffect(() => { loadExistingPhotos().then(setImages); }, []);

  // ─── Contract ────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!authenticated || wallets.length === 0) return;
      try {
        const wallet = wallets[0];
        const provider = await wallet.getEthersProvider();
        if (!provider) throw new Error('No provider');

        const net = await provider.getNetwork();
        if (net.chainId !== BASE_CHAIN_ID) {
          toast.info('🔗 Switching to Base network…');
          try { await wallet.switchChain(BASE_CHAIN_ID); }
          catch (e: any) {
            if (e.code === 4902) {
              await provider.send('wallet_addEthereumChain', [{
                chainId: `0x${BASE_CHAIN_ID.toString(16)}`,
                chainName: BASE_CONFIG.name,
                nativeCurrency: BASE_CONFIG.nativeCurrency,
                rpcUrls: [BASE_CONFIG.rpcUrls.default],
                blockExplorerUrls: [BASE_CONFIG.blockExplorers.default.url],
              }]);
              await wallet.switchChain(BASE_CHAIN_ID);
            } else throw e;
          }
        }

        const up = await wallet.getEthersProvider();
        const signer = up.getSigner();
        const c = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        await c.getOracleFee();
        setContract(c);
        toast.success('✅ Connected to Base!');

        c.on("SmileAnalysisReceived", async (_rid: string, photoUrl: string, smileScore: number) => {
          const cu = userRef.current;
          if (processedImages.current.has(photoUrl)) return;
          processedImages.current.add(photoUrl);

          const hasWon = smileScore > 3;
          if (hasWon && cu) {
            const { data } = await supabase.from('photos').select().eq('image_url', photoUrl).single();
            if (!data) {
              const { error } = await supabase.from('photos').insert({
                user_id: cu.id, image_url: photoUrl, timestamp: new Date().toISOString(),
                smile_score: smileScore, is_nounish: nounsRef.current, smile_count: 0,
              });
              if (error) toast.error('Won tokens but failed to save');
            }
          }

          setImages(prev => prev.map(img => img.url === photoUrl ? { ...img, isLoading: false, smileScore, hasWon, isNounish: nounsRef.current } : img));
          if (!hasWon) setTimeout(() => setImages(prev => prev.filter(img => img.url !== photoUrl)), 4000);

          if (hasWon) toast.success(`🎉 Score: ${smileScore}/5 — You won 0.001 USDC!`, { duration: 5000 });
          else {
            const m: Record<number, string> = { 1: '😐 Show those teeth!', 2: '🙂 Bigger smile!', 3: '😊 So close!' };
            toast.info(`${m[smileScore] || 'Try again!'} Score: ${smileScore}/5`);
          }
          setCaptureStep(-1);
          setTimeout(() => setLoading(false), 2000);
        });
      } catch (e) { console.error(e); toast.error('Failed to connect'); }
    };
    init();
    return () => { contract?.removeAllListeners("SmileAnalysisReceived"); };
  }, [authenticated, wallets]);

  // ─── Capture ─────────────────────────────────────────
  const capturePhoto = async () => {
    setLoading(true); setCaptureStep(0);
    try {
      const canvas = cameraRef.current?.canvasRef.current;
      const video = cameraRef.current?.videoRef.current;
      if (!canvas || !video) return;
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      setCaptureStep(1);
      const blob = await new Promise<Blob>((res, rej) => canvas.toBlob(b => b ? res(b) : rej(new Error('Blob failed')), 'image/jpeg', 0.8));
      const compressed = await compressImage(blob);
      const isNounish = localStorage.getItem('nounsFilterEnabled') === 'true';
      const result = await uploadImage(compressed, user!.id, isNounish);

      if (!contract) throw new Error('Contract not initialized');
      const provider = await wallets[0].getEthersProvider();
      if ((await provider.getNetwork()).chainId !== BASE_CHAIN_ID) throw new Error('Switch to Base');

      const fee = await contract.getOracleFee();
      setImages(prev => [{ url: result.url, timestamp: new Date().toISOString(), isLoading: true, smileCount: 0, smileScore: undefined, hasWon: false, isNounish }, ...prev]);

      setCaptureStep(2);
      const tx = await contract.analyzeSmile(result.url, { value: fee, gasLimit: 500000 });
      await tx.wait(1);
      setCaptureStep(3);
    } catch (e: any) {
      console.error(e); toast.error(e.message || 'Failed'); setCaptureStep(-1); setLoading(false);
    }
  };

  const onSmileBack = async (url: string) => {
    try { await handleSmileBack(url); setImages(prev => prev.map(img => img.url === url ? { ...img, smileCount: img.smileCount + 1 } : img)); toast('😊 Smiled back!', { duration: 1500 }); }
    catch (e) { console.error(e); }
  };
  const onDelete = async (url: string, uid: string) => {
    try { await deletePhoto(url, uid); setImages(prev => prev.filter(img => img.url !== url)); toast('🗑️ Deleted', { duration: 1500 }); }
    catch (e) { console.error(e); }
  };

  const gam = useMemo(() => computeGamification(images), [images]);
  const lb = useMemo(() => computeLeaderboard(images, user?.id), [images, user]);

  return (
    <div className="min-h-screen">
      <Toaster position="top-center" richColors />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <HeroCard totalSmiles={gam.totalSmiles} streak={gam.streak} level={gam.level}
          xp={gam.xp} xpToNext={gam.xpToNext} totalRewards={gam.totalRewards} authenticated={authenticated} />

        {/* How It Works - compact */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={i} whileHover={{ y: -3 }}
              className="smile-card p-3 text-center cursor-default">
              <span className="text-2xl block mb-1">{step.emoji}</span>
              <p className="font-bold text-xs">{step.title}</p>
              <p className="text-[10px] text-gray-400">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ══════ Main Dashboard: Map & Leaderboard (left) + Camera (right) ══════ */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left: Map + Leaderboard (2 cols) */}
          <div className="lg:col-span-2 space-y-5 order-2 lg:order-1">
            <MapView />
            <Leaderboard entries={lb} currentUserId={user?.id} />
          </div>

          {/* Right: Camera + Stats (3 cols) */}
          <div className="lg:col-span-3 space-y-5 order-1 lg:order-2">
            <SmileCameraCard ref={cameraRef} authenticated={authenticated} loading={loading}
              onCapture={capturePhoto} captureStep={captureStep} onLogin={login} />

            {/* Quick Stats under camera */}
            {authenticated && (
              <div className="grid grid-cols-3 gap-3">
                <motion.div whileHover={{ scale: 1.03 }} className="smile-card p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-black">{gam.totalSmiles}</p>
                  <p className="text-[10px] text-gray-400">Total Smiles</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="smile-card p-3 text-center">
                  <Sparkles className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-black">Lv.{gam.level}</p>
                  <p className="text-[10px] text-gray-400">Your Level</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} className="smile-card p-3 text-center">
                  <Gift className="h-4 w-4 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-black">{gam.totalRewards}</p>
                  <p className="text-[10px] text-gray-400">USDC Earned</p>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {authenticated && (
          <UserStatsPanel totalSmiles={gam.totalSmiles} streak={gam.streak} level={gam.level}
            xp={gam.xp} xpToNext={gam.xpToNext} totalRewards={gam.totalRewards} />
        )}

        {/* Fund Smiles */}
        {authenticated && <GoFundSmiles wallet={wallets[0]} />}

        {/* Gallery */}
        <div>
          <h2 className="text-2xl font-black text-center mb-6 flex items-center justify-center gap-2">
            😊 Smile Gallery
          </h2>
          <ImageGrid images={images} authenticated={authenticated} userId={user?.id}
            onSmileBack={onSmileBack} onDelete={onDelete} />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 mt-8 border-t border-gray-100">
        <p className="font-medium">Built with ❤️ on Base · Powered by on-chain AI</p>
        <p className="mt-1">© {new Date().getFullYear()} SmileChain by Openputer</p>
      </footer>
    </div>
  );
};

export default App;
