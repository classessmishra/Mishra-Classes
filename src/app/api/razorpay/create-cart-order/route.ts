import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { validateCoupon } from "@/actions/coupons";
import { getRazorpayConfig } from "@/utils/razorpay-config";

const config = getRazorpayConfig();
const razorpay = new Razorpay({
  key_id: config.key_id,
  key_secret: config.key_secret,
});

export async function POST(req: Request) {
  try {
    const { amount, userId, couponCode } = await req.json();

    if (!amount || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    if (amount <= 0) {
       return NextResponse.json({ error: "Amount must be greater than 0 for Razorpay." }, { status: 400 });
    }

    let finalAmount = amount;

    if (couponCode) {
      const res = await validateCoupon(couponCode, amount);
      if (res.valid) {
        finalAmount = res.final_amount;
      } else {
        return NextResponse.json({ error: res.message }, { status: 400 });
      }
    }

    if (finalAmount <= 0) {
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
    console.error("Razorpay Create Cart Order Error:", error);
    return NextResponse.json(
      { error: "Error creating razorpay order" },
      { status: 500 }
    );
  }
}
