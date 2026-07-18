"use server";

import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client internally for Server Actions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-url.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Use a service key if available to bypass RLS for admin actions, or anon key if not (assuming RLS is configured appropriately)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function createLiveClass(payload: any) {
  // Extract courseIds if it's an array, otherwise fallback to single course_id
  const { course_id, course_ids, ...rest } = payload;
  const ids = course_ids && Array.isArray(course_ids) && course_ids.length > 0 
    ? course_ids 
    : (course_id ? [course_id] : []);

  if (ids.length === 0) throw new Error("No course selected.");

  // Map to multiple rows
  const finalRows = ids.map((cId: string) => ({
    ...rest,
    course_id: cId,
    topic: rest.title || 'Untitled',
    start_time: rest.scheduled_time || new Date().toISOString(),
    meeting_link: rest.youtube_video_id || ''
  }));

  const { data, error } = await supabase
    .from('live_classes')
    .insert(finalRows)
    .select();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLiveClassGroup(oldYoutubeVideoId: string, payload: any) {
  const { course_id, course_ids, ...rest } = payload;
  
  const { data: existingClasses } = await supabase
    .from('live_classes')
    .select('id, course_id')
    .eq('meeting_link', oldYoutubeVideoId);

  const existingCourseIds = existingClasses ? existingClasses.map((c: any) => c.course_id) : [];
  
  const ids = course_ids && Array.isArray(course_ids) && course_ids.length > 0 
    ? course_ids 
    : (course_id ? [course_id] : []);

  if (ids.length === 0) throw new Error("No course selected.");

  const toAdd = ids.filter((id: string) => !existingCourseIds.includes(id));
  const toDelete = existingCourseIds.filter((id: string) => !ids.includes(id));
  const toUpdate = ids.filter((id: string) => existingCourseIds.includes(id));

  // Common fields to update/insert
  const commonData = {
    ...rest,
    topic: rest.title || 'Untitled',
    start_time: rest.scheduled_time || new Date().toISOString(),
    meeting_link: rest.youtube_video_id || ''
  };

  // Perform updates
  if (toUpdate.length > 0) {
    const updatePromises = toUpdate.map((cId: string) => 
      supabase.from('live_classes').update(commonData)
        .eq('meeting_link', oldYoutubeVideoId)
        .eq('course_id', cId)
    );
    await Promise.all(updatePromises);
  }

  // Perform deletes
  if (toDelete.length > 0) {
    const classIdsToDelete = existingClasses
      ?.filter((c: any) => toDelete.includes(c.course_id))
      .map((c: any) => c.id) || [];
    
    if (classIdsToDelete.length > 0) {
      await supabase.from('live_classes').delete().in('id', classIdsToDelete);
    }
  }

  // Perform inserts
  if (toAdd.length > 0) {
    const insertRows = toAdd.map((cId: string) => ({
      ...commonData,
      course_id: cId
    }));
    await supabase.from('live_classes').insert(insertRows);
  }

  return true;
}

export async function deleteLiveClassGroup(youtubeVideoId: string) {
  const { error } = await supabase
    .from('live_classes')
    .delete()
    .eq('meeting_link', youtubeVideoId);

  if (error) throw new Error(error.message);
  return true;
}

export async function toggleLiveClassStatus(youtubeVideoId: string, isActive: boolean) {
  const { error } = await supabase
    .from('live_classes')
    .update({ is_active: isActive })
    .eq('meeting_link', youtubeVideoId);

  if (error) throw new Error(error.message);
  return true;
}

export async function getLiveClassesForCourse(courseId: string) {
  const { data, error } = await supabase
    .from('live_classes')
    .select('*, courses(title)')
    .eq('course_id', courseId)
    .or('status.neq.recorded,status.is.null')
    .order('start_time', { ascending: true }); // using start_time as that's what we map it to

  if (error) throw new Error(error.message);
  return data;
}

export async function getRecordedClassesForCourse(courseId: string) {
  const { data, error } = await supabase
    .from('live_classes')
    .select('*, courses(title)')
    .eq('course_id', courseId)
    .eq('status', 'recorded')
    .order('start_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getAllLiveClasses() {
  const { data, error } = await supabase
    .from('live_classes')
    .select('*, courses(title)')
    .or('status.neq.recorded,status.is.null')
    .order('scheduled_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function getLiveClassById(classId: string) {
  const { data, error } = await supabase
    .from('live_classes')
    .select('*, courses(title)')
    .eq('id', classId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getCanonicalLiveClassId(youtubeVideoId: string) {
  const { data, error } = await supabase
    .from('live_classes')
    .select('id')
    .eq('meeting_link', youtubeVideoId)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

export async function updateLiveClass(classId: string, payload: any) {
  // Map updates to old columns too
  const finalPayload = { ...payload };
  if (payload.title) finalPayload.topic = payload.title;
  if (payload.scheduled_time) finalPayload.start_time = payload.scheduled_time;
  if (payload.youtube_video_id) finalPayload.meeting_link = payload.youtube_video_id;

  const { data, error } = await supabase
    .from('live_classes')
    .update(finalPayload)
    .eq('id', classId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLiveClass(classId: string) {
  const { error } = await supabase
    .from('live_classes')
    .delete()
    .eq('id', classId);

  if (error) throw new Error(error.message);
  return true;
}

export async function sendChatMessage(classId: string, userName: string, userRole: string, message: string) {
  const { data, error } = await supabase
    .from('live_class_chat')
    .insert([{ class_id: classId, user_name: userName, user_role: userRole, message }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getChatHistory(classId: string) {
  const { data, error } = await supabase
    .from('live_class_chat')
    .select('*')
    .eq('class_id', classId)
    .order('created_at', { ascending: true })
    .limit(150); // Get latest 150 messages

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteChatForClass(classId: string) {
  const { error } = await supabase
    .from('live_class_chat')
    .delete()
    .eq('class_id', classId);

  if (error) throw new Error(error.message);
  return true;
}

export async function deleteChatMessageById(messageId: string) {
  const { error } = await supabase
    .from('live_class_chat')
    .delete()
    .eq('id', messageId);

  if (error) throw new Error(error.message);
  return true;
}

function parseISODuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return "00:00:00";
  
  const hours = (parseInt(match[1]) || 0);
  const minutes = (parseInt(match[2]) || 0);
  const seconds = (parseInt(match[3]) || 0);

  const h = hours > 0 ? hours.toString().padStart(2, '0') + ':' : '';
  const m = minutes.toString().padStart(2, '0') + ':';
  const s = seconds.toString().padStart(2, '0');
  
  return h + m + s;
}

export async function endAndSyncLiveClass(meetingLink: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    let durationStr = "00:00:00";

    if (apiKey) {
      try {
        const extractYouTubeId = (urlOrId: string) => {
          const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
          const match = urlOrId.match(regExp);
          return (match && match[2].length === 11) ? match[2] : urlOrId;
        };
        const ytId = extractYouTubeId(meetingLink);
        
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${ytId}&part=contentDetails,liveStreamingDetails&key=${apiKey}`);
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const isoDuration = item.contentDetails?.duration || "PT0S";
          durationStr = parseISODuration(isoDuration);

          // If YouTube hasn't processed the VOD duration yet (returns 0), we can calculate it exactly using the live stream's start and end timestamps.
          if (durationStr === "00:00:00" && item.liveStreamingDetails?.actualStartTime) {
            const startTime = new Date(item.liveStreamingDetails.actualStartTime).getTime();
            // Fallback to current time if actualEndTime is not yet populated
            const endTime = item.liveStreamingDetails.actualEndTime 
              ? new Date(item.liveStreamingDetails.actualEndTime).getTime() 
              : Date.now();
              
            const diffMs = endTime - startTime;
            if (diffMs > 0) {
               const diffSec = Math.floor(diffMs / 1000);
               const h = Math.floor(diffSec / 3600);
               const m = Math.floor((diffSec % 3600) / 60);
               const s = diffSec % 60;
               durationStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
          }
        }
      } catch (err) {
        console.error("YouTube API failed:", err);
      }
    }

    const { data: updated, error } = await supabase
      .from('live_classes')
      .update({ status: 'recorded', duration: durationStr, is_active: false })
      .eq('meeting_link', meetingLink)
      .select();

    if (error) throw new Error(error.message);
    return updated;
  } catch (err: any) {
    throw new Error(err.message);
  }
}

export async function getAllRecordedClassesGlobally() {
  const { data, error } = await supabase
    .from('live_classes')
    .select('*, courses(title)')
    .eq('status', 'recorded')
    .order('start_time', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function assignRecordingToCourse(recordingId: string, targetCourseId: string) {
  // 1. Fetch the original recording
  const { data: original, error: fetchErr } = await supabase
    .from('live_classes')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (fetchErr || !original) throw new Error(fetchErr?.message || "Recording not found");

  // 2. Check if this recording (same meeting link) is already in the target course
  const { data: existing } = await supabase
    .from('live_classes')
    .select('id')
    .eq('course_id', targetCourseId)
    .eq('meeting_link', original.meeting_link)
    .single();

  if (existing) {
    throw new Error("This recording is already assigned to the selected course.");
  }

  // 3. Duplicate the recording into the target course
  const { id, created_at, updated_at, ...rest } = original;
  const newRow = {
    ...rest,
    course_id: targetCourseId
  };

  const { data, error } = await supabase
    .from('live_classes')
    .insert([newRow])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function addManualVOD(payload: { title: string, youtubeVideoId: string, courseId?: string, duration?: string }) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  let durationStr = payload.duration || "00:00:00";

  if (!payload.duration && apiKey) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?id=${payload.youtubeVideoId}&part=contentDetails&key=${apiKey}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        const isoDuration = data.items[0].contentDetails.duration;
        durationStr = parseISODuration(isoDuration);
      }
    } catch (err) {
      console.error("Failed to fetch duration:", err);
    }
  }

  const newRow = {
    topic: payload.title,
    meeting_link: payload.youtubeVideoId,
    course_id: payload.courseId || null,
    status: 'recorded',
    duration: durationStr,
    is_active: false,
    start_time: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('live_classes')
    .insert([newRow])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
