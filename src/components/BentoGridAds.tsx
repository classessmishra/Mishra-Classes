"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, Zap, Flame, Crown } from "lucide-react";
import { getAdvertisements } from "@/actions/advertisements";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function BentoGridAds({ previewData, isPreview = false }: { previewData?: any[], isPreview?: boolean }) {
  const [ads, setAds] = useState<any[]>(previewData || []);

  useEffect(() => {
    if (previewData) {
      setAds(previewData);
      return;
    }
    async function loadAds() {
      const dbAds = await getAdvertisements('bento');
      setAds(dbAds || []);
    }
    loadAds();
  }, [previewData]);

  const getAd = (targetOrder: number) => {
    if (!ads) return null;
    const ad = ads.find(a => (a.order_index || 1) === targetOrder);
    if (ad) {
      return {
        title: ad.headline || ad.title,
        subtitle: ad.subheadline || ad.subtitle,
        badge_text: ad.secondary_cta_text || ad.badge_text,
        link_url: ad.cta_link || ad.link_url,
        image_url: ad.image_url,
        bg_gradient: ad.bg_gradient
      };
    }
    return null;
  };

  if (ads.length === 0) return null;

  const ad1 = getAd(1) || { title: "Premium Courses", subtitle: "Unlock your full potential with our top courses.", bg_gradient: "from-indigo-500 via-purple-500 to-pink-500", badge_text: "FEATURED" } as any;
  const ad2 = getAd(2) || { title: "New Batches Starting", subtitle: "Enroll today", bg_gradient: "from-blue-600 to-cyan-500" } as any;
  const ad3 = getAd(3) || { title: "Study Materials", subtitle: "follow on insta", bg_gradient: "from-amber-400 to-orange-500" } as any;
  const ad4 = getAd(4) || { title: "Join Community", subtitle: "STUDY GROUP", bg_gradient: "from-slate-700 to-slate-800" } as any;

  return (
    <div className="w-full mb-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-2">
            <Sparkles className="text-primary" /> Trending Now
          </h2>
          <p className="text-slate-500 font-medium">Top picks and announcements curated for you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px] md:auto-rows-[250px]">
        {/* Large Main Feature */}
        {ad1 && (
        <Link href={ad1.link_url || "/store"} {...((ad1.link_url || "").startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="group relative col-span-1 md:col-span-2 row-span-2 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 bg-slate-900">
          {ad1.image_url ? (
            <>
              <img src={ad1.image_url} alt="Feature" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className={`absolute inset-0 bg-gradient-to-br ${ad1.bg_gradient || 'from-indigo-500 to-pink-500'} opacity-30 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </>
          ) : (
            <>
              <div className={`absolute inset-0 bg-gradient-to-br ${ad1.bg_gradient || 'from-indigo-500 via-purple-500 to-pink-500'}`} />
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </>
          )}

          <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-end">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
              <Crown size={24} />
            </div>
            {ad1.badge_text && (
              <div className="inline-block px-3 py-1 mb-3 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black tracking-widest uppercase w-fit">
                {ad1.badge_text}
              </div>
            )}
            <h3 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-2">
              {ad1.title}
            </h3>
            <p className="text-white/80 font-medium max-w-sm text-sm md:text-base">{ad1.subtitle}</p>
          </div>
          
          <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary group-hover:rotate-45 transition-all duration-300">
            <ArrowUpRight size={24} />
          </div>
        </Link>
        )}

        {/* Top Right Rectangle */}
        {ad2 && (
        <Link href={ad2.link_url || "/store"} {...((ad2.link_url || "").startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="group relative col-span-1 md:col-span-2 row-span-1 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 bg-slate-900">
          {ad2.image_url ? (
            <>
              <img src={ad2.image_url} alt="Feature" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className={`absolute inset-0 bg-gradient-to-r ${ad2.bg_gradient || 'from-blue-600 to-cyan-500'} opacity-40 mix-blend-multiply group-hover:opacity-50 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-r ${ad2.bg_gradient || 'from-blue-600 to-cyan-500'} opacity-90 group-hover:opacity-100 transition-opacity`} />
          )}

          <div className="relative h-full p-5 md:p-8 flex items-center justify-between z-10">
            <div>
              <h3 className="text-2xl md:text-4xl font-extrabold text-white mb-1 leading-tight">{ad2.title}</h3>
              <p className="text-blue-100 font-medium text-sm md:text-base">{ad2.subtitle}</p>
            </div>
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0 ml-4">
              <Zap size={24} className="fill-current" />
            </div>
          </div>
        </Link>
        )}

        {/* Bottom Small Square 1 */}
        {ad3 && (
        <Link href={ad3.link_url || "/store"} {...((ad3.link_url || "").startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="group relative col-span-1 row-span-1 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 bg-white">
          {ad3.image_url ? (
            <>
              <img src={ad3.image_url} alt="Feature" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className={`absolute inset-0 bg-gradient-to-br ${ad3.bg_gradient || 'from-amber-400 to-orange-500'} opacity-30 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${ad3.bg_gradient || 'from-amber-400 to-orange-500'} opacity-10 group-hover:opacity-100 transition-opacity duration-500`} />
          )}

          <div className="relative h-full p-6 flex flex-col justify-between z-10">
            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
              <Flame size={20} className="fill-current" />
            </div>
            <div>
              <h3 className={`text-xl font-black transition-colors ${ad3.image_url ? 'text-white' : 'text-slate-900 group-hover:text-white'}`}>{ad3.title}</h3>
              <p className={`text-sm font-medium transition-colors ${ad3.image_url ? 'text-white/90' : 'text-slate-500 group-hover:text-white/80'}`}>{ad3.subtitle}</p>
            </div>
          </div>
        </Link>
        )}

        {/* Bottom Small Square 2 */}
        {ad4 && (
        <Link href={ad4.link_url || "/store"} {...((ad4.link_url || "").startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={(e) => isPreview && e.preventDefault()} className="group relative col-span-1 row-span-1 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 bg-slate-900">
          {ad4.image_url ? (
            <>
              <img src={ad4.image_url} alt="Feature" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <div className={`absolute inset-0 bg-gradient-to-br ${ad4.bg_gradient || 'from-slate-700 to-slate-800'} opacity-30 mix-blend-multiply`} />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
            </>
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
            </>
          )}
          
          <div className="relative h-full p-6 flex flex-col justify-end z-10 text-center items-center">
            <h3 className="text-xl font-black text-white mb-2">{ad4.title}</h3>
            {ad4.subtitle && (
              <span className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-full uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-colors">{ad4.subtitle}</span>
            )}
          </div>
        </Link>
        )}
      </div>
    </div>
  );
}
