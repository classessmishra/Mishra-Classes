"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/notifications";

export async function createBatch(data: { name: string, description?: string }) {
  // 1. Create the Batch
  const { data: batchData, error: batchError } = await supabase.from('batches').insert([data]).select().single();
  if (batchError) throw new Error(batchError.message);

  // 2. Automate: Create the corresponding Chat Group
  const { error: chatError } = await supabase.from('chat_groups').insert([{
    name: data.name,
    is_global: false,
    batch_id: batchData.id
  }]);
  if (chatError) console.error("Warning: Failed to create automated chat group for batch", chatError);

  revalidatePath('/admin/batches');
  return { success: true, batchId: batchData.id };
}

export async function enrollStudent(batchId: string, studentId: string) {
  // 1. Enroll in batch
  const { error: enrollError } = await supabase.from('batch_students').insert([{ batch_id: batchId, student_id: studentId }]);
  if (enrollError) throw new Error(enrollError.message);

  // 2. Automate: Add to corresponding Chat Group
  // First, find the chat group for this batch
  const { data: groupData } = await supabase.from('chat_groups').select('id').eq('batch_id', batchId).single();
  if (groupData) {
    const { error: chatMemberError } = await supabase.from('chat_members').insert([{
      group_id: groupData.id,
      user_id: studentId
    }]);
    if (chatMemberError) console.error("Warning: Failed to add student to automated chat group", chatMemberError);
  }

  revalidatePath('/admin/batches');
  return { success: true };
}

export async function unenrollStudent(batchId: string, studentId: string) {
  // 1. Remove from batch
  const { error: unenrollError } = await supabase.from('batch_students').delete().match({ batch_id: batchId, student_id: studentId });
  if (unenrollError) throw new Error(unenrollError.message);

  // 2. Automate: Remove from corresponding Chat Group
  const { data: groupData } = await supabase.from('chat_groups').select('id').eq('batch_id', batchId).single();
  if (groupData) {
    const { error: chatMemberError } = await supabase.from('chat_members').delete().match({
      group_id: groupData.id,
      user_id: studentId
    });
    if (chatMemberError) console.error("Warning: Failed to remove student from automated chat group", chatMemberError);
  }

  revalidatePath('/admin/batches');
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getStudentBatches(studentId: string) {
  const { data, error } = await supabase
    .from('batch_students')
    .select(`
      batch_id,
      batches (*)
    `)
    .eq('student_id', studentId);
  
  if (error) return [];
  return data.map(item => item.batches);
}

export async function updateBatch(batchId: string, data: { name?: string, description?: string, course?: string, subject?: string }) {
  const { error } = await supabase.from('batches').update(data).eq('id', batchId);
  if (error) throw new Error(error.message);
  
  // Update chat group name too
  if (data.name) {
    await supabase.from('chat_groups').update({ name: data.name }).eq('batch_id', batchId);
  }
  
  revalidatePath('/admin/batches');
  return { success: true };
}

export async function getBatches() {
  const { data, error } = await supabase
    .from('batches')
    .select(`
      *,
      batch_students (
        student_id,
        users (
          full_name,
          phone
        )
      )
    `)
    .order('created_at', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function getStudentsInBatch(batchId: string) {
  const { data, error } = await supabase
    .from('batch_students')
    .select(`
      student_id,
      users ( id, full_name, phone )
    `)
    .eq('batch_id', batchId);
  
  if (error) return [];
  return data.map(item => item.users);
}

export async function getBatchStudents(batchId: string) {
  const { data, error } = await supabase
    .from('batch_students')
    .select(`
      id,
      users:student_id (
        id,
        full_name,
        email,
        phone,
        expo_push_token
      )
    `)
    .eq('batch_id', batchId);
    
  if (error) {
    console.error("Error fetching batch students:", error);
    return [];
  }
  
  return data.map(item => item.users);
}

export async function markAttendance(batchId: string, studentId: string, date: string, status: 'present' | 'absent') {
  // Upsert to handle updates if they change mind
  const { error } = await supabase.from('attendance').upsert({
    batch_id: batchId,
    student_id: studentId,
    date: date,
    status: status
  }, {
    onConflict: 'batch_id,student_id,date'
  });
  
  if (error) {
    console.error("Error marking attendance:", error);
    throw new Error(error.message);
  }

  // Fetch student push token
  const { data: user } = await supabase
    .from('users')
    .select('expo_push_token')
    .eq('id', studentId)
    .single();

  if (user?.expo_push_token) {
    const statusText = status === 'present' ? 'Present ✅' : 'Absent ❌';
    const message = status === 'present' 
      ? `You have been marked present for ${date}.` 
      : `You have been marked absent for ${date}. Please check your classes.`;

    await sendPushNotification(
      user.expo_push_token,
      `Attendance Update: ${statusText}`,
      message,
      { type: 'ATTENDANCE', path: '/student' }
    );
  }
  
  return { success: true };
}

export async function getStudentAttendance(batchId: string, studentId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('batch_id', batchId)
    .eq('student_id', studentId)
    .order('date', { ascending: false });
    
  if (error) return [];
  return data;
}

export async function getBatchAttendanceHistory(batchId: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      users (
        id,
        full_name,
        phone
      )
    `)
    .eq('batch_id', batchId)
    .order('date', { ascending: false });
    
  if (error) {
    console.error("Error fetching batch attendance history:", error);
    return [];
  }
  return data;
}

export async function getAttendanceByDate(batchId: string, date: string) {
  const { data, error } = await supabase
    .from('attendance')
    .select('student_id, status')
    .eq('batch_id', batchId)
    .eq('date', date);
  if (error) return [];
  return data;
}

export async function removeAttendance(batchId: string, studentId: string, date: string) {
  const { error } = await supabase
    .from('attendance')
    .delete()
    .eq('batch_id', batchId)
    .eq('student_id', studentId)
    .eq('date', date);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getBatchTimings(batchId: string) {
  const { data, error } = await supabase.from('batch_timings').select('*').eq('batch_id', batchId).order('start_time', { ascending: true });
  if (error) return [];
  return data;
}

export async function addBatchTiming(batchId: string, dayOfWeek: string, startTime: string, endTime: string, subject: string) {
  const { error } = await supabase.from('batch_timings').insert([{
    batch_id: batchId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
    subject: subject
  }]);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function removeBatchTiming(timingId: string) {
  const { error } = await supabase.from('batch_timings').delete().eq('id', timingId);
  if (error) throw new Error(error.message);
  return { success: true };
}
