"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";

export async function getAdvertisements(sectionType?: string) {
  noStore();
  let query = supabase
    .from('advertisements')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
    
  if (sectionType) {
    query = query.eq('section_type', sectionType);
  }

  const { data, error } = await query;
  if (error) {
    console.error(`Error fetching ads for section ${sectionType}:`, error);
    return [];
  }
  return data;
}

export async function getAllAdvertisements() {
  noStore();
  const { data, error } = await supabase
    .from('advertisements')
    .select('*')
    .order('order_index', { ascending: true });
    
  if (error) return [];
  return data;
}

export async function createAdvertisement(data: any) {
  const { error } = await supabase.from('advertisements').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/advertisements/builder');
  return { success: true };
}

export async function updateAdvertisement(id: string, data: any) {
  const { error } = await supabase.from('advertisements').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/advertisements/builder');
  return { success: true };
}

export async function deleteAdvertisement(id: string) {
  const { error } = await supabase.from('advertisements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/');
  revalidatePath('/admin/advertisements/builder');
  return { success: true };
}

export async function uploadAdvertisementImage(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const url = await uploadMediaToCloudinary(buffer, 'advertisements');
  
  return { url };
}
