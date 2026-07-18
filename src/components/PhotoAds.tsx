"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getAdvertisements } from "@/actions/advertisements";

const posters: any[] = [];

export default function PhotoAds({ previewData, isPreview = false }: { previewData?: any[], isPreview?: boolean }) {
  const [ads, setAds] = useState<any[]>(() => {
    if (previewData && previewData.length > 0) {
      return previewData.map((ad, idx) => ({
        id: ad.id || idx,
        imageUrl: ad.image_url,
        fallbackGradient: ad.bg_gradient || "from-slate-500 to-slate-700",
        title: ad.headline || ad.title || "Special Offer",
        span: idx === 0 ? "col-span-1 md:col-span-2 row-span-2" : "col-span-1",
        aspectRatio: idx === 0 ? "aspect-[2/1] md:aspect-auto h-full" : "aspect-square",
        link: ad.cta_link || ad.link || "/store"
      }));
    }
    return [];
  });

  useEffect(() => {
    if (previewData) {
      setAds(previewData.length > 0 ? previewData.map((ad, idx) => ({
        id: ad.id || idx,
        imageUrl: ad.image_url,
        fallbackGradient: ad.bg_gradient || "from-slate-500 to-slate-700",
        title: ad.headline || ad.title || "Special Offer",
        span: idx === 0 ? "col-span-1 md:col-span-2 row-span-2" : "col-span-1",
        aspectRatio: idx === 0 ? "aspect-[2/1] md:aspect-auto h-full" : "aspect-square",
        link: ad.cta_link || ad.link || "/store"
      })) : []);
      return;
    }
    async function loadAds() {
      const dbAds = await getAdvertisements('photo');
      if (dbAds && dbAds.length > 0) {
        setAds(dbAds.map((ad, idx) => ({
          id: ad.id,
          imageUrl: ad.image_url,
          fallbackGradient: ad.bg_gradient || "from-slate-500 to-slate-700",
          title: ad.headline || "Special Offer",
          span: idx === 0 ? "col-span-1 md:col-span-2 row-span-2" : "col-span-1",
          aspectRatio: idx === 0 ? "aspect-[2/1] md:aspect-auto h-full" : "aspect-square",
          link: ad.cta_link || "/store"
        })));
      }
    }
    loadAds();
  }, [previewData]);

  if (ads.length === 0) return null;

  return (
    <div className="w-full max-w-full overflow-hidden mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Special Offers & Highlights</h2>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full md:grid md:grid-cols-3 md:auto-rows-[250px]">
        {ads.map((poster) => (
          <Link 
            href={poster.link} 
            key={poster.id}
            {...((poster.link || "").startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={(e) => isPreview && e.preventDefault()}
            className={`w-[85vw] max-w-[320px] md:w-full flex-shrink-0 snap-start h-[200px] md:h-full group relative rounded-2xl md:rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block ${poster.span} ${poster.aspectRatio}`}
          >
            {poster.imageUrl ? (
              <>
                <img 
                  src={poster.imageUrl} 
                  alt={poster.title}
                  className="absolute inset-0 w-full h-[200px] md:h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-2xl md:rounded-none"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${poster.fallbackGradient} opacity-30 mix-blend-multiply`} />
              </>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${poster.fallbackGradient}`} />
            )}
            
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 pointer-events-none">
              <div className="relative z-10 flex justify-between items-end w-full pointer-events-auto">
                <h3 className="text-white font-bold text-xl md:text-2xl max-w-[80%] leading-tight">
                  {poster.title}
                </h3>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-slate-900 transition-colors">
                  <ArrowUpRight size={20} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
