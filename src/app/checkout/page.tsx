"use client";

import { useCart } from "@/contexts/CartContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Tag, X, User, Clock, Globe, Calendar, Award } from "lucide-react";
import Link from "next/link";
import { checkoutCart } from "@/actions/courses";
import { getCheckoutDetails } from "@/actions/checkout";
import { getUserProfile, updateStudentProfile } from "@/actions/profile";

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  const [courseDetails, setCourseDetails] = useState<any[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    if (cartItems.length === 0 && !success) {
      router.push("/store");
      return;
    }
    
    // Fetch detailed info
    async function fetchDetails() {
      const ids = cartItems.map(i => i.id);
      if (ids.length > 0) {
        const { courses, availableCoupons } = await getCheckoutDetails(ids);
        setCourseDetails(courses);
        setAvailableCoupons(availableCoupons);
      }
      
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;
      if (userId) {
        const profile = await getUserProfile(userId);
        if (profile) {
          if (profile.address) setAddress(profile.address);
          if (profile.city) setCity(profile.city);
          if (profile.pincode) setPincode(profile.pincode);
        }
      }
    }
    fetchDetails();
  }, [cartItems, success, router]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, price: cartTotal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid coupon");
      setAppliedCoupon(data);
    } catch (err: any) {
      setCouponError(err.message);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const handlePayment = async () => {
    setProcessing(true);
    
    // 1. Load Razorpay script
    const loadScript = () => new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

    const res = await loadScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      setProcessing(false);
      return;
    }

    try {
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;
      
      if (!userId) {
        alert("Please login first.");
        setProcessing(false);
        return router.push('/login');
      }

      if (!address.trim() || !city.trim() || !pincode.trim()) {
        alert("Please fill in your complete billing address (Address, City, PIN Code).");
        setProcessing(false);
        return;
      }

      try {
        await updateStudentProfile(userId, { address, city, pincode });
      } catch (e) {
        console.warn("Could not save address to profile. Did you run the SQL migration?", e);
      }

      // 2. Create Order for entire cart
      const orderRes = await fetch("/api/razorpay/create-cart-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cartTotal,
          userId,
          couponCode: appliedCoupon ? couponCode : undefined
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // 3. Initialize Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mishra Classes",
        description: `Purchase of ${cartItems.length} items`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify and save purchase in DB
            const verifyRes = await fetch("/api/razorpay/verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            if (!verifyRes.ok) throw new Error("Payment verification failed");

            // Complete DB insertions for cart items
            const checkoutRes = await checkoutCart(cartItems, userId, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              total_paid: orderData.amount / 100,
              cart_total: cartTotal,
              coupon_code: appliedCoupon ? couponCode : null
            });

            if (checkoutRes.success) {
              setCompletedOrderId(response.razorpay_order_id);
              setSuccess(true);
              clearCart();
            } else {
              throw new Error(checkoutRes.error || "Failed to enroll in courses");
            }

          } catch (err: any) {
            console.error("Verification Error:", err);
            alert("Payment captured, but failed to process enrollment. Please contact support.");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: "Student",
          email: "student@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2563eb"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert(response.error.description);
        setProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      alert(err.message || "Something went wrong.");
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-4">Payment Successful!</h1>
        <p className="text-lg text-slate-600 mb-8">
          You have successfully purchased {cartItems.length > 0 ? cartItems.length : "your"} items. Your courses are now available in your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/student" className="inline-block bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:-translate-y-0.5 transition-all">
            Go to My Dashboard
          </Link>
          {completedOrderId && (
            <a 
              href={`/student/invoice/${completedOrderId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block bg-white border-2 border-primary text-primary font-bold px-8 py-3 rounded-xl hover:-translate-y-0.5 transition-all"
            >
              Download Invoice
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/store" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Store
      </Link>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Cart Items */}
        <div className="flex-1">
          <h1 className="text-3xl font-black text-slate-900 mb-6">Checkout</h1>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            {cartItems.map(item => {
              const details = courseDetails.find(c => c.id === item.id);
              return (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center gap-4 py-4 border-b border-slate-50 last:border-0">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img src={item.imageUrl || "/images/course_thumb.png"} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-slate-900 leading-tight">{item.title}</h3>
                    {item.type && <p className="text-[10px] uppercase font-bold text-slate-400">{item.type}</p>}
                    
                    {details && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        {details.instructor_name && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <User size={14} className="text-blue-500" />
                            <span>{details.instructor_name}</span>
                          </div>
                        )}
                        {details.total_hours && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock size={14} className="text-orange-500" />
                            <span>{details.total_hours}</span>
                          </div>
                        )}
                        {details.language && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Globe size={14} className="text-indigo-500" />
                            <span>{details.language}</span>
                          </div>
                        )}
                        {details.validity_days && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Calendar size={14} className="text-emerald-500" />
                            <span>{details.validity_days} Days Access</span>
                          </div>
                        )}
                        {details.has_certificate && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium">
                            <Award size={14} />
                            <span>Certificate Included</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="font-black text-xl md:text-2xl mt-4 md:mt-0 text-right shrink-0">
                    ₹{item.price}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Billing Details */}
          <h2 className="text-2xl font-black text-slate-900 mt-10 mb-6">Billing Details</h2>
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Full Address <span className="text-red-500">*</span></label>
              <textarea 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="House No, Street, Landmark"
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm resize-y min-h-[80px] bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">City / District <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Patna"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">PIN Code <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={pincode}
                  onChange={e => setPincode(e.target.value)}
                  placeholder="e.g. 800001"
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm bg-slate-50 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Payment Summary */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sticky top-24">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h2>
            
            {/* Coupon Section */}
            <div className="mb-6 pb-6 border-b border-slate-200">
              {appliedCoupon ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-700">
                    <Tag size={16} />
                    <span className="font-bold text-sm">"{appliedCoupon.coupon.code}" applied</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-600 hover:text-green-800 p-1">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                      className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                    >
                      {validatingCoupon ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 font-medium px-1 mt-1">{couponError}</p>}
                  
                  {/* Available Coupons */}
                  {availableCoupons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Available Coupons</p>
                      <div className="space-y-2">
                        {availableCoupons.map((c) => (
                          <div 
                            key={c.id} 
                            onClick={() => {
                              setCouponCode(c.code);
                            }}
                            className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-bold text-blue-700 text-sm">{c.code}</p>
                              <p className="text-xs text-blue-600 mt-0.5">
                                {c.discount_type === 'percent' ? `${c.discount_value}% OFF` : `₹${c.discount_value} OFF`}
                              </p>
                            </div>
                            <Tag size={16} className="text-blue-400" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-slate-600 mb-6 pb-6 border-b border-slate-200">
              <div className="flex justify-between">
                <span>Items ({cartItems.length})</span>
                <span className="font-semibold text-slate-900">₹{cartTotal}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-semibold">-₹{appliedCoupon.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Platform Fee</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8">
              <span className="text-slate-500 font-bold">Total</span>
              <span className="text-3xl font-black text-slate-900">₹{appliedCoupon ? appliedCoupon.final_amount : cartTotal}</span>
            </div>

            <button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? (
                <><Loader2 size={20} className="animate-spin" /> Processing...</>
              ) : (
                <><ShieldCheck size={20} /> Pay Securely</>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-4 font-medium flex items-center justify-center gap-1">
              Secured by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
