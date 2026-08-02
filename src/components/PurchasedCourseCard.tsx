"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

import { useRouter } from "next/navigation";

import { PlayCircle } from "lucide-react";

interface PurchasedCourseCardProps {
  id: string;
  title: string;
  imageUrl: string;
  tags?: string[];
}

export default function PurchasedCourseCard({
  id,
  title,
  imageUrl,
  tags = [],
}: PurchasedCourseCardProps) {
  const router = useRouter();

  return (
    <div 
      onClick={() => router.push(`/student/courses/${id}`)}
      className="cursor-pointer group flex gap-4 p-4 bg-white border border-gray-100 shadow-sm rounded-xl mb-4 relative hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
    >
      {/* Left side: Image */}
      <div className="w-[120px] sm:w-[150px] flex-shrink-0 relative overflow-hidden rounded-lg">
        <div className="aspect-[4/3] rounded-lg overflow-hidden relative border border-gray-100">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
          {/* Play Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <PlayCircle className="text-blue-600 fill-blue-50 w-5 h-5 ml-0.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Content */}
      <div className="flex flex-col justify-between flex-1 relative z-10 py-1">
        <div>
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag, idx) => (
                <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          <h3 className="font-extrabold text-gray-900 text-[15px] sm:text-base leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
            {title}
          </h3>
        </div>
        
        <button 
          className="mt-3 w-full bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-lg text-center transition-all duration-300 shadow-sm border border-blue-100 hover:border-blue-600 hover:shadow-[0_4px_14px_0_rgba(37,99,235,0.2)] flex items-center justify-center gap-1.5"
        >
          <PlayCircle size={16} className="hidden sm:block" /> Start Learning
        </button>
      </div>
    </div>
  );
}
