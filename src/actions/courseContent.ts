"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { uploadMediaToCloudinary } from "@/lib/cloudinary";

// Live Classes
export async function getLiveClasses(courseId: string) {
  noStore();
  const { data, error } = await supabase
    .from('live_classes')
    .select('*')
    .eq('course_id', courseId)
    .order('start_time', { ascending: true });
  
  if (error) {
    console.error("Error fetching live classes:", error);
    return [];
  }
  return data;
}

export async function createLiveClass(data: any) {
  const { error } = await supabase.from('live_classes').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${data.course_id}`);
  revalidatePath(`/student/courses/${data.course_id}`);
  return { success: true };
}

export async function deleteLiveClass(id: string, courseId: string) {
  const { error } = await supabase.from('live_classes').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}

// Recorded Classes
export async function getRecordedClasses(courseId: string) {
  noStore();
  const { data: oldData, error: oldErr } = await supabase
    .from('recorded_classes')
    .select('*')
    .eq('course_id', courseId);
    
  const { data: newData, error: newErr } = await supabase
    .from('live_classes')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'recorded');

  const extractYouTubeId = (urlOrId: string) => {
    if (!urlOrId) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = String(urlOrId).match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
  };

  const parseISODuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "00:00:00";
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    const h = hours > 0 ? hours.toString().padStart(2, '0') + ':' : '';
    const m = minutes.toString().padStart(2, '0') + ':';
    const s = seconds.toString().padStart(2, '0');
    return h + m + s;
  };

  const apiKey = process.env.YOUTUBE_API_KEY;

  // Fix old data (recorded_classes)
  if (apiKey && oldData) {
    await Promise.all(oldData.map(async (item) => {
      if (!item.duration_mins || String(item.duration_mins) === "0" || String(item.duration_mins) === "00:00:00") {
         const ytId = extractYouTubeId(item.video_url);
         if (ytId && ytId.length === 11) {
           try {
             const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${ytId}&part=contentDetails&key=${apiKey}`);
             const data = await res.json();
             if (data.items && data.items.length > 0) {
               const isoDur = data.items[0].contentDetails?.duration || "PT0S";
               const newDur = parseISODuration(isoDur);
               if (newDur !== "00:00:00") {
                  await supabase.from('recorded_classes').update({ duration_mins: newDur }).eq('id', item.id);
                  item.duration_mins = newDur;
               }
             }
           } catch(e) { console.error(e) }
         }
      }
    }));
  }

  // Fix new data (live_classes VODs)
  if (apiKey && newData) {
    await Promise.all(newData.map(async (item) => {
      if (!item.duration || String(item.duration) === "0" || String(item.duration) === "00:00:00") {
         const ytId = extractYouTubeId(item.meeting_link);
         if (ytId && ytId.length === 11) {
           try {
             const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${ytId}&part=contentDetails&key=${apiKey}`);
             const data = await res.json();
             if (data.items && data.items.length > 0) {
               const isoDur = data.items[0].contentDetails?.duration || "PT0S";
               const newDur = parseISODuration(isoDur);
               if (newDur !== "00:00:00") {
                  await supabase.from('live_classes').update({ duration: newDur }).eq('id', item.id);
                  item.duration = newDur;
               }
             }
           } catch(e) { console.error(e) }
         }
      }
    }));
  }

  const formattedOld = (oldData || []).map(item => ({
    id: item.id,
    title: item.title,
    video_url: item.video_url,
    duration_mins: item.duration_mins,
    class_date: item.class_date,
    is_live_vod: false,
    folder_id: item.folder_id
  }));

  const formattedNew = (newData || []).map(item => ({
    id: item.id,
    title: item.topic,
    video_url: `https://www.youtube.com/embed/${extractYouTubeId(item.meeting_link)}`,
    duration_mins: item.duration || "0",
    class_date: item.start_time,
    is_live_vod: true,
    folder_id: item.folder_id
  }));

  return [...formattedOld, ...formattedNew].sort((a, b) => new Date(b.class_date).getTime() - new Date(a.class_date).getTime());
}

export async function createRecordedClass(data: any) {
  const { error } = await supabase.from('recorded_classes').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${data.course_id}`);
  revalidatePath(`/student/courses/${data.course_id}`);
  return { success: true };
}

export async function deleteRecordedClass(id: string, courseId: string, isLiveVod: boolean = false) {
  let error;
  if (isLiveVod) {
    const res = await supabase.from('live_classes').delete().eq('id', id);
    error = res.error;
  } else {
    const res = await supabase.from('recorded_classes').delete().eq('id', id);
    error = res.error;
  }
  
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}

// Course Materials
export async function getCourseMaterials(courseId: string) {
  noStore();
  const { data, error } = await supabase
    .from('course_materials')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching course materials:", error);
    return [];
  }
  return data;
}

export async function getAllCourseMaterialsGlobally() {
  noStore();
  const { data, error } = await supabase
    .from('course_materials')
    .select('*, courses(title)')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error("Error fetching global materials:", error);
    return [];
  }
  return data;
}

export async function assignMaterialToCourse(materialId: string, targetCourseId: string) {
  const { data: original, error: fetchErr } = await supabase
    .from('course_materials')
    .select('*')
    .eq('id', materialId)
    .single();

  if (fetchErr || !original) throw new Error(fetchErr?.message || "Material not found");

  const { data: existing } = await supabase
    .from('course_materials')
    .select('id')
    .eq('course_id', targetCourseId)
    .eq('file_url', original.file_url)
    .single();

  if (existing) throw new Error("This material is already assigned to the selected course.");

  const { id, created_at, updated_at, ...rest } = original;
  const newRow = { ...rest, course_id: targetCourseId };

  const { data, error } = await supabase.from('course_materials').insert([newRow]).select().single();
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${targetCourseId}`);
  revalidatePath(`/student/courses/${targetCourseId}`);
  return data;
}

export async function createCourseMaterial(data: any) {
  const { error } = await supabase.from('course_materials').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${data.course_id}`);
  revalidatePath(`/student/courses/${data.course_id}`);
  return { success: true };
}

export async function deleteCourseMaterial(id: string, courseId: string) {
  const { error } = await supabase.from('course_materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}

export async function uploadMaterialFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const url = await uploadMediaToCloudinary(buffer, 'course-materials');
  
  return { url };
}

// Folders
export async function getCourseFolders(courseId: string) {
  noStore();
  const { data, error } = await supabase
    .from('course_folders')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error("Error fetching course folders:", error);
    return [];
  }
  return data;
}

export async function createCourseFolder(courseId: string, name: string) {
  const { error } = await supabase.from('course_folders').insert([{ course_id: courseId, name }]);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}

export async function deleteCourseFolder(folderId: string, courseId: string) {
  const { error } = await supabase.from('course_folders').delete().eq('id', folderId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/student/courses/${courseId}`);
  return { success: true };
}
