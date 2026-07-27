"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { getAdvertisements } from "@/actions/advertisements";
import Link from "next/link";

export default function HeroSection({ previewData, isPreview = false }: { previewData?: any[], isPreview?: boolean }) {
  const [banners, setBanners] = useState<any[]>(previewData || []);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (previewData) {
      setBanners(previewData.length > 0 ? previewData : []);
      return;
    }
    
    async function loadBanners() {
      const data = await getAdvertisements('hero');
      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners([]);
      }
    }
    loadBanners();
  }, [previewData]);

  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full max-w-full min-h-[450px] md:h-[550px] rounded-2xl md:rounded-[2.5rem] overflow-hidden mb-8 md:mb-16 group shadow-2xl shadow-blue-900/10 border border-white/40">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 1, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset }) => {
            if (offset.x < -50) handleNext();
            else if (offset.x > 50) handlePrev();
          }}
        >
          {/* Background Image */}
          {currentBanner.image_url ? (
            <img
              src={currentBanner.image_url}
              alt="Hero Background"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-slate-800" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Advanced Premium Gradients & Blur - Lighter to show image */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/50 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-slate-900/10 pointer-events-none" />
      
      {/* Decorative Floating Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-indigo-500/20 blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center p-5 pb-12 md:p-10 md:px-16 lg:px-20 max-w-4xl pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentBanner.id}`}
            initial={{ opacity: 1, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            className="pointer-events-auto"
          >
            {/* Badge (Using secondary_cta_text or cta_text) */}
            {currentBanner.secondary_cta_text && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-100 text-sm font-bold tracking-wider uppercase shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_10px_rgba(96,165,250,0.8)]" />
                {currentBanner.secondary_cta_text}
              </div>
            )}

            {/* Headline */}
            <h1 className="text-2xl md:text-5xl font-extrabold text-white leading-tight mb-6 tracking-tight drop-shadow-2xl">
              {currentBanner.headline?.split(' ').map((word: string, i: number) => (
                <span key={i} className={i % 3 === 0 ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300" : ""}>
                  {word}{" "}
                </span>
              ))}
            </h1>

            {/* Sub-headline */}
            <p className="text-xs md:text-base text-slate-300 mt-2 mb-10 max-w-2xl font-medium leading-relaxed drop-shadow">
              {currentBanner.subheadline}
            </p>

            {/* CTA Button */}
            <Link href={currentBanner.cta_link || "/store"} {...(((currentBanner.cta_link || "").startsWith("http")) ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="inline-flex w-fit group relative overflow-hidden px-4 py-2 text-sm mt-4 md:px-8 md:py-4 md:mt-0 bg-white text-slate-900 rounded-2xl font-black md:text-lg items-center gap-3 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:-translate-y-1">
              <span className="relative z-10">{currentBanner.cta_text || "Start Learning Now"}</span>
              <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls (Arrows) */}
      {banners.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 shadow-xl"
          >
            <ChevronLeft size={28} />
          </button>
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 shadow-xl"
          >
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Slider dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-8 bg-blue-500" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
