import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "order.paid" || event.event === "payment.captured") {
      const order = event.payload.order?.entity || event.payload.payment?.entity;
      const notes = order?.notes || {};

      const { courseId, userId, couponCode, finalAmount } = notes;

      if (!courseId || !userId) {
        return NextResponse.json({ error: "Missing courseId or userId in notes" }, { status: 400 });
      }

      // Check if already purchased
      const { data: existing } = await supabase
        .from('purchases')
        .select('id')
        .eq('student_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!existing) {
        const { error: insertError } = await supabase
          .from('purchases')
          .insert([{
            student_id: userId,
            course_id: courseId,
            status: 'completed',
            amount_paid: parseFloat(finalAmount || "0"),
            coupon_code: couponCode || null,
            razorpay_payment_id: event.payload.payment?.entity?.id || order.id,
            razorpay_order_id: event.payload.order?.entity?.id || order.order_id,
            receipt_id: order.receipt || `rcpt_${userId.substring(0,6)}_${Date.now()}`
          }]);

        if (insertError) {
          console.error("Webhook Supabase insert error:", insertError);
          return NextResponse.json({ error: "Database error during allocation" }, { status: 500 });
        }
        
        console.log(`Course ${courseId} allocated to user ${userId} via Webhook`);
      } else {
        console.log(`User ${userId} already has course ${courseId} (Webhook ignored)`);
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
  }
}
