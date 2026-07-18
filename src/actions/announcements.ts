"use server";

import { supabase } from "@/lib/supabase";

export async function createBatchAnnouncement(batchId: string, title: string, message: string, link_url?: string) {
  const { data, error } = await supabase
    .from('batch_announcements')
    .insert([{ batch_id: batchId, title, message, link_url }])
    .select();
    
  if (error) {
    console.error("Error creating batch announcement:", error);
    throw new Error(error.message);
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
