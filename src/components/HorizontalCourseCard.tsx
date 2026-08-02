"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ShoppingBag, Video, Smartphone, FileText, Star, Users, Clock } from "lucide-react";

import { useRouter } from "next/navigation";

interface HorizontalCourseCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  discount?: string;
  badge?: string;
  imageUrl: string;
  isNew?: boolean;
  tags?: string[];
  isEnrolled?: boolean;
}

export default function HorizontalCourseCard({
  id,
  title,
  price,
  originalPrice,
  discount,
  badge,
  imageUrl,
  isNew = false,
  tags = [],
  isEnrolled = false,
}: HorizontalCourseCardProps) {
  const router = useRouter();
  const href = isEnrolled ? `/student/courses/${id}` : `/store/${id}`;

  return (
    <div 
      onClick={() => router.push(href)}
      className="cursor-pointer flex gap-4 p-4 bg-white border-b border-gray-100 last:border-0 relative hover:bg-gray-50 transition-colors"
    >
      {/* Left side: Image */}
      <div className="w-[130px] sm:w-[160px] flex-shrink-0 relative">
        <div className="aspect-[4/3] rounded-md overflow-hidden relative border border-gray-200">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 130px, 160px"
            className="object-cover"
          />
          {badge && (
            <div className="absolute bottom-0 left-0 bg-[#f24153] text-white text-[10px] font-bold px-2 py-0.5 rounded-tr-md">
              {badge}
            </div>
          )}
        </div>
      </div>

      {/* Right side: Content */}
      <div className="flex flex-col justify-between flex-1 relative z-10">
        <div>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-1.5">
            {isNew && (
              <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                NEW
              </span>
            )}
            {tags.map((tag, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase">
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 mb-1.5 hover:text-[#0088cc] transition-colors">
            {title}
          </h3>

          {/* Details / Features (Mobile & Desktop) */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3 text-gray-500 mb-1.5 md:mb-2">
            <div className="flex items-center gap-1">
              <FileText size={10} className="md:w-3 md:h-3 text-red-500" />
              <span className="text-[9px] md:text-[10px] font-medium">PDF Notes</span>
            </div>
            <div className="hidden sm:block w-[3px] h-[3px] rounded-full bg-gray-300"></div>
            <div className="hidden sm:flex items-center gap-1">
              <Clock size={10} className="md:w-3 md:h-3 text-emerald-500" />
              <span className="text-[9px] md:text-[10px] font-medium">100+ Hrs</span>
            </div>
          </div>
        </div>

        {/* Pricing & Actions */}
        <div className="flex items-end justify-between mt-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-gray-900 text-base">
                {price === 0 ? "FREE" : `₹ ${price.toLocaleString('en-IN')}`}
              </span>
              {originalPrice && originalPrice > price && (
                <span className="text-gray-400 text-xs line-through font-medium">
                  ₹ {originalPrice.toLocaleString('en-IN')}
                </span>
              )}
              {discount && (
                <span className="text-[#ff6b00] text-[10px] font-semibold">
                  {discount}
                </span>
              )}
            </div>
          </div>
          
          <button className="flex-shrink-0 ml-2 px-4 py-2 bg-[#0099ff]/10 text-[#0099ff] font-bold text-xs rounded-full hover:bg-[#0099ff] hover:text-white transition-colors duration-300 shadow-sm border border-[#0099ff]/20">
            {isEnrolled ? "Start Learning" : "View Course"}
          </button>
        </div>
      </div>
    </div>
  );
}
