import { NextResponse } from "next/server";
import crypto from "crypto";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";
import { getRazorpayConfig } from "@/utils/razorpay-config";

const config = getRazorpayConfig();
const razorpay = new Razorpay({
  key_id: config.key_id,
  key_secret: config.key_secret,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const razorpay_payment_id = (formData as any).get("razorpay_payment_id") as string;
    const razorpay_order_id = (formData as any).get("razorpay_order_id") as string;
    const razorpay_signature = (formData as any).get("razorpay_signature") as string;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.redirect(new URL('/student?error=Payment+Failed', req.url));
    }

    // Verify signature
    const secret = config.key_secret;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      return NextResponse.redirect(new URL('/student?error=Invalid+Signature', req.url));
    }

    // Signature is valid. Fetch the order to get notes
    const order = await razorpay.orders.fetch(razorpay_order_id);
    
    if (!order || !order.notes) {
      return NextResponse.redirect(new URL('/student?error=Order+Notes+Missing', req.url));
    }

    const { courseId, userId, couponCode, finalAmount } = order.notes as any;

    if (!courseId || !userId) {
      return NextResponse.redirect(new URL('/student?error=Invalid+Order+Data', req.url));
    }

    // Insert purchase into Supabase
    const { data: purchase, error: insertError } = await supabase
      .from('purchases')
      .insert([{
        student_id: userId,
        course_id: courseId,
        status: 'completed',
        amount_paid: parseFloat(finalAmount),
        coupon_code: couponCode || null,
        razorpay_payment_id: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        receipt_id: order.receipt || `rcpt_${userId.substring(0,6)}_${Date.now()}`
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error in callback:", insertError);
      return NextResponse.redirect(new URL('/student?error=Database+Error', req.url));
    }

    // Success! Redirect to the receipt page
    return NextResponse.redirect(new URL(`/student/payment-success?receipt_id=${purchase.receipt_id}`, req.url));

  } catch (error) {
    console.error("Razorpay Callback Error:", error);
    return NextResponse.redirect(new URL('/student?error=Internal+Server+Error', req.url));
  }
}
