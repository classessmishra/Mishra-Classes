"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";
import { sendPurchaseEmail } from "@/lib/email";

export async function createCourse(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').insert([data]);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/courses');
  revalidatePath('/admin/courses');
  revalidatePath('/store');
  return { success: true };
}

export async function updateCourse(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('courses').update(data).eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  revalidatePath('/courses');
  revalidatePath('/admin/courses');
  revalidatePath('/store');
  return { success: true };
}

export async function getStudentCourses(studentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('purchases')
    .select(`
      created_at,
      course_id,
      courses (*)
    `)
    .eq('student_id', studentId)
    .eq('status', 'completed');
  
  if (error) return [];
  return data.map(item => ({ ...(item.courses as any), purchase_date: item.created_at }));
}

export async function allocateCourse(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('purchases').insert({
    student_id: studentId,
    course_id: courseId,
    status: 'completed',
    razorpay_order_id: 'MANUAL_ALLOCATION',
    razorpay_payment_id: 'MANUAL_ALLOCATION'
  });

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function revokeCourse(studentId: string, courseId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('purchases')
    .delete()
    .match({ student_id: studentId, course_id: courseId });
    
  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getCourses() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('courses').select('*').order('id', { ascending: false });
  if (error) {
    console.error("Error fetching courses:", error);
    return [];
  }
  return data;
}

export async function uploadCourseThumbnail(formData: FormData) {
  const supabase = await createClient();
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const url = await uploadMediaToCloudinary(buffer, 'course-thumbnails');
  
  return { url };
}

export async function getStoreItems() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('store_items').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error("Error fetching store items:", error);
    return [];
  }
  return data;
}

export async function checkoutCart(items: any[], userId: string, paymentData: any) {
  const supabase = await createClient();
  try {
    // Fetch course details to get validity_days
    const courseIds = items.filter(i => i.type === 'course').map(i => i.id);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('id, title, validity_days')
      .in('id', courseIds);

    // Insert all purchases
    const purchases = items.map(item => {
      let expires_at = null;
      if (item.type === 'course') {
        const course = coursesData?.find(c => c.id === item.id);
        const validity_days = course?.validity_days || 365;
        expires_at = new Date(Date.now() + validity_days * 24 * 60 * 60 * 1000).toISOString();
      }

      let amount_paid = item.price;
      if (paymentData.total_paid !== undefined && paymentData.cart_total !== undefined && paymentData.cart_total > 0) {
        amount_paid = Math.round(item.price * (paymentData.total_paid / paymentData.cart_total));
      }

      return {
        student_id: userId,
        course_id: item.id,
        status: 'completed',
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        expires_at,
        amount_paid,
        coupon_code: paymentData.coupon_code || null,
        receipt_id: `RCPT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      };
    });

    const { error: purchaseError } = await supabase.from('purchases').insert(purchases);
    if (purchaseError) throw new Error(purchaseError.message);

    // Fetch user and send emails
    const { data: user } = await supabase.from('users').select('email, full_name').eq('id', userId).single();
    if (user && user.email) {
      for (const purchase of purchases) {
        const course = coursesData?.find(c => c.id === purchase.course_id);
        const courseName = course?.title || 'Course'; 
        
        try {
          await sendPurchaseEmail(
            user.email,
            user.full_name || 'Student',
            courseName, 
            purchase.amount_paid,
            purchase.razorpay_order_id
          );
        } catch (err) {
          console.error("Failed to send purchase email in checkoutCart:", err);
        }
      }
    }

    revalidatePath('/store');
    revalidatePath('/student');
    return { success: true };
  } catch (error: any) {
    console.error("Checkout Cart Error:", error);
    return { success: false, error: error.message };
  }
}

export async function claimFreeCourse(courseId: string, studentId: string) {
  const supabase = await createClient();
  try {
    const { data: course } = await supabase.from('courses').select('is_free, price, validity_days, batch_id').eq('id', courseId).single();
    if (!course || (!course.is_free && course.price > 0)) {
      throw new Error("Course is not free");
    }

    const validity_days = course.validity_days || 365;
    const expires_at = new Date(Date.now() + validity_days * 24 * 60 * 60 * 1000).toISOString();

    const purchase = {
      student_id: studentId,
      course_id: courseId,
      status: 'completed',
      razorpay_order_id: 'FREE_CLAIM',
      razorpay_payment_id: 'FREE_CLAIM',
      expires_at,
      amount_paid: 0,
      receipt_id: `CLAIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    };

    const { error: purchaseError } = await supabase.from('purchases').insert([purchase]);
    if (purchaseError) throw new Error(purchaseError.message);

    // Enroll in batch if applicable
    if (course.batch_id) {
      await supabase.from('batch_students').insert([
        { batch_id: course.batch_id, student_id: studentId }
      ]);
    }

    // Send email
    const { data: user } = await supabase.from('users').select('email, full_name').eq('id', studentId).single();
    if (user && user.email) {
      const courseDataForEmail = await supabase.from('courses').select('title').eq('id', courseId).single();
      const courseName = courseDataForEmail.data?.title || 'Course';
      
      try {
        await sendPurchaseEmail(
          user.email,
          user.full_name || 'Student',
          courseName,
          0, // Free course
          'FREE_CLAIM'
        );
      } catch (err) {
        console.error("Failed to send purchase email in claimFreeCourse:", err);
      }
    }

    revalidatePath('/store');
    revalidatePath('/student');
    return { success: true };
  } catch (error: any) {
    console.error("Claim Free Course Error:", error);
    return { success: false, error: error.message };
  }
}
