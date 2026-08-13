const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fix() {
  console.log("Fetching batches...");
  const { data: batches, error: batchError } = await supabase.from('batches').select('*');
  if (batchError) throw batchError;

  console.log("Fetching chat groups...");
  const { data: chatGroups, error: chatError } = await supabase.from('chat_groups').select('*');
  if (chatError) throw chatError;

  for (const batch of batches) {
    let group = chatGroups.find(g => g.batch_id === batch.id);
    
    if (!group) {
      console.log(`Creating chat group for batch: ${batch.name}`);
      const { data: newGroup, error: insertError } = await supabase.from('chat_groups').insert([{
        name: batch.name,
        is_global: false,
        batch_id: batch.id
      }]).select().single();
      
      if (insertError) {
        console.error(`Failed to create group for ${batch.name}:`, insertError);
        continue;
      }
      group = newGroup;
    }

    if (group) {
      const { data: students } = await supabase.from('batch_students').select('student_id').eq('batch_id', batch.id);
      const { data: members } = await supabase.from('chat_members').select('user_id').eq('group_id', group.id);
      
      const memberIds = new Set(members?.map(m => m.user_id) || []);
      const missingStudents = students?.filter(s => !memberIds.has(s.student_id)) || [];

      if (missingStudents.length > 0) {
        console.log(`Enrolling ${missingStudents.length} missing students in chat for batch ${batch.name}`);
        const insertPayload = missingStudents.map(s => ({
          group_id: group.id,
          user_id: s.student_id
        }));
        const { error: enrollError } = await supabase.from('chat_members').insert(insertPayload);
        if (enrollError) {
          console.error(`Failed to enroll students in chat for ${batch.name}:`, enrollError);
        }
      }
    }
  }
  console.log("Done!");
}

fix();
