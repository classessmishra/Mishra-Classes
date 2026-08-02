"use client";

import { useState, useEffect } from "react";
import { X, Tag, Loader2, CheckCircle2 } from "lucide-react";
import { validateCoupon } from "@/actions/coupons";
import { useRouter } from "next/navigation";
import { getUserProfile, updateStudentProfile } from "@/actions/profile";

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  course,
  initialCouponCode 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  course: any;
  initialCouponCode?: string;
}) {
  const router = useRouter();
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState(course?.price || 0);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
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
    };
    if (isOpen) fetchProfile();
  }, [isOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) onClose();
    };
    if (isOpen) {
      window.history.pushState({ modal: 'checkout' }, '');
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (course) setFinalPrice(course.price);
    setPaymentError(""); // Clear error when course changes
    
    // Auto-apply initial coupon if provided
    if (initialCouponCode && course) {
      setCouponCode(initialCouponCode);
      const applyInitial = async () => {
        setValidating(true);
        try {
          const res = await validateCoupon(initialCouponCode, course.price);
          if (res.valid) {
            setAppliedCoupon(res);
            setFinalPrice(res.final_amount);
          }
        } catch (err) {
          // ignore error on initial auto-apply
        } finally {
          setValidating(false);
        }
      };
      applyInitial();
    } else {
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError("");
    }
  }, [course, isOpen, initialCouponCode]);

  if (!isOpen || !course) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setValidating(true);
    setCouponError("");
    setPaymentError("");
    try {
      const res = await validateCoupon(couponCode, course.price);
      if (res.valid) {
        setAppliedCoupon(res);
        setFinalPrice(res.final_amount);
      } else {
        setCouponError(res.message || "Invalid coupon.");
        setAppliedCoupon(null);
        setFinalPrice(course.price);
      }
    } catch (err: any) {
      setCouponError(err.message || "Failed to validate coupon.");
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setFinalPrice(course.price);
    setCouponCode("");
    setCouponError("");
  };

  const handlePayment = async () => {
    setProcessing(true);
    setPaymentError("");
    
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
      setPaymentError("Razorpay SDK failed to load. Are you online?");
      setProcessing(false);
      return;
    }

    // 2. Create Order
    try {
      // Find userId from cookie
      const match = document.cookie.match(/(^| )user_id=([^;]+)/);
      const userId = match ? match[2] : null;
      
      if (!userId) {
        setPaymentError("Please login first.");
        setProcessing(false);
        return router.push('/login');
      }

      if (!address.trim() || !city.trim() || !pincode.trim()) {
        setPaymentError("Please fill in your complete billing address (Address, City, PIN Code).");
        setProcessing(false);
        return;
      }

      try {
        await updateStudentProfile(userId, { address, city, pincode });
      } catch (e) {
        console.warn("Could not save address to profile. Did you run the SQL migration?", e);
      }

      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          couponCode: appliedCoupon ? couponCode : null,
          userId
        })
      });
      const orderData = await orderRes.json();

      if (!orderRes.ok) throw new Error(orderData.error);

      // 3. Open Razorpay Modal
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_123",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Mishra Classes",
        description: `Purchase: ${course.title}`,
        order_id: orderData.id,
        callback_url: `${window.location.origin}/api/razorpay/callback`,
        redirect: true,
        modal: {
          ondismiss: function() {
            setProcessing(false);
          }
        },
        theme: {
          color: "#2563eb" // blue-600
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        setPaymentError("Payment Failed: " + (response.error.description || response.error.reason));
        setProcessing(false);
      });
      rzp.open();

    } catch (err: any) {
      setPaymentError("Checkout Error: " + err.message);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-bold text-lg text-slate-800">{verifying ? "Verifying Payment..." : "Checkout summary"}</h2>
          {!verifying && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-5 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800">{course.title}</h3>
            <p className="text-sm text-slate-500">Mishra Classes • {course.is_live ? "Live Course" : "Recorded Course"}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Original Price</span>
              <span className="font-semibold text-slate-800">₹{course.price}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between items-center text-sm text-green-600">
                <span>Discount ({appliedCoupon.coupon.code})</span>
                <span>- ₹{appliedCoupon.discount_amount}</span>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Payable</span>
              <span className="font-extrabold text-2xl text-slate-900">₹{finalPrice}</span>
            </div>
          </div>

          {paymentError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium text-center">
              {paymentError}
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">Billing Details</h3>
            <div>
              <input 
                type="text" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Full Address (House No, Street...)" 
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="City" 
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
              <input 
                type="text" 
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="PIN Code" 
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

        </div>

        <div className="p-4 bg-slate-50 border-t border-border mt-auto">
          <button 
            onClick={handlePayment}
            disabled={processing || verifying}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50 shadow-sm shadow-blue-200 transition-all"
          >
            {verifying ? (
              <><Loader2 size={20} className="animate-spin" /> Verifying Payment...</>
            ) : processing ? (
              <><Loader2 size={20} className="animate-spin" /> Initializing...</>
            ) : (
              `Pay ₹${finalPrice} Securely`
            )}
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-3 flex items-center justify-center gap-1">
            Payments are securely processed by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
