export function getRazorpayConfig() {
  // Always use live keys for all environments as requested by user
  return {
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_LIVE_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "",
  };
}

// Client-side helper
export function getRazorpayKeyId() {
  // Always use live keys for all environments
  return process.env.NEXT_PUBLIC_RAZORPAY_LIVE_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
}
