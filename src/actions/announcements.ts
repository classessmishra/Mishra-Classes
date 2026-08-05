"use server";

import { supabase } from "@/lib/supabase";

import { sendMultiplePushNotifications } from "@/lib/notifications";

export async function createBatchAnnouncement(batchId: string, title: string, message: string, link_url?: string) {
  const { data, error } = await supabase
    .from('batch_announcements')
    .insert([{ batch_id: batchId, title, message, link_url }])
    .select();
    
  if (error) {
    console.error("Error creating batch announcement:", error);
    throw new Error(error.message);
  }

  // Fetch push tokens for all students in this batch
  const { data: students } = await supabase
    .from('batch_students')
    .select('student_id')
    .eq('batch_id', batchId);

  if (students && students.length > 0) {
    const studentIds = students.map((s: any) => s.student_id);
    
    const { data: users } = await supabase
      .from('users')
      .select('expo_push_token')
      .in('id', studentIds);

    if (users) {
      const tokens = Array.from(new Set(users.map((u: any) => u.expo_push_token).filter(Boolean))) as string[];
      if (tokens.length > 0) {
        await sendMultiplePushNotifications(
          tokens,
          `📢 ${title}`,
          message,
          { type: 'ANNOUNCEMENT', batchId, linkUrl: link_url }
        );
      }
    }
  }

  return data[0];
}

export async function getBatchAnnouncements(batchId: string) {
  const { data, error } = await supabase
    .from('batch_announcements')
    .select('*')
    .eq('batch_id', batchId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching batch announcements:", error);
    return [];
  }
  return data;
}

export async function deleteBatchAnnouncement(id: string) {
  const { error } = await supabase
    .from('batch_announcements')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error("Error deleting batch announcement:", error);
    throw new Error(error.message);
  }
  return { success: true };
}
