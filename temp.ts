import { supabase } from './src/lib/supabase';
async function test() {
  const { data, error } = await supabase.from('advertisements').select('*').eq('section_type', 'bento');
  console.log(JSON.stringify(data, null, 2));
}
test();
