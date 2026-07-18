"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import crypto from 'crypto';

export async function registerUser(formData: any) {
  const newUserId = crypto.randomUUID();
  
  // Hash the password securely with bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(formData.password, salt);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const { error } = await supabase.from('users').insert([{
    id: newUserId,
    full_name: formData.fullName,
    email: formData.email,
    phone: formData.phone,
    password: hashedPassword, // Storing hash instead of plain text
    role: 'student',
    verification_token: verificationToken,
    is_email_verified: false
  }]);
  
  if (error) {
    if (error.code === '23505') { 
      return { success: false, error: "User with this email or phone already exists." };
    }
    return { success: false, error: error.message || "Failed to register. Please try again." };
  }
  // Send verification email
  await sendVerificationEmail(formData.email, verificationToken);

  return { success: true };
}

export async function authenticateUser(email: string, plainTextPassword: string) {
  // Fetch user from database
  const { data, error } = await supabase.from('users').select('id, full_name, role, password, is_email_verified, has_logged_in').eq('email', email).single();
  
  if (error || !data) {
    return { success: false, error: "Invalid credentials or user not found." };
  }
  
  if (data.is_email_verified === false) {
    return { success: false, error: "Please verify your email address before logging in. Check your inbox." };
  }
  
  // Check password using bcrypt
  // Fallback check for unhashed passwords (during transition phase or for hardcoded old passwords)
  const isMatch = bcrypt.compareSync(plainTextPassword, data.password) || plainTextPassword === data.password;
  
  if (!isMatch) {
    return { success: false, error: "Incorrect password." };
  }

  // Send welcome email on first login
  if (data.has_logged_in === false) {
    await sendWelcomeEmail(email, data.full_name || 'Student');
    await supabase.from('users').update({ has_logged_in: true }).eq('id', data.id);
  }

  return { success: true, data: { id: data.id, role: data.role } };
}

export async function adminResetPassword(userId: string, newPassword: string) {
  // Hash the new password securely
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);

  const { error } = await supabase
    .from('users')
    .update({ password: hashedPassword })
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}

export async function verifyEmail(token: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('verification_token', token)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid or expired verification token." };
  }

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      is_email_verified: true, 
      verification_token: null 
    })
    .eq('id', data.id);

  if (updateError) {
    return { success: false, error: "Failed to verify email. Please try again." };
  }

  return { success: true };
}

export async function forgotPassword(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) {
    // Return success anyway to prevent email enumeration attacks
    return { success: true };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      reset_password_token: resetToken,
      reset_token_expires_at: expiresAt
    })
    .eq('id', data.id);

  if (updateError) {
    return { success: false, error: "Failed to process request." };
  }

  await sendPasswordResetEmail(email, resetToken);
  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id, reset_token_expires_at')
    .eq('reset_password_token', token)
    .single();

  if (error || !data) {
    return { success: false, error: "Invalid or expired reset token." };
  }

  if (new Date(data.reset_token_expires_at) < new Date()) {
    return { success: false, error: "Reset token has expired. Please request a new one." };
  }

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(newPassword, salt);

  const { error: updateError } = await supabase
    .from('users')
    .update({ 
      password: hashedPassword,
      reset_password_token: null,
      reset_token_expires_at: null,
      is_email_verified: true
    })
    .eq('id', data.id);

  if (updateError) {
    return { success: false, error: "Failed to reset password." };
  }

  return { success: true };
}
