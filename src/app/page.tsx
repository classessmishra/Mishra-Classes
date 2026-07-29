import HeroSection from "@/components/HeroSection";
import CourseCard from "@/components/CourseCard";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { getCourses } from "@/actions/courses";
import AdCarousel from "@/components/AdCarousel";
import PhotoAds from "@/components/PhotoAds";
import PromoBanner from "@/components/PromoBanner";
import BentoGridAds from "@/components/BentoGridAds";
import ScrollingMarquee from "@/components/ScrollingMarquee";

import { getAdvertisements } from "@/actions/advertisements";

export default async function Home() {
  const allCourses = await getCourses();
  const recentCourses = allCourses.slice(0, 4);

  const heroAds = await getAdvertisements('hero');
  const carouselAds = await getAdvertisements('carousel');
  const bentoAds = await getAdvertisements('bento');
  const marqueeAds = await getAdvertisements('marquee');
  const photoAds = await getAdvertisements('photo');
  const promoAds = await getAdvertisements('promo');
  return (
    <main className="w-full max-w-[100vw] overflow-x-hidden container mx-auto px-4 md:px-8 py-8 md:max-w-7xl">
      {/* Hero Section */}
      <HeroSection previewData={heroAds} />

      {/* Advertisement Carousel */}
      <AdCarousel previewData={carouselAds} />

      {/* Premium Bento Grid Ads */}
      <BentoGridAds previewData={bentoAds} />

      {/* Wall of Excellence (Social Proof) */}
      <ScrollingMarquee previewData={marqueeAds} />

      {/* Static Photo Advertisements */}
      <PhotoAds previewData={photoAds} />

      {/* Free Courses Section */}
      {(() => {
        const freeCourses = allCourses.filter(c => c.is_free || c.price === 0 || !c.price).slice(0, 3);
        if (freeCourses.length === 0) return null;
        
        return (
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent p-6 md:p-10 rounded-[2.5rem] border border-emerald-500/20 shadow-lg shadow-emerald-500/5 relative overflow-hidden mb-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -z-10 mix-blend-multiply pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-3 rounded-2xl shadow-inner hidden sm:block">
                  <Star size={24} className="fill-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-tight">Free Courses</h2>
                  <p className="text-emerald-700/80 font-semibold mt-1">Start your learning journey for absolutely free!</p>
                </div>
              </div>
              <Link href="/store" className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-4 py-2 rounded-xl transition-colors hidden sm:block">
                View All Free
              </Link>
            </div>
            
            <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
              {freeCourses.map((course, idx) => (
                <CourseCard
                  key={course.id || idx}
                  id={course.id}
                  title={course.title}
                  instructor={course.instructor_name || "Prof. A. Mishra"}
                  duration={course.validity_text || "Access for 1 Year"}
                  price={0}
                  badge={course.course_type === 'live' || (course.is_live && !course.course_type) ? "LIVE" : course.course_type === 'test_series' ? "TEST SERIES" : course.course_type === 'offline' || course.course_type === 'notes' ? "CLASSROOM" : "RECORDED"}
                  imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
                  buttonText="Claim for Free"
                  customHref={`/store/${course.id}`} // Navigate to store details page so they can enroll/claim it
                />
              ))}
            </div>
          </div>
        );
      })()}

      {/* Main Content Area: Featured Courses */}
      <div>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Featured Courses</h2>
            <p className="text-muted-foreground font-medium">Explore our top-rated programs</p>
          </div>
          <Link href="/store" className="text-primary font-semibold flex items-center gap-1 hover:underline">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory no-scrollbar w-full md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible">
          {recentCourses.length > 0 ? recentCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              instructor="Prof. A. Mishra"
              duration="Access for 1 Year"
              price={course.price}
              badge={course.course_type === 'live' || (course.is_live && !course.course_type) ? "LIVE" : course.course_type === 'test_series' ? "TEST SERIES" : course.course_type === 'offline' || course.course_type === 'notes' ? "CLASSROOM" : "RECORDED"}
              imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
            />
          )) : (
            <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">No courses available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Final Call to Action Promo */}
      <div className="mt-16">
        <PromoBanner previewData={promoAds && promoAds.length > 0 ? promoAds[0] : undefined} />
      </div>
    </main>
  );
}
