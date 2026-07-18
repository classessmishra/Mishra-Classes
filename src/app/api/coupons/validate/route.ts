import { NextResponse } from "next/server";
import { validateCoupon } from "@/actions/coupons";

export async function POST(req: Request) {
  try {
    const { code, price } = await req.json();

    if (!code || price === undefined) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const res = await validateCoupon(code, price);
    
    if (!res.valid) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Coupon Validate API Error:", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
