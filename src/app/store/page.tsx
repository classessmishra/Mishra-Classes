"use client";

import { motion } from "framer-motion";
import { Download, ShoppingBag, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { getStoreItems, getCourses, getStudentCourses } from "@/actions/courses";
import Link from "next/link";
import CourseCard from "@/components/CourseCard";
import { useCart } from "@/contexts/CartContext";
import CartDrawer from "@/components/CartDrawer";
import { useRouter } from "next/navigation";

export default function StorePage() {
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartItems, addToCart } = useCart();
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
      
      setStoreItems(itemsData || []);
      setEnrolledCourses(enrolledData || []);
      setAllCourses(coursesData || []);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 max-w-7xl relative"
    >
      {/* Decorative Background Mesh */}
      <div className="absolute inset-0 z-[-1] overflow-hidden rounded-3xl pointer-events-none opacity-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-3xl mix-blend-multiply" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8 bg-card/40 backdrop-blur-3xl border border-white/50 p-8 md:p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-2xl">
          <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-widest uppercase mb-6">
            Mishra Classes Premium
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
            Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Full Potential</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 font-medium leading-relaxed">
            World-class study materials, interactive masterclasses, and comprehensive test series tailored for excellence.
          </p>
        </div>
        <div 
          onClick={() => setIsCartOpen(true)}
          className="bg-white text-slate-800 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 w-fit cursor-pointer hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border border-slate-100 shadow-sm">
          <ShoppingBag size={22} className="text-primary" /> 
          <span>View Cart <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md ml-1">{cartItems.length}</span></span>
        </div>
      </div>

      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        onCheckout={() => {
          setIsCartOpen(false);
          router.push('/checkout'); // We'll create a checkout page or handle it via a modal
        }} 
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-16">
          
          {/* Enrolled Courses Section */}
          {enrolledCourses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 border-b pb-4">My Enrolled Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {enrolledCourses.map((course, idx) => {
                  const enrollDateStr = course.purchase_date ? new Date(course.purchase_date).toLocaleDateString() : "N/A";
                  let validityDateStr = "Lifetime";
                  if (course.purchase_date) {
                    const vDate = new Date(course.purchase_date);
                    vDate.setFullYear(vDate.getFullYear() + 1); // Access for 1 Year by default
                    validityDateStr = vDate.toLocaleDateString();
                  }

                  return (
                    <CourseCard
                      key={course.id || idx}
                      id={course.id}
                      title={course.title}
                      instructor={course.instructor_name || "Prof. A. Mishra"}
                      duration={course.validity_text || "Access for 1 Year"}
                      price={course.price}
                      badge={course.course_type === 'live' || (course.is_live && !course.course_type) ? "LIVE" : course.course_type === 'test_series' ? "TEST SERIES" : course.course_type === 'offline' || course.course_type === 'notes' ? "OFFLINE CLASS" : "RECORDED"}
                      imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
                      buttonText="Go to Course"
                      customHref={`/student/courses/${course.id}`}
                      isEnrolledView={true}
                      enrollDate={enrollDateStr}
                      validityDate={validityDateStr}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* All Courses Section */}
          {allCourses.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 border-b pb-4">All Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {allCourses.map((course, idx) => {
                  const isEnrolled = enrolledCourses.some(c => c.id === course.id);
                  return (
                    <CourseCard
                      key={course.id || idx}
                      id={course.id}
                      title={course.title}
                      instructor={course.instructor_name || "Prof. A. Mishra"}
                      duration={course.validity_text || "Access for 1 Year"}
                      price={course.price}
                      badge={course.course_type === 'live' || (course.is_live && !course.course_type) ? "LIVE" : course.course_type === 'test_series' ? "TEST SERIES" : course.course_type === 'offline' || course.course_type === 'notes' ? "OFFLINE CLASS" : "RECORDED"}
                      imageUrl={course.thumbnail_url || "/images/course_thumb.png"}
                      buttonText={isEnrolled ? "Go to Course" : "Add to Cart"}
                      customHref={isEnrolled ? `/student/courses/${course.id}` : undefined}
                      isAddedToCart={cartItems.some(i => i.id === course.id)}
                      onAddToCart={isEnrolled ? undefined : () => {
                        addToCart({
                          id: course.id,
                          title: course.title,
                          price: course.price,
                          imageUrl: course.thumbnail_url || "/images/course_thumb.png",
                          type: 'course',
                          is_live: course.is_live
                        });
                        setIsCartOpen(true);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Store Items Section */}
          {storeItems.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6 border-b pb-4">Study Materials & Notes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {storeItems.map((item, idx) => (
                  <Link href={`/store/${item.id || idx}`} key={idx} className="bg-card border border-border p-6 rounded-3xl flex flex-col hover:border-primary/50 transition-all hover:shadow-md group">
                    <div className="w-full aspect-square bg-muted rounded-2xl mb-4 flex items-center justify-center text-muted-foreground/30 group-hover:bg-primary/5 transition-colors">
                      <Download size={64} className="group-hover:text-primary transition-colors" />
                    </div>
                    
                    <div className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">{item.category}</div>
                    <h3 className="font-bold text-lg text-foreground mb-2 leading-tight">{item.title}</h3>
                    
                    <div className="flex items-center gap-1 text-yellow-500 mb-6 mt-auto">
                      <Star size={16} fill="currentColor" />
                      <span className="text-sm font-semibold text-foreground">{item.rating || 4.5}</span>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                      <span className="text-xl font-extrabold text-foreground">₹{item.price}</span>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addToCart({
                            id: item.id || `material_${idx}`,
                            title: item.title,
                            price: item.price,
                            type: 'material'
                          });
                          setIsCartOpen(true);
                        }}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-primary/90"
                      >
                        {cartItems.some(i => i.id === (item.id || `material_${idx}`)) ? "Added" : "Add to Cart"}
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {allCourses.length === 0 && storeItems.length === 0 && (
            <div className="text-center py-20 bg-muted/30 rounded-3xl border border-dashed border-border">
              <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-xl font-semibold text-muted-foreground">Store is currently empty.</p>
            </div>
          )}

        </div>
      )}
    </motion.main>
  );
}
