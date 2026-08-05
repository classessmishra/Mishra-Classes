import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";
import { getRazorpayConfig } from "@/utils/razorpay-config";
import { sendPurchaseEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      courseId,
      userId,
      couponCode,
      finalAmount
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !courseId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const config = getRazorpayConfig();
    const key_secret = config.key_secret;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Signature is valid. Allocate the course.
      
      // Check if already purchased to avoid duplicates
      const { data: existing } = await supabase
        .from('purchases')
        .select('receipt_id')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .maybeSingle();
        
      if (!existing) {
        const newReceiptId = `rcpt_${userId.substring(0,6)}_${Date.now()}`;
        const { error: insertError } = await supabase
          .from('purchases')
          .insert([{
            student_id: userId,
            course_id: courseId,
            status: 'completed',
            amount_paid: parseFloat(finalAmount || "0"),
            coupon_code: couponCode || null,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            receipt_id: newReceiptId
          }]);
          
        if (insertError) {
          console.error("Supabase insert error in verify-order:", insertError);
          return NextResponse.json({ error: "Database error during allocation" }, { status: 500 });
        }
        
        // Fetch user and course details for the email
        const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single();
        const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();
        
        if (user && course && user.email) {
          try {
            await sendPurchaseEmail(
              user.email,
              user.full_name || 'Student',
              course.title,
              parseFloat(finalAmount || "0"),
              razorpay_order_id
            );
          } catch (err) {
            console.error("Failed to send purchase email in verify-order:", err);
          }
        }
        
        return NextResponse.json({ success: true, receipt_id: newReceiptId });
      }

      // If already existing, just return success with the correct receipt_id
      return NextResponse.json({ success: true, receipt_id: existing.receipt_id });
    } else {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Razorpay Verify Order Error:", error);
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 }
    );
  }
}
