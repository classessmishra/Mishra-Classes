const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  const { error } = await supabase
    .from('purchases')
    .insert([{
      student_id: '00000000-0000-0000-0000-000000000000', // invalid uuid might throw fk error
      course_id: '00000000-0000-0000-0000-000000000000',
      status: 'completed',
      amount_paid: 1,
      coupon_code: null,
      razorpay_payment_id: 'pay_test',
      razorpay_order_id: 'order_test',
      receipt_id: 'rcpt_test'
    }]);
  
  console.log("Insert Error:", error);
}

testInsert();
