"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function getActiveBanners() {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function getAllBanners() {
  const { data, error } = await supabase
    .from('hero_banners')
    .select('*')
    .order('order_index', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function createBanner(data: { image_url: string, title?: string, subtitle?: string, badge_text?: string, order_index?: number }) {
  const { error } = await supabase.from('hero_banners').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/banners');
  return { success: true };
}

export async function updateBanner(id: string, data: any) {
  const { error } = await supabase.from('hero_banners').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/banners');
  return { success: true };
}

export async function deleteBanner(id: string) {
  const { error } = await supabase.from('hero_banners').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/banners');
  return { success: true };
}
