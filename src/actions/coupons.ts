"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function createCoupon(data: {
  code: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  expiry_date?: string;
  show_on_checkout?: boolean;
}) {
  const { error } = await supabase.from('coupons').insert([data]);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function getCoupons() {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) return [];
  return data;
}

export async function toggleCouponActive(id: string, is_active: boolean) {
  const { error } = await supabase
    .from('coupons')
    .update({ is_active })
    .eq('id', id);
    
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function updateCoupon(id: string, data: {
  code: string;
  discount_type: 'flat' | 'percent';
  discount_value: number;
  expiry_date?: string;
  show_on_checkout?: boolean;
}) {
  const { error } = await supabase.from('coupons').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function deleteCoupon(id: string) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function validateCoupon(code: string, coursePrice: number) {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return { valid: false, message: "Invalid or inactive coupon code." };
  }

  if (data.expiry_date && new Date(data.expiry_date) < new Date()) {
    return { valid: false, message: "Coupon code has expired." };
  }

  let finalAmount = coursePrice;
  let discountAmount = 0;

  if (data.discount_type === 'flat') {
    discountAmount = data.discount_value;
    finalAmount = coursePrice - discountAmount;
  } else if (data.discount_type === 'percent') {
    discountAmount = (coursePrice * data.discount_value) / 100;
    finalAmount = coursePrice - discountAmount;
  }

  if (finalAmount < 0) finalAmount = 0;

  return {
    valid: true,
    original_price: coursePrice,
    final_amount: finalAmount,
    discount_amount: discountAmount,
    coupon: data
  };
}
