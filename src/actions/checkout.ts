"use server";

import { supabase } from "@/lib/supabase";

export async function getCheckoutDetails(cartItemIds: string[]) {
  // Fetch detailed info for all items in the cart
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .in('id', cartItemIds);
    
  // Fetch available coupons that are active and not expired
  const { data: coupons } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .eq('show_on_checkout', true)
    .or('expiry_date.is.null,expiry_date.gt.' + new Date().toISOString());

  return {
    courses: courses || [],
    availableCoupons: coupons || []
  };
}

export async function getInvoiceDetails(orderId: string) {
  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      created_at,
      razorpay_order_id,
      amount_paid,
      coupon_code,
      receipt_id,
      courses ( id, title, price ),
      users ( * )
    `)
    .eq('razorpay_order_id', orderId);

  console.log("DEBUG getInvoiceDetails -> orderId:", orderId, "error:", error, "purchases:", purchases);

  if (error || !purchases || purchases.length === 0) return null;
  
  return purchases;
}
