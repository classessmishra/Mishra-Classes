"use client";

import { useState } from "react";
import Script from "next/script";

interface CheckoutButtonProps {
  courseId: string;
  amount: number; // in INR
}

export default function CheckoutButton({ courseId, amount }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const makePayment = async () => {
    setLoading(true);
    try {
      // 1. Create order
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, receipt: `receipt_${courseId}` }),
      });
      const order = await res.json();

      if (order.error) throw new Error(order.error);

      // 2. Open Razorpay Widget
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
        amount: order.amount,
        currency: order.currency,
        name: "Mishra Classes",
        description: "Course Enrollment",
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.error) {
            alert("Payment verification failed.");
          } else {
            alert("Payment successful! You are now enrolled.");
            // Redirect to student dashboard
            window.location.href = "/student";
          }
        },
        prefill: {
          name: "Student Name",
          email: "student@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#0044CC",
        },
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <button
        onClick={makePayment}
        disabled={loading}
        className="px-5 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-70"
      >
        {loading ? "Processing..." : "Enroll Now"}
      </button>
    </>
  );
}
