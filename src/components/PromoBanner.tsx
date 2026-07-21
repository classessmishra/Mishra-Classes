"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getAdvertisements } from "@/actions/advertisements";

export default function PromoBanner({ previewData, isPreview = false }: { previewData?: any, isPreview?: boolean }) {
  const [fetchedAd, setFetchedAd] = useState<any>(null);
  const ad = previewData || fetchedAd;

  useEffect(() => {
    if (previewData) {
      return;
    }
    async function loadAds() {
      const dbAds = await getAdvertisements('promo');
      if (dbAds && dbAds.length > 0) {
        setFetchedAd(dbAds[0]);
      }
    }
    loadAds();
  }, [previewData]);

  if (!ad) return null;

  const title = ad.headline;
  const subtitle = ad.subheadline;
  const link_url = ad.cta_link;
  const badge_text = ad.secondary_cta_text;
  const cta_text = ad.cta_text;
  const bg_gradient = ad.bg_gradient;
  return (
    <div className="w-full max-w-full mb-16 relative rounded-[2rem] overflow-hidden group">
      {/* Background with abstract shapes */}
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
      
      {ad?.image_url && (
        <img src={ad.image_url} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30" alt="Promo bg" />
      )}

      <div className={`absolute -top-[50%] -left-[10%] w-[50%] h-[150%] bg-gradient-to-r ${bg_gradient} blur-[120px] rounded-full rotate-12 group-hover:rotate-45 transition-transform duration-1000`} />
      <div className="absolute -bottom-[50%] -right-[10%] w-[50%] h-[150%] bg-gradient-to-l from-emerald-500/20 to-teal-500/20 blur-[100px] rounded-full -rotate-12 group-hover:-rotate-45 transition-transform duration-1000" />
      
      <div className="relative z-10 px-6 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="max-w-2xl">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-white font-bold z-${10-i}`}>
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}&backgroundColor=transparent`} alt="avatar" className="w-full h-full" />
                </div>
              ))}
            </div>
            <div className="flex items-center text-yellow-500 ml-2">
              {[1,2,3,4,5].map(i => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <span className="text-slate-300 text-sm font-medium ml-1">Trusted by 10k+ Rankers</span>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 tracking-tight" dangerouslySetInnerHTML={{__html: title}}>
          </h2>
          <p className="text-lg text-slate-300 font-medium max-w-xl">
            {subtitle}
          </p>
        </div>
        
        <div className="shrink-0 flex flex-col items-center md:items-end gap-3">
          <Link href={link_url} {...(((link_url || "").startsWith("http")) ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="group/btn relative overflow-hidden bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]">
            <span className="relative z-10">{cta_text}</span>
            <ArrowRight size={22} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-emerald-50 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
          </Link>
          <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{badge_text}</span>
        </div>
      </div>
    </div>
  );
}
