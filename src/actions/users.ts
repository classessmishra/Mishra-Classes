"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
    .limit(20);
    
  if (error) {
    console.error("Error searching users:", error);
    return [];
  }
  return data;
}

export async function getStaffUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .neq('role', 'student')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching staff users:", error);
    return [];
  }
  return data;
}

export async function createStaffUser(formData: any) {
  const newUserId = crypto.randomUUID();
  
  // Hash the password securely with bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(formData.password, salt);

  const { error } = await supabase.from('users').insert([{
    id: newUserId,
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    password: hashedPassword,
    role: formData.role
  }]);
  
  if (error) {
    if (error.code === '23505') { 
      return { success: false, error: "A user with this email or phone already exists." };
    }
    return { success: false, error: error.message || "Failed to create staff user." };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateTeacherPermissions(userId: string, permissions: string[]) {
  const { error } = await supabase
    .from('users')
    .update({ bio: JSON.stringify({ permissions }) })
    .eq('id', userId);
    
  if (error) {
    return { success: false, error: error.message };
  }
  
  revalidatePath('/admin/staff');
  return { success: true };
}
