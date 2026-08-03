import { NextResponse } from "next/server";
import crypto from "crypto";
import { getRazorpayConfig } from "@/utils/razorpay-config";

export async function POST(req: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = await req.json();

    const config = getRazorpayConfig();
    const key_secret = config.key_secret;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", key_secret)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
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
