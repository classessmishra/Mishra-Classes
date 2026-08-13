import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // 1. Fetch all batches
    const { data: batches, error: batchError } = await supabase.from('batches').select('*');
    if (batchError) throw batchError;

    // 2. Fetch all chat groups
    const { data: chatGroups, error: chatError } = await supabase.from('chat_groups').select('*');
    if (chatError) throw chatError;

    const results = [];

    // 3. Check each batch
    for (const batch of batches) {
      let group = chatGroups.find(g => g.batch_id === batch.id);
      
      if (!group) {
        // Create missing chat group
        const { data: newGroup, error: insertError } = await supabase.from('chat_groups').insert([{
          name: batch.name,
          is_global: false,
          batch_id: batch.id
        }]).select().single();
        
        if (insertError) {
          results.push({ batch: batch.name, status: "Failed to create group", error: insertError });
          continue;
        }
        
        group = newGroup;
        results.push({ batch: batch.name, status: "Created missing group", group });
      }

      // 4. Ensure all students in this batch are in the chat group
      if (group) {
        const { data: students } = await supabase.from('batch_students').select('student_id').eq('batch_id', batch.id);
        const { data: members } = await supabase.from('chat_members').select('user_id').eq('group_id', group.id);
        
        const memberIds = new Set(members?.map(m => m.user_id) || []);
        const missingStudents = students?.filter(s => !memberIds.has(s.student_id)) || [];

        if (missingStudents.length > 0) {
          const insertPayload = missingStudents.map(s => ({
            group_id: group.id,
            user_id: s.student_id
          }));
          const { error: enrollError } = await supabase.from('chat_members').insert(insertPayload);
          if (enrollError) {
            results.push({ batch: batch.name, status: "Failed to enroll students in chat", error: enrollError });
          } else {
            results.push({ batch: batch.name, status: `Enrolled ${missingStudents.length} missing students in chat` });
          }
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack });
  }
}


