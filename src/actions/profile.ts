"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";

export async function uploadProfileMedia(formData: FormData, folder: string = 'profile-media') {
  try {
    const file = formData.get('file') as File;
    if (!file) return { error: "No file uploaded" };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const url = await uploadMediaToCloudinary(buffer, folder);
    return { url };
  } catch (err: any) {
    console.error("Cloudinary upload failed:", err);
    return { error: err.message || "Failed to upload to Cloudinary" };
  }
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
  try {
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
      return { error: error.message };
    }

    revalidatePath('/student/profile');
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Unknown error occurred" };
  }
}

export async function updateAdminProfileOverrides(userId: string, data: { full_name?: string, phone?: string, email?: string, password?: string, address?: string, map_location?: string, profile_locks?: any, basic_info?: any, documents?: any }) {
  // Admin can update identity fields, password, coaching address, and profile locks
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { success: true };
}
