import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);
import { sendPurchaseEmail } from "@/lib/email";
import { getRazorpayConfig } from "@/utils/razorpay-config";

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      courseId,
      userId,
      amountPaid,
      couponCode
    } = await req.json();

    const config = getRazorpayConfig();
    const key_secret = config.key_secret;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      
      const receiptId = `RCPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert purchase record securely using backend supabase client
      const { error } = await supabase.from('purchases').insert({
        student_id: userId,
        course_id: courseId,
        status: 'completed',
        razorpay_order_id,
        razorpay_payment_id,
        amount_paid: amountPaid,
        receipt_id: receiptId,
        coupon_code: couponCode || null
      });

      if (error) {
        console.error("Purchase insertion error:", error);
        return NextResponse.json({ error: "Payment verified but failed to record purchase." }, { status: 500 });
      }

      // Fetch user and course details for the email
      const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single();
      const { data: course } = await supabase.from('courses').select('title').eq('id', courseId).single();

      if (user && course && user.email) {
        // Send Purchase Confirmation Email and await it so it completes before response
        try {
          await sendPurchaseEmail(
            user.email, 
            user.full_name || 'Student', 
            course.title, 
            amountPaid, 
            razorpay_order_id
          );
        } catch (err) {
          console.error("Failed to send purchase email:", err);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: "Payment verified successfully",
        receipt_id: receiptId
      });
    } else {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { error: "Error verifying payment" },
      { status: 500 }
    );
  }
}
