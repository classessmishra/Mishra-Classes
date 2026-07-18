import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";
import { validateCoupon } from "@/actions/coupons";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

export async function POST(req: Request) {
  try {
    const { courseId, couponCode, userId } = await req.json();

    if (!courseId || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // 1. Fetch course price securely
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('price')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    let finalAmount = course.price;

    // 2. Validate coupon securely
    if (couponCode) {
      const res = await validateCoupon(couponCode, course.price);
      if (res.valid) {
        finalAmount = res.final_amount;
      } else {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
    }

    if (finalAmount <= 0) {
       // If price is 0 (100% off), maybe skip razorpay entirely? 
       // For now, let's just error since razorpay requires > 1 INR.
       return NextResponse.json({ error: "Amount must be greater than 0 for Razorpay." }, { status: 400 });
    }

    const options = {
      amount: Math.round(finalAmount * 100), // paise
      currency: "INR",
      receipt: `rcpt_${userId.substring(0,6)}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json(
      { error: "Error creating razorpay order" },
      { status: 500 }
    );
  }
}
