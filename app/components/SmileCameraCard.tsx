"use client";

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { initCamera, compressImage, uploadImage } from '../utils/camera';
import { NOUNS_SVG } from '../constants/nouns';

const STEPS = [
  { emoji: '📸', label: 'Capturing' },
  { emoji: '🔄', label: 'Processing' },
  { emoji: '⛓️', label: 'On-chain' },
  { emoji: '🤖', label: 'AI Analyzing' },
];

interface SmileCameraCardProps {
  authenticated: boolean;
  loading: boolean;
  onCapture: () => void;
  captureStep: number;
  onLogin: () => void;
}

export interface SmileCameraCardRef {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const SmileCameraCard = forwardRef<SmileCameraCardRef, SmileCameraCardProps>(
  ({ authenticated, loading, onCapture, captureStep, onLogin }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraDenied, setCameraDenied] = useState(false);
    const [nounsFilterEnabled, setNounsFilterEnabled] = useState(false);

    useImperativeHandle(ref, () => ({
      videoRef,
      canvasRef,
    }));

    useEffect(() => {
      const savedValue = localStorage.getItem('nounsFilterEnabled') === 'true';
      setNounsFilterEnabled(savedValue);
    }, []);

    useEffect(() => {
      const setup = async () => {
        try {
          await initCamera(videoRef);
          setCameraReady(true);
        } catch {
          setCameraDenied(true);
        }
      };
      setup();
    }, []);

    useEffect(() => {
      if (nounsFilterEnabled && videoRef.current) {
        const video = videoRef.current;
        const overlay = document.createElement('div');
        overlay.id = 'nouns-overlay';
        overlay.innerHTML = NOUNS_SVG;
        overlay.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:10;width:75%;height:75%;`;
        const svg = overlay.querySelector('svg');
        if (svg) {
          svg.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:auto;`;
        }
        video.parentElement?.appendChild(overlay);
        return () => { document.getElementById('nouns-overlay')?.remove(); };
      }
    }, [nounsFilterEnabled]);

    const toggleNouns = () => {
      const val = !nounsFilterEnabled;
      setNounsFilterEnabled(val);
      localStorage.setItem('nounsFilterEnabled', String(val));
    };

    const retryCamera = async () => {
      setCameraDenied(false);
      try {
        await initCamera(videoRef);
        setCameraReady(true);
      } catch {
        setCameraDenied(true);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="smile-card p-4 md:p-6 mb-8 max-w-lg mx-auto"
      >
        {/* Camera */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-900 mb-4">
          {cameraDenied ? (
            <div className="h-[320px] flex flex-col items-center justify-center gap-3 bg-gray-100 rounded-2xl">
              <Camera className="h-14 w-14 text-gray-300" />
              <p className="font-bold text-gray-500">Camera access denied 😢</p>
              <p className="text-sm text-gray-400 text-center px-4">Allow camera access in your browser to start smiling.</p>
              <Button onClick={retryCamera} className="smile-btn bg-green-100 text-green-700 px-4 py-2 text-sm">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-[320px] object-cover rounded-2xl ${loading ? 'animate-pulseBorder border-2' : ''}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Nouns toggle */}
              <button
                onClick={toggleNouns}
                className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all ${
                  nounsFilterEnabled
                    ? 'bg-green-400 text-white'
                    : 'bg-white/90 text-gray-700 hover:bg-white'
                }`}
              >
                {nounsFilterEnabled ? 'Nounish 🤓' : 'Feel Nounish?'}
              </button>
            </>
          )}
        </div>

        {/* Progress Steps */}
        <AnimatePresence>
          {loading && captureStep >= 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="flex items-center justify-between px-2 mb-2">
                {STEPS.map((step, i) => (
                  <div key={i} className={`flex flex-col items-center gap-1 transition-opacity ${i <= captureStep ? 'opacity-100' : 'opacity-30'}`}>
                    <motion.span
                      className="text-xl"
                      animate={i === captureStep ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 1 }}
                    >
                      {step.emoji}
                    </motion.span>
                    <span className={`text-[10px] font-bold ${i === captureStep ? 'text-green-600' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="progress-track h-2">
                <motion.div
                  className="progress-fill h-full"
                  animate={{ width: `${((captureStep + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <div className="text-center">
          {authenticated ? (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onCapture}
              disabled={loading || cameraDenied}
              className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl animate-pulseGlow'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Camera className="h-5 w-5" />
                  Start Smiling 😄
                </>
              )}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onLogin}
              className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg hover:shadow-xl"
            >
              Connect Wallet to Smile ✨
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }
);

SmileCameraCard.displayName = 'SmileCameraCard';
export default SmileCameraCard;
