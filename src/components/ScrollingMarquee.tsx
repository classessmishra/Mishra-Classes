"use client";

import { Star, Trophy } from "lucide-react";
import React, { useState, useEffect } from "react";
import { getAdvertisements } from "@/actions/advertisements";

const fallbackToppers: any[] = [];

export default function ScrollingMarquee({ previewData, isPreview = false }: { previewData?: any[], isPreview?: boolean }) {
  const [items, setItems] = useState<any[]>(() => {
    if (previewData && previewData.length > 0) {
      return previewData.map(ad => ({
        name: ad.headline || ad.name || "Student",
        rank: ad.cta_text || ad.rank || "Topper",
        exam: ad.subheadline || ad.exam || "Exam",
        score: ad.bg_gradient || ad.score || "99%",
        image_url: ad.image_url || null
      }));
    }
    return [];
  });

  useEffect(() => {
    if (previewData) {
      setItems(previewData.length > 0 ? previewData.map(ad => ({
        name: ad.headline || ad.name || "Student",
        rank: ad.cta_text || ad.rank || "Topper",
        exam: ad.subheadline || ad.exam || "Exam",
        score: ad.bg_gradient || ad.score || "99%",
        image_url: ad.image_url || null
      })) : []);
      return;
    }
    async function loadAds() {
      const dbAds = await getAdvertisements('marquee');
      if (dbAds && dbAds.length > 0) {
        setItems(dbAds.map(ad => ({
          name: ad.headline || "Student",
          rank: ad.cta_text || "Topper",
          exam: ad.subheadline || "Exam",
          score: ad.bg_gradient || "99%",
          image_url: ad.image_url || null
        })));
      }
    }
    loadAds();
  }, [previewData]);

  if (items.length === 0) return null;

  return (
    <div className="w-full max-w-full mb-16 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Star className="text-yellow-500 fill-yellow-500" /> Wall of Excellence
          </h2>
          <p className="text-slate-500 text-sm font-medium">Join our legacy of producing top rankers every year.</p>
        </div>
      </div>
      
      {/* Marquee Container */}
      <div className="relative w-full py-16 overflow-hidden my-4 rounded-3xl bg-slate-900 shadow-2xl border border-slate-800">
        {/* Futuristic Background Patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-purple-900/40" />
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/2 left-1/4 w-[30rem] h-[30rem] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-[30rem] h-[30rem] bg-purple-500/20 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
        
        {/* Left/Right Fades (Dark) */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling Track */}
        <div className={`relative z-20 flex w-fit hover:[animation-play-state:paused] gap-6 px-4 ${items.length >= 4 ? 'animate-marquee' : 'mx-auto justify-center'}`}>
          {(items.length >= 4 ? [...items, ...items, ...items] : items).map((topper, idx) => (
            <div 
              key={idx} 
              className="w-[300px] shrink-0 bg-transparent rounded-2xl p-[2px] flex flex-col transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(129,140,248,0.25)] cursor-default relative overflow-hidden group"
            >
              {/* Colorful Animated Border (Glowing) */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Inner Glassmorphism Card */}
              <div className="relative bg-slate-900/90 backdrop-blur-2xl w-full rounded-xl p-3 flex items-stretch gap-4">
                {/* Left: Large Square Photo */}
                <div className="w-[110px] aspect-square shrink-0 rounded-lg overflow-hidden relative border border-indigo-400/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                  {topper.image_url ? (
                    <img src={topper.image_url} alt={topper.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black flex items-center justify-center text-4xl shadow-[inset_0_0_20px_rgba(0,0,0,0.2)]">
                      {topper.name?.charAt(0) || "S"}
                    </div>
                  )}
                </div>
                
                {/* Right: Details */}
                <div className="flex flex-col justify-center flex-1 py-1">
                  <h4 className="font-bold text-white text-lg leading-tight line-clamp-1" title={topper.name}>{topper.name || "Student"}</h4>
                  <p className="text-xs text-indigo-200 font-medium mt-1 line-clamp-1">{topper.exam}</p>
                  
                  <div className="mt-auto pt-3 flex items-end justify-between">
                    <span className="flex w-fit items-center gap-1.5 text-[10px] font-black text-amber-950 bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(251,191,36,0.3)] border border-amber-300 whitespace-nowrap">
                      <Trophy size={10} className="text-amber-900 shrink-0" />
                      {topper.rank}
                    </span>
                    <span className="text-2xl leading-none font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-100 drop-shadow-md ml-2">{topper.score}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-33.33%)); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}
