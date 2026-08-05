"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";

export async function uploadProfileMedia(formData: FormData, folder: string = 'profile-media') {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const url = await uploadMediaToCloudinary(buffer, folder);
  return { url };
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
  return data;
}

export async function updateStudentProfile(userId: string, data: any) {
  // Students can only update specific fields, NEVER name, phone, or email
  const safeData = {
    profile_photo_url: data.profile_photo_url,
    documents: data.documents, // JSON array
    address: data.address,
    city: data.city,
    pincode: data.pincode,
    bio: data.bio,
    basic_info: data.basic_info // JSON object for new profile details
  };

  // Remove undefined fields
  Object.keys(safeData).forEach(key => safeData[key as keyof typeof safeData] === undefined && delete safeData[key as keyof typeof safeData]);

  const { error } = await supabase
    .from('users')
    .update(safeData)
    .eq('id', userId);

  if (error) {
    // If column doesn't exist, Supabase will throw an error. We should handle it gracefully or rely on the schema having these columns.
    throw new Error(error.message);
  }

  revalidatePath('/student/profile');
  return { success: true };
}

export async function updateAdminProfileOverrides(userId: string, data: { full_name?: string, phone?: string, email?: string, password?: string, address?: string, map_location?: string }) {
  // Admin can update identity fields, password, and coaching address
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { success: true };
}
