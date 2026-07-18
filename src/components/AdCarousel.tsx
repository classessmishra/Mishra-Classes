"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Tag, BookOpen, Presentation, Trophy, ChevronLeft, ChevronRight, GraduationCap, Percent, Megaphone, Star, Award, Sparkles, Gift, Zap } from "lucide-react";
import { getAdvertisements } from "@/actions/advertisements";
import Link from "next/link";

const fallbackAds: any[] = [];

export default function AdCarousel({ previewData, isPreview = false }: { previewData?: any[], isPreview?: boolean }) {
  const [adsData, setAdsData] = useState<any[]>(() => {
    if (previewData && previewData.length > 0) {
      return previewData.map((ad: any) => ({
        ...ad,
        title: ad.headline || ad.title,
        subtitle: ad.subheadline || ad.subtitle,
        link_url: ad.cta_link || ad.link_url || ad.link,
        gradient: ad.bg_gradient || ad.gradient,
        badge_text: ad.secondary_cta_text || ad.badge_text,
        icon_name: ad.cta_text || 'Rocket'
      }));
    }
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (previewData) {
      setAdsData(previewData.length > 0 ? previewData.map((ad: any) => ({
        ...ad,
        title: ad.headline || ad.title,
        subtitle: ad.subheadline || ad.subtitle,
        link_url: ad.cta_link || ad.link_url || ad.link,
        gradient: ad.bg_gradient || ad.gradient,
        badge_text: ad.secondary_cta_text || ad.badge_text,
        icon_name: ad.cta_text || 'Rocket'
      })) : []);
      return;
    }
    async function loadAds() {
      const dbAds = await getAdvertisements('carousel');
      if (dbAds && dbAds.length > 0) {
        setAdsData(dbAds.map((ad: any) => ({
          ...ad,
          title: ad.headline || ad.title,
          subtitle: ad.subheadline || ad.subtitle,
          link_url: ad.cta_link || ad.link_url || ad.link,
          gradient: ad.bg_gradient || ad.gradient,
          badge_text: ad.secondary_cta_text || ad.badge_text,
          icon_name: ad.cta_text || 'Rocket'
        })));
      }
    }
    loadAds();
  }, [previewData]);

  useEffect(() => {
    if (adsData.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % adsData.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [adsData.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + adsData.length) % adsData.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % adsData.length);
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Tag': return <Tag className="w-12 h-12 text-white opacity-80" />;
      case 'BookOpen': return <BookOpen className="w-12 h-12 text-white opacity-80" />;
      case 'GraduationCap': return <GraduationCap className="w-12 h-12 text-white opacity-80" />;
      case 'Percent': return <Percent className="w-12 h-12 text-white opacity-80" />;
      case 'Megaphone': return <Megaphone className="w-12 h-12 text-white opacity-80" />;
      case 'Trophy': return <Trophy className="w-12 h-12 text-white opacity-80" />;
      case 'Star': return <Star className="w-12 h-12 text-white opacity-80" />;
      case 'Award': return <Award className="w-12 h-12 text-white opacity-80" />;
      case 'Sparkles': return <Sparkles className="w-12 h-12 text-white opacity-80" />;
      case 'Gift': return <Gift className="w-12 h-12 text-white opacity-80" />;
      case 'Zap': return <Zap className="w-12 h-12 text-white opacity-80" />;
      case 'Rocket':
      default: return <Rocket className="w-12 h-12 text-white opacity-80" />;
    }
  };

  if (adsData.length === 0) return null;

  return (
    <div className="relative w-full max-w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-lg my-8 md:my-12 group">
      <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />
      
      <div className="relative h-64 md:h-48 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={`absolute inset-0 w-full h-full bg-gradient-to-r ${adsData[currentIndex]?.bg_gradient || adsData[currentIndex]?.gradient || 'from-blue-600 to-indigo-800'} flex items-center p-8 md:px-12`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            
            {adsData[currentIndex]?.image_url && (
              <img src={adsData[currentIndex].image_url} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" alt="ad bg" />
            )}
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full gap-6">
              <div className="flex items-center gap-6 text-white text-center md:text-left">
                <div className="hidden md:flex items-center justify-center bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10 shadow-xl">
                  {adsData[currentIndex]?.icon || renderIcon(adsData[currentIndex]?.icon_name)}
                </div>
                <div>
                  <div className="inline-block px-3 py-1 mb-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white text-xs font-black tracking-widest uppercase">
                    {adsData[currentIndex]?.badge_text || "Featured Update"}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black mb-2 drop-shadow-md">{adsData[currentIndex]?.title}</h3>
                  <p className="text-white/80 font-medium max-w-xl text-sm md:text-base">{adsData[currentIndex]?.subtitle}</p>
                </div>
              </div>
              
              <div className="shrink-0">
                <Link href={adsData[currentIndex]?.link_url || adsData[currentIndex]?.link || "/store"} {...(((adsData[currentIndex]?.link_url || adsData[currentIndex]?.link || "").startsWith("http")) ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="inline-block bg-white text-slate-900 px-6 py-3 rounded-xl font-bold shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] hover:scale-105 transition-all duration-200">
                  {adsData[currentIndex]?.cta || "Explore Now"}
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
      >
        <ChevronLeft size={24} />
      </button>
      
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {adsData.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
