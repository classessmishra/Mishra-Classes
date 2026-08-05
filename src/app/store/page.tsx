"use client";

import { motion } from "framer-motion";
import { Download, ShoppingBag, Star, Search, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { getStoreItems, getCourses, getStudentCourses } from "@/actions/courses";
import Link from "next/link";
import HorizontalCourseCard from "@/components/HorizontalCourseCard";
import PurchasedCourseCard from "@/components/PurchasedCourseCard";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const [storeItems, setStoreItems] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_store_items');
        return cached ? JSON.parse(cached) : [];
      } catch(e) {}
    }
    return [];
  });
  const [allCourses, setAllCourses] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_all_courses');
        return cached ? JSON.parse(cached) : [];
      } catch(e) {}
    }
    return [];
  });
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cached_enrolled_courses');
        return cached ? JSON.parse(cached) : [];
      } catch(e) {}
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return !localStorage.getItem('cached_all_courses');
      } catch(e) {}
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;

      const [itemsData, coursesData, enrolledData] = await Promise.all([
        getStoreItems(),
        getCourses(),
        userId ? getStudentCourses(userId) : Promise.resolve([])
      ]);
      
      if (itemsData) {
        setStoreItems(itemsData);
        try { localStorage.setItem('cached_store_items', JSON.stringify(itemsData)); } catch(e) {}
      }
      if (coursesData) {
        setAllCourses(coursesData);
        try { localStorage.setItem('cached_all_courses', JSON.stringify(coursesData)); } catch(e) {}
      }
      if (enrolledData) {
        setEnrolledCourses(enrolledData);
        try { localStorage.setItem('cached_enrolled_courses', JSON.stringify(enrolledData)); } catch(e) {}
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredCourses = allCourses.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-20 font-sans">
      {/* Top App Bar & Search */}
      <div className="bg-white">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search for courses" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-[15px] focus:outline-none focus:border-[#0088cc] shadow-sm"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#5B58FF] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          
          {/* Purchased Courses Section */}
          {enrolledCourses.length > 0 && (
            <div className="bg-[#f5f5f5] pt-6 pb-2 px-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[17px] font-extrabold text-[#2a3036]">Purchased Courses</h2>
                <Link href="/student/courses" className="text-[13px] font-semibold text-[#0099ff] flex items-center hover:underline">
                  View All <ArrowRight size={14} className="ml-0.5" />
                </Link>
              </div>
              <div>
                {enrolledCourses.slice(0, 3).map((course, idx) => {
                  const tags = [];
                  if (course.course_type === 'live' || course.is_live) tags.push("LIVE CLASSES", "TESTS");
                  else if (course.course_type === 'test_series') tags.push("TESTS");
                  else tags.push("RECORDED");
                  
                  return (
                    <PurchasedCourseCard 
                      key={course.id || idx}
                      id={course.id}
                      title={course.title}
                      imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
                      tags={tags}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Courses List Section */}
          <div className="bg-white mt-2 pb-6">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-[17px] font-extrabold text-[#2a3036]">Courses ({filteredCourses.length})</h2>
              {/* Optional: Add Cart Icon here if not in standard navbar */}
            </div>
            
            <div className="flex flex-col">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, idx) => {
                  const isEnrolled = enrolledCourses.some(c => c.id === course.id);
                  
                  // Generate tags based on actual course data
                  const tags = [];
                  if (course.course_type === 'live' || course.is_live) {
                    tags.push("LIVE CLASSES", "TESTS");
                  } else if (course.course_type === 'test_series') {
                    tags.push("TESTS");
                  } else {
                    tags.push("RECORDED");
                  }
                  
                  if (course.is_free) tags.push("FREE CONTENT");
                  
                  return (
                    <HorizontalCourseCard
                      key={course.id || idx}
                      id={course.id}
                      title={course.title}
                      price={course.price || 0}
                      originalPrice={undefined} // Adjust if original_price is available in schema
                      discount={undefined} // Adjust if discount is available
                      badge={course.validity_text || "One Session"}
                      imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
                      isNew={idx < 2} // Just visual for now
                      tags={tags}
                      isEnrolled={isEnrolled}
                    />
                  );
                })
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No courses found matching your search.
                </div>
              )}
            </div>
          </div>
          
          {/* Study Materials */}
          {storeItems.length > 0 && (
            <div className="bg-white mt-4 pb-6 shadow-sm">
              <div className="px-4 py-4 border-b border-gray-100">
                <h2 className="text-[17px] font-extrabold text-[#2a3036]">Study Materials ({storeItems.length})</h2>
              </div>
              <div className="flex flex-col">
                {storeItems.map((item, idx) => (
                  <HorizontalCourseCard
                    key={item.id || idx}
                    id={item.id || `material_${idx}`}
                    title={item.title}
                    price={item.price || 0}
                    badge="NOTES"
                    imageUrl="/images/course_thumb.png"
                    tags={["PDF", item.category?.toUpperCase() || "MATERIAL"]}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
