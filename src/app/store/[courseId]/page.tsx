"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PlayCircle, FileText, CheckCircle2, Clock, Globe, Award, TrendingUp, Video, Play, Share2, Star, Heart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
import { claimFreeCourse } from "@/actions/courses";
import { validateCoupon } from "@/actions/coupons";
import { getCourseInteractions, toggleLikeCourse, rateCourse } from "@/actions/interactions";
import CheckoutModal from "@/components/CheckoutModal";
import { Tag, Loader2, X } from "lucide-react";

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [ratingsAvg, setRatingsAvg] = useState("0.0");
  const [ratingsCount, setRatingsCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      // Fetch course
      const { data } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (data) setCourse(data);

      // Check if purchased and get interactions
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;
      
      if (data) {
        const stats = await getCourseInteractions(courseId, userId || undefined);
        setLikesCount(stats.likesCount);
        setRatingsAvg(stats.ratingsAvg);
        setRatingsCount(stats.ratingsCount);
        setIsLiked(stats.isLiked);
        setUserRating(stats.userRating);
        
        if (userId) {
          const { data: purchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('student_id', userId)
            .eq('course_id', courseId)
            .maybeSingle();
          if (purchase) setHasPurchased(true);
        }
      }
      setLoading(false);
    }
    loadCourse();
  }, [courseId]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-[#5B58FF] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
  
  if (!course) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="p-10 text-center text-red-500 font-bold bg-white rounded-2xl shadow-sm">Course not found.</div>
    </div>
  );

  const handleClaim = async () => {
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    const userId = match ? match[2] : null;
    
    if (!userId) {
      alert("Please log in to claim this course.");
      return;
    }

    setIsClaiming(true);
    const res = await claimFreeCourse(courseId, userId);
    if (res.success) {
      setHasPurchased(true);
      alert("Course claimed successfully!");
    } else {
      alert("Error: " + res.error);
    }
    setIsClaiming(false);
  };

  const handleLike = async () => {
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    const userId = match ? match[2] : null;
    
    if (!userId) {
      router.push('/login');
      return;
    }
    
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);
    
    await toggleLikeCourse(courseId, userId, isLiked);
  };
  
  const handleRate = async (ratingValue: number) => {
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    const userId = match ? match[2] : null;
    
    if (!userId) {
      router.push('/login');
      return;
    }
    
    setUserRating(ratingValue);
    await rateCourse(courseId, userId, ratingValue);
    
    // Refresh stats to show new average
    const stats = await getCourseInteractions(courseId, userId);
    setRatingsAvg(stats.ratingsAvg);
    setRatingsCount(stats.ratingsCount);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await validateCoupon(couponCode, course.price);
      if (res.valid) {
        setAppliedCoupon(res);
      } else {
        setCouponError(res.message || "Invalid coupon.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError("Failed to validate coupon.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handleShare = async () => {
    let url = window.location.href;
    
    // Replace localhost with actual domain for testing
    if (url.includes('localhost')) {
      url = `https://mishraclasses.com/store/${courseId}`;
    }
    
    const shareTitle = course.title;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out this course: ${shareTitle}`,
          url: url,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("Course link copied to clipboard!");
      } catch (err) {
        alert("Failed to copy link.");
      }
    }
  };

  const syllabus = course.syllabus_features || [];

  // YouTube Embed Logic
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v") || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null;
  };

  const embedUrl = getEmbedUrl(course.demo_video_url);

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-[150px] md:pb-10 font-sans">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white px-4 py-3 sticky top-0 z-50 flex items-center gap-3 shadow-sm">
        <button onClick={() => router.back()} className="text-gray-700 p-1">
          <ArrowLeft size={24} />
        </button>
        <h1 className="font-bold text-[17px] text-gray-900 line-clamp-1 flex-1">{course.title}</h1>
        <button onClick={handleShare} className="text-gray-700 p-1 hover:text-[#0099ff] transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <div className="max-w-6xl mx-auto md:px-4 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex mb-6 justify-between items-center">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors">
            <ArrowLeft size={16} /> Back to Courses
          </button>
          
          <button onClick={handleShare} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0099ff] font-medium transition-colors">
            <Share2 size={16} /> Share Course
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content Column */}
          <div className="flex-1 min-w-0">
            <div className="bg-white md:rounded-2xl md:shadow-sm overflow-hidden border-b md:border border-gray-100">
          
          {/* Media Section: Image or Video */}
          <div className="w-full aspect-video bg-black relative">
            {isPlayingVideo && course.demo_video_url ? (
              embedUrl ? (
                <iframe 
                  src={embedUrl} 
                  title="Demo Video"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <video src={course.demo_video_url} controls autoPlay className="w-full h-full object-contain" />
              )
            ) : (
              <>
                {course.thumbnail_url ? (
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover opacity-90" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <PlayCircle size={64} className="text-gray-500" />
                  </div>
                )}
                
                {/* Play Button Overlay if demo video exists */}
                {course.demo_video_url && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer group"
                    onClick={() => setIsPlayingVideo(true)}
                  >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                      <Play className="text-white ml-1 w-8 h-8 fill-white" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Badges */}
            {!isPlayingVideo && (
              <div className="absolute top-3 left-3 flex gap-2">
                {(course.course_type === 'live' || course.is_live) && (
                  <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">LIVE CLASS</span>
                )}
                {course.course_type === 'test_series' && (
                  <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">TEST SERIES</span>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="p-4 md:p-8">
            <h1 className="text-xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">
              {course.title}
            </h1>


            
            <p className="text-sm md:text-base text-gray-600 mb-6 leading-relaxed">
              {course.detailed_description || "Detailed description not provided for this course."}
            </p>

            <div className="flex items-end gap-4 mb-6 pb-6 border-b border-gray-100 lg:hidden">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-gray-900">
                  {course.is_free || course.price === 0 ? "FREE" : appliedCoupon ? `₹${appliedCoupon.final_amount}` : `₹${course.price}`}
                </span>
                {appliedCoupon ? (
                  <span className="text-sm font-semibold text-gray-400 line-through mb-1">
                    ₹{course.price}
                  </span>
                ) : (!course.is_free && course.original_price > course.price) && (
                  <span className="text-sm font-semibold text-gray-400 line-through mb-1">
                    ₹{course.original_price}
                  </span>
                )}
              </div>
              
              <div className="w-px h-6 bg-gray-200 mb-1"></div>
              
              {/* Like Button Next to Price */}
              <button 
                onClick={handleLike}
                className={`flex items-center gap-1.5 cursor-pointer mb-1.5 px-3 py-1.5 rounded-full transition-colors ${isLiked ? 'bg-red-50 text-red-500' : 'hover:bg-gray-50 text-gray-500 hover:text-red-500'}`}
              >
                <Heart size={18} className={`transition-colors ${isLiked ? 'fill-red-500' : ''}`} />
                <span className="text-sm font-medium">{isLiked ? 'Liked' : 'Like'}</span>
              </button>
            </div>

            {/* Desktop Action Button (Tablet only, hidden on lg where sidebar takes over) */}
            <div className="hidden md:block lg:hidden mb-8">
              {hasPurchased ? (
                <button 
                  onClick={() => router.push(`/student/batches/${course.batch_id || courseId}`)}
                  className="bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Start Learning
                </button>
              ) : (course.is_free || course.price === 0) ? (
                <button 
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
                >
                  {isClaiming ? "Claiming..." : "Claim For Free"}
                </button>
              ) : (
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                >
                  Buy Now - ₹{course.price}
                </button>
              )}
            </div>

            {/* Course Features */}
            <div className="lg:hidden">
              <h2 className="text-lg font-bold text-gray-900 mb-4">About this course</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Clock className="text-blue-500 mb-2" size={20} />
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Duration</p>
                <p className="font-semibold text-gray-800 text-sm">{course.total_hours || "100+ Hours"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Globe className="text-indigo-500 mb-2" size={20} />
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Language</p>
                <p className="font-semibold text-gray-800 text-sm">{course.language || "Hinglish"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <TrendingUp className="text-emerald-500 mb-2" size={20} />
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Skill Level</p>
                <p className="font-semibold text-gray-800 text-sm">{course.skill_level || "All Levels"}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Award className="text-amber-500 mb-2" size={20} />
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">Certificate</p>
                <p className="font-semibold text-gray-800 text-sm">{course.has_certificate ? "Included" : "No"}</p>
              </div>
            </div>
            </div>

            {/* Syllabus List */}
            {syllabus.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">What you will learn</h2>
                <ul className="space-y-3">
                  {syllabus.map((feature: string, idx: number) => (
                    <li key={idx} className="flex gap-3 items-start">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm md:text-base">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Coupon Section */}
            {!hasPurchased && !course.is_free && course.price > 0 && (
              <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 lg:hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Tag size={18} className="text-[#38bdf8]" />
                  <h3 className="font-bold text-gray-900 text-sm">Apply Coupon</h3>
                </div>
                
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                    <div>
                      <p className="text-green-700 font-bold text-sm uppercase">APPLIED!</p>
                      <p className="text-green-600 text-xs">You saved ₹{(course.price - appliedCoupon.final_amount).toFixed(2).replace(/\.00$/, '')}</p>
                    </div>
                    <button onClick={removeCoupon} className="text-red-500 p-1 hover:bg-red-50 rounded-full">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
                      />
                      <button 
                        onClick={handleApplyCoupon}
                        disabled={!couponCode || validatingCoupon}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 min-w-[80px] flex items-center justify-center"
                      >
                        {validatingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Rate This Course */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">Rate this course</h3>
                <p className="text-xs text-gray-500">Tap a star to give your feedback</p>
              </div>
              <div className="flex gap-1 group">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={24} 
                    onClick={() => handleRate(star)}
                    className={`cursor-pointer transition-transform transition-colors duration-200 ${
                      star <= (userRating || Math.round(Number(ratingsAvg))) 
                        ? "text-[#ffb800] fill-[#ffb800]" 
                        : "text-gray-300 hover:text-[#ffb800] hover:fill-[#ffb800]"
                    } hover:scale-110`} 
                  />
                ))}
              </div>
            </div>


          </div>
          </div>
        </div>
          
          {/* Right Sidebar (Desktop/Laptop) */}
          <div className="hidden lg:block w-[350px] shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="flex items-end gap-3 mb-6">
                <span className="text-3xl font-black text-gray-900">
                  {course.is_free || course.price === 0 ? "FREE" : appliedCoupon ? `₹${appliedCoupon.final_amount}` : `₹${course.price}`}
                </span>
                {appliedCoupon ? (
                  <span className="text-sm font-semibold text-gray-400 line-through mb-1">
                    ₹{course.price}
                  </span>
                ) : (!course.is_free && course.original_price > course.price) && (
                  <span className="text-sm font-semibold text-gray-400 line-through mb-1">
                    ₹{course.original_price}
                  </span>
                )}
              </div>
              
              <div className="mb-6">
                {hasPurchased ? (
                  <button 
                    onClick={() => router.push(`/student/batches/${course.batch_id || courseId}`)}
                    className="w-full bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                  >
                    Start Learning
                  </button>
                ) : (course.is_free || course.price === 0) ? (
                  <button 
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="w-full bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isClaiming ? "Claiming..." : "Claim For Free"}
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-[#0099ff] hover:bg-[#0088cc] text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-sm"
                  >
                    Buy Now
                  </button>
                )}
              </div>

              {/* Sidebar Coupon */}
              {!hasPurchased && !course.is_free && course.price > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={16} className="text-[#38bdf8]" />
                    <h3 className="font-bold text-gray-900 text-sm">Coupon Code</h3>
                  </div>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div>
                        <p className="text-green-700 font-bold text-sm uppercase">APPLIED!</p>
                        <p className="text-green-600 text-xs">You saved ₹{(course.price - appliedCoupon.final_amount).toFixed(2).replace(/\.00$/, '')}</p>
                      </div>
                      <button onClick={removeCoupon} className="text-red-500 p-1 hover:bg-red-50 rounded-full">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon"
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
                        />
                        <button 
                          onClick={handleApplyCoupon}
                          disabled={!couponCode || validatingCoupon}
                          className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center"
                        >
                          {validatingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                        </button>
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-2 font-medium">{couponError}</p>}
                    </div>
                  )}
                </div>
              )}

              <hr className="my-6 border-gray-100" />
              
              {/* Sidebar Features */}
              <h3 className="font-bold text-gray-900 text-sm mb-4">This course includes:</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="text-blue-500" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{course.total_hours || "100+ Hours"} on-demand video</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="text-indigo-500" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{course.language || "Hinglish"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-emerald-500" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{course.skill_level || "All Levels"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="text-amber-500" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{course.has_certificate ? "Certificate of completion" : "No Certificate"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile */}
      <div className="md:hidden fixed bottom-[64px] left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-40 flex items-center justify-between mobile-buy-bar">
        <div>
          <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Total Amount</p>
          <div className="flex items-center gap-2">
            {appliedCoupon ? (
              <div className="flex flex-col">
                <span className="font-black text-gray-900 text-lg leading-none">₹{appliedCoupon.final_amount}</span>
                <span className="text-xs text-gray-400 line-through">₹{course.price}</span>
              </div>
            ) : (
              <span className="font-black text-gray-900 text-xl">
                {course.is_free || course.price === 0 ? "FREE" : `₹${course.price}`}
              </span>
            )}
          </div>
        </div>
        
        {hasPurchased ? (
          <button 
            onClick={() => router.push(`/student/batches/${course.batch_id || courseId}`)}
            className="bg-[#38bdf8] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm"
          >
            Start Learning
          </button>
        ) : (course.is_free || course.price === 0) ? (
          <button 
            onClick={handleClaim}
            disabled={isClaiming}
            className="bg-[#38bdf8] text-white px-6 py-2.5 rounded-lg font-bold shadow-sm disabled:opacity-50"
          >
            {isClaiming ? "Claiming..." : "Claim"}
          </button>
        ) : (
          <button 
            onClick={() => setShowCheckout(true)}
            className="bg-[#38bdf8] text-white px-8 py-2.5 rounded-lg font-bold shadow-sm"
          >
            Buy Now
          </button>
        )}
      </div>

      <CheckoutModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        course={course} 
        initialCouponCode={appliedCoupon ? appliedCoupon.coupon.code : undefined}
      />
    </div>
  );
}
