"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import crypto from 'crypto';

export async function registerUser(formData: any) {
  const supabase = await createClient();
  
  // Use Supabase Auth for registration
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'student'
      }
    }
  });

  if (error) {
    if (error.status === 400 && error.message.includes("already registered")) {
        return { success: false, error: "User with this email already exists." };
    }
    return { success: false, error: error.message || "Failed to register. Please try again." };
  }

  // Supabase Auth sends verification email automatically if enabled in dashboard
  return { success: true };
}

export async function authenticateUser(email: string, plainTextPassword: string, loginSource: 'app' | 'web' = 'web') {
  const supabase = await createClient();
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: plainTextPassword,
  });
  
  if (authError || !authData.user) {
    return { success: false, error: "Invalid credentials or user not found." };
  }

  // Generate new session ID for single-device tracking
  const newSessionId = crypto.randomUUID();

  // Update session ID in public.users table
  const updateData: any = {
    current_app_session_id: newSessionId,
    current_web_session_id: newSessionId,
    has_logged_in: true
  };

  await supabase.from('users').update(updateData).eq('id', authData.user.id);

  // Next.js 15+ cookies() is async
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  // Set custom cookies for our enforcer and fast client checks
  const { data: userData } = await supabase.from('users').select('role').eq('id', authData.user.id).single();
  const role = userData?.role || 'student';
  
  cookieStore.set("auth_role", role, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("user_id", authData.user.id, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("device_session_id", newSessionId, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("device_login_source", loginSource, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });

  return { success: true, data: { id: authData.user.id, role: role, sessionId: newSessionId } };
}

export async function verifySession(userId: string, localSessionId: string, loginSource: 'app' | 'web') {
  if (!userId || !localSessionId) return { valid: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('current_app_session_id, current_web_session_id')
    .eq('id', userId)
    .single();

  if (error || !data) return { valid: false };

  const dbSessionId = loginSource === 'app' ? data.current_app_session_id : data.current_web_session_id;
  
  if (dbSessionId !== localSessionId) {
    return { valid: false, reason: 'session_expired' };
  }

  return { valid: true };
}

export async function adminResetPassword(userId: string, newPassword: string) {
  return { success: false, error: "Updating other users' passwords requires Supabase Admin API setup." };
}

export async function verifyEmail(token: string) {
  // Supabase Auth handles email verification via links usually.
  return { success: false, error: "Email verification is now handled directly by Supabase Auth links." };
}

export async function forgotPassword(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password`,
  });

  if (error) {
    return { success: false, error: "Failed to process request." };
  }
  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  // Assuming the user has clicked the email link and established a session
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    return { success: false, error: "Failed to reset password." };
  }
  return { success: true };
}

export async function sendOtp(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Prevent signing up non-existent users via OTP login
    }
  });

  if (error) {
    return { success: false, error: error.message || "Failed to send OTP." };
  }
  return { success: true };
}

export async function verifyOtpLogin(email: string, otp: string, loginSource: 'app' | 'web' = 'web') {
  const supabase = await createClient();
  
  const { data: authData, error: authError } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  });
  
  if (authError || !authData.user) {
    return { success: false, error: "Invalid or expired OTP." };
  }

  // Generate new session ID for single-device tracking
  const newSessionId = crypto.randomUUID();

  // Update session ID in public.users table
  const updateData: any = {
    current_app_session_id: newSessionId,
    current_web_session_id: newSessionId,
    has_logged_in: true
  };

  await supabase.from('users').update(updateData).eq('id', authData.user.id);

  // Next.js 15+ cookies() is async
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  
  // Set custom cookies for our enforcer and fast client checks
  const { data: userData } = await supabase.from('users').select('role').eq('id', authData.user.id).single();
  const role = userData?.role || 'student';
  
  cookieStore.set("auth_role", role, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("user_id", authData.user.id, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("device_session_id", newSessionId, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  cookieStore.set("device_login_source", loginSource, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });

  return { success: true, data: { id: authData.user.id, role: role, sessionId: newSessionId } };
}
