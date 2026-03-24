"use client";

import { Button } from "@/components/ui/button";
import { Smile, Share, Trash2, Star, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { NOUNS_SVG } from '../constants/nouns';

interface Image {
  url: string;
  timestamp: string;
  isLoading?: boolean;
  smileCount: number;
  smileScore?: number;
  hasWon?: boolean;
  isNounish: boolean;
}

interface ImageGridProps {
  images: Image[];
  authenticated: boolean;
  userId?: string;
  onSmileBack: (imageUrl: string) => void;
  onDelete: (imageUrl: string, userId: string) => void;
}

const StarRating = ({ score, max = 5 }: { score: number; max?: number }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: max }, (_, i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i < score ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
    ))}
  </div>
);

export const ImageGrid = ({ images, authenticated, userId, onSmileBack, onDelete }: ImageGridProps) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);

  const handleShare = (image: Image) => { setSelectedImage(image); setIsShareModalOpen(true); };

  const shareOnTwitter = () => {
    if (!selectedImage) return;
    const text = encodeURIComponent(
      `I scored ${selectedImage.smileScore}/5 on my smile${selectedImage.hasWon ? ' and won 0.001 USDC 🎉' : ''}! 😊\n\nTry it: smile.openputer.com\n\n#BasedSmiles #Base #Web3`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const downloadScreenshot = async () => {
    if (!selectedImage) return;
    const el = document.getElementById('share-preview');
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { backgroundColor: null, scale: 2, useCORS: true, allowTaint: true });
      const link = document.createElement('a');
      link.download = 'my-smile-score.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { console.error(e); }
  };

  // Empty state
  if (images.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <Camera className="h-16 w-16 text-gray-200 mb-4" />
        </motion.div>
        <h3 className="text-xl font-black text-gray-300 mb-1">No smiles yet!</h3>
        <p className="text-gray-400 text-sm text-center max-w-xs">Be the first to capture a smile and earn USDC 📸</p>
      </motion.div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {images.map((image, index) => (
            <motion.div
              key={image.url || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.06 }}
              className="smile-card image-card p-3 overflow-hidden"
            >
              <div className={`relative overflow-hidden rounded-xl ${image.isLoading ? 'relative before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent before:z-10' : ''}`}>
                <img src={image.url} alt="Smile" className="w-full h-[260px] object-cover rounded-xl" />
                {image.isNounish && (
                  <div className="absolute top-2 w-10 h-10" style={{ left: '20%', transform: 'translateX(-50%) scale(0.7)' }}
                    dangerouslySetInnerHTML={{ __html: NOUNS_SVG }} />
                )}
                <div className={`absolute top-2 right-2 bg-white/95 px-2.5 py-1 rounded-full shadow-sm ${!image.isLoading ? 'animate-scoreReveal' : ''}`}>
                  {image.isLoading
                    ? <span className="text-sm font-bold text-gray-400 animate-pulse">?/5</span>
                    : <span className="text-sm font-black">{image.smileScore ?? 0}/5</span>
                  }
                </div>
              </div>

              {/* Star Rating + Winner */}
              {!image.isLoading && (
                <div className="flex items-center justify-between mt-2 mb-1 px-1">
                  <StarRating score={image.smileScore ?? 0} />
                  {image.hasWon && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full animate-confetti">
                      🎉 Winner!
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between mt-1">
                <p className="text-[10px] text-gray-400 font-medium">{new Date(image.timestamp).toLocaleString()}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => onSmileBack(image.url)}
                    className="smile-btn flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-1 text-xs rounded-lg border border-yellow-200">
                    <Smile className="h-3 w-3" />{image.smileCount || 0}
                  </button>
                  <button onClick={() => handleShare(image)}
                    className="smile-btn p-1.5 bg-green-50 text-green-700 rounded-lg border border-green-200">
                    <Share className="h-3 w-3" />
                  </button>
                  {authenticated && userId && image.url.includes(`${userId}/`) && (
                    <button onClick={() => onDelete(image.url, userId)}
                      className="smile-btn p-1.5 bg-red-50 text-red-500 rounded-lg border border-red-200">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Loading state */}
              {image.isLoading && (
                <div className="mt-2 text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>🤖</motion.span>
                  AI analyzing your smile...
                </div>
              )}

              {/* Win reward */}
              {!image.isLoading && image.hasWon && (
                <p className="text-green-600 font-bold mt-1 text-center text-xs animate-confetti">
                  🎉 0.001 <img src="https://cryptologos.cc/logos/usd-coin-usdc-logo.png" alt="USDC" className="inline h-3 w-3" /> awarded!
                </p>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">Share Your Smile! 😊</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-3">
              <div id="share-preview" className="bg-white p-3 rounded-2xl border border-gray-200">
                <div className="relative rounded-xl overflow-hidden">
                  <img src={selectedImage.url} alt="Share" className="w-full aspect-[4/3] object-cover" crossOrigin="anonymous" />
                  <div className="absolute top-2 right-2 bg-white rounded-full px-2.5 py-1 shadow-sm flex items-center gap-1">
                    <span className="font-black">{selectedImage.smileScore ?? 0}/5</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                </div>
                {selectedImage.hasWon && (
                  <div className="mt-2 bg-green-50 rounded-xl p-2.5 text-center">
                    <span className="text-green-600 font-black text-sm">🎉 Won 0.001 USDC!</span>
                  </div>
                )}
              </div>
              <button onClick={shareOnTwitter}
                className="w-full py-3 rounded-xl font-bold bg-black text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </button>
              <button onClick={downloadScreenshot}
                className="w-full py-3 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 text-sm">
                📥 Save Screenshot
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};