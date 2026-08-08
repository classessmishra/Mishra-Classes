"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getAllUsers() {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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

export async function deleteUser(userId: string) {
  const supabase = await createClient();
  try {
    // 1. Manually delete references that don't have ON DELETE CASCADE
    await supabase.from('attendance').delete().eq('student_id', userId);
    await supabase.from('test_submissions').delete().eq('student_id', userId);
    await supabase.from('purchases').delete().eq('student_id', userId);
    
    // 2. Delete from public.users (this cascades to batch_students, test_assignments, chat_members, notifications)
    const { error: userError } = await supabase.from('users').delete().eq('id', userId);
    if (userError) throw new Error(userError.message);

    // 3. Attempt to delete from auth.users using admin API (fails silently if custom auth is used)
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch(e) {
      // Ignore if user is not in auth.users
    }

    revalidatePath('/admin/users');
    revalidatePath('/admin/staff');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete user" };
  }
}

export async function savePushToken(userId: string, token: string) {
  const supabase = await createClient();
  if (!userId || !token) return { success: false, error: "Missing user ID or token" };

  try {
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) {
      console.error("Error saving push token:", error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
