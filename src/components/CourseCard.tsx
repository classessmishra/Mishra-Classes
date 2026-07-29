"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  instructor: string;
  duration: string;
  price: number;
  badge?: "LIVE" | "RECORDED" | "TEST SERIES" | "NOTES" | string;
  imageUrl: string;
  buttonText?: string;
  customHref?: string;
  isEnrolledView?: boolean;
  enrollDate?: string;
  validityDate?: string;
  onAddToCart?: () => void;
  isAddedToCart?: boolean;
}

export default function CourseCard({
  id,
  title,
  instructor,
  duration,
  price,
  badge,
  imageUrl,
  buttonText,
  customHref,
  isEnrolledView = false,
  enrollDate,
  validityDate,
  onAddToCart,
  isAddedToCart = false,
}: CourseCardProps) {
  const href = customHref || `/store/${id}`;
  return (
    <Link href={href} className="w-[85vw] max-w-[320px] md:w-full flex-shrink-0 snap-start group relative flex flex-col bg-white rounded-3xl overflow-hidden border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500">
      {/* Thumbnail Area */}
      <div className={cn("relative w-full overflow-hidden bg-slate-100 border-b border-slate-100/50", isEnrolledView ? "aspect-[21/9]" : "aspect-[16/9]")}>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-10 opacity-60 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-40" />
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {badge && (
          <div
            className={cn(
              "absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg z-20 backdrop-blur-md flex items-center gap-2",
              badge === "LIVE" ? "bg-red-500/90 text-white border border-red-400/50" : "bg-white/90 text-slate-800 border border-white/50"
            )}
          >
            {badge === "LIVE" && <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
            {badge}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={cn("flex flex-col flex-1 relative z-20 bg-white", isEnrolledView ? "p-4" : "p-4")}>
        <h3 className={cn("font-extrabold text-slate-900 leading-tight line-clamp-2 transition-colors group-hover:text-blue-700 capitalize", isEnrolledView ? "text-lg mb-2" : "text-xl tracking-tight mb-3")}>
          {title}
        </h3>
        
        {isEnrolledView ? (
          <div className="flex flex-col gap-2 text-xs text-slate-500 mb-5 bg-gradient-to-br from-slate-50 to-blue-50/30 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Enrolled On:</span>
              <span className="font-bold text-slate-900">{enrollDate || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Valid Till:</span>
              <span className="font-bold text-slate-900">{validityDate || "N/A"}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13.5px] text-slate-500 mb-5 font-medium">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <User size={15} className="text-blue-500" />
              <span>{instructor}</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Clock size={15} className="text-orange-500" />
              <span>{duration}</span>
            </div>
          </div>
        )}

        {/* Footer Area */}
        <div className={cn("mt-auto flex flex-col gap-3", isEnrolledView ? "pt-2 justify-center" : "pt-4 border-t border-slate-100")}>
          {!isEnrolledView && (
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                <span className="text-xl font-black text-slate-900 tracking-tight leading-none">
                  {price ? `₹${price.toLocaleString("en-IN")}` : "FREE"}
                </span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            {!isEnrolledView && (
              <div className="flex-1 py-2.5 text-[13px] font-bold text-center bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors">
                View Course
              </div>
            )}
            <button 
              onClick={(e) => {
                if (onAddToCart) {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAddedToCart) onAddToCart();
                }
              }}
              className={cn("font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2", 
              isEnrolledView 
                ? "w-full px-4 py-2.5 text-sm bg-blue-600 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] hover:-translate-y-0.5" 
                : isAddedToCart
                  ? "flex-1 px-3 py-2.5 text-sm bg-green-600 text-white shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5 cursor-default"
                  : "flex-1 px-3 py-2.5 text-sm bg-slate-900 text-white shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 hover:-translate-y-0.5"
            )}>
              {isEnrolledView && <CheckCircle2 size={16} />}
              {!isEnrolledView && isAddedToCart && <CheckCircle2 size={16} />}
              {isAddedToCart && !isEnrolledView ? "Added" : (buttonText || (!price || price === 0 ? "Claim for Free" : "Enroll Now"))}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
