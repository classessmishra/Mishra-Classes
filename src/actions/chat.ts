"use server";

import { supabase } from "@/lib/supabase";
import { uploadMediaToCloudinary, deleteMediaFromCloudinary } from "@/lib/cloudinary";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function uploadChatAttachment(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error("No file uploaded");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Use a different folder name for chat attachments
  const url = await uploadMediaToCloudinary(buffer, 'chat-media');
  
  return { url };
}

export async function createChatGroup(name: string, isGlobal: boolean = false) {
  const { data, error } = await supabase.from('chat_groups').insert([{ name, is_global: isGlobal }]).select();
  if (error) throw new Error(error.message);
  return data[0];
}

export async function addMemberToGroup(groupId: string, userId: string) {
  const { error } = await supabase.from('chat_members').insert([{ group_id: groupId, user_id: userId }]);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function removeMemberFromGroup(groupId: string, userId: string) {
  const { error } = await supabase.from('chat_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function getAllStudents() {
  const { data, error } = await supabase.from('users').select('id, full_name, phone, profile_photo_url').eq('role', 'student');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function sendNotification(userId: string, title: string, message: string, link_url?: string) {
  const { error } = await supabase.from('notifications').insert([{ user_id: userId, title, message, link_url }]);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function sendGlobalNotification(title: string, message: string, link_url?: string) {
  const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, expo_push_token')
    .eq('role', 'student');
    
  if (fetchError || !users) {
    throw new Error(fetchError?.message || "Failed to fetch students");
  }

  // Insert a notification for every student
  const inserts = users.map(u => ({ user_id: u.id, title, message, link_url }));
  
  if (inserts.length > 0) {
    const { error } = await supabase.from('notifications').insert(inserts);
    if (error) throw new Error(error.message);
  }

  // Send push notifications
  const tokens = users.map(u => u.expo_push_token).filter(Boolean);
  if (tokens.length > 0) {
    await sendMultiplePushNotifications(
      tokens,
      `📣 ${title}`,
      message,
      { 
        type: 'ANNOUNCEMENT', 
        linkUrl: link_url,
        path: link_url || '/batches' 
      }
    );
  }
  
  return { success: true };
}

export async function getUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
  return data;
}

export async function markNotificationAsRead(notifId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notifId);
    
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function clearAllNotifications(userId: string) {
  const { error } = await supabase.rpc('clear_all_notifications', { p_user_id: userId });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function clearNotification(notifId: string, userId: string) {
  const { error } = await supabase.rpc('clear_notification', { p_notif_id: notifId, p_user_id: userId });
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function toggleChatBan(userId: string, isBanned: boolean) {
  const { error } = await supabase.from('users').update({ is_banned_from_chat: isBanned }).eq('id', userId);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function checkChatBan(userId: string) {
  const { data, error } = await supabase.from('users').select('is_banned_from_chat').eq('id', userId).single();
  if (error) return false;
  return data?.is_banned_from_chat || false;
}

export async function getGroupMembers(groupId: string) {
  // First check if it's a batch group
  const { data: groupData } = await supabase
    .from('chat_groups')
    .select('batch_id')
    .eq('id', groupId)
    .single();

  if (groupData?.batch_id) {
    // Fetch from batch_students
    const { data, error } = await supabase
      .from('batch_students')
      .select(`
        users (
          id,
          full_name,
          phone,
          is_banned_from_chat
        )
      `)
      .eq('batch_id', groupData.batch_id);
      
    if (error) return [];
    return data.map((d: any) => d.users).filter(Boolean);
  } else {
    // Fetch from chat_members for generic groups
    const { data, error } = await supabase
      .from('chat_members')
      .select(`
        users (
          id,
          full_name,
          phone,
          profile_photo_url,
          is_banned_from_chat
        )
      `)
      .eq('group_id', groupId);
      
    if (error) return [];
    return data.map((d: any) => d.users).filter(Boolean);
  }
}

// -----------------------------------------
// NEW: Safe Deletion Actions
// -----------------------------------------

/**
 * Extracts the file key or public ID from an attachment URL.
 */
function extractFileId(content: string): { type: 'image' | 'pdf', id: string } | null {
  if (content.startsWith("[ATTACHMENT:IMAGE]")) {
    const urlEnd = content.indexOf('|');
    if (urlEnd === -1) return null;
    const url = content.substring("[ATTACHMENT:IMAGE]".length, urlEnd);
    
    // Cloudinary URL example: https://res.cloudinary.com/cloud/image/upload/v1234/chat-media/filename.jpg
    // We need to extract "chat-media/filename"
    try {
      const parts = url.split('/upload/');
      if (parts.length > 1) {
        const pathParts = parts[1].split('/');
        pathParts.shift(); // remove version number (e.g. v1234)
        const fullPath = pathParts.join('/');
        const publicId = fullPath.substring(0, fullPath.lastIndexOf('.')) || fullPath;
        return { type: 'image', id: publicId };
      }
    } catch (e) {
      console.error("Failed to parse Cloudinary URL:", url);
    }
  } else if (content.startsWith("[ATTACHMENT:PDF]")) {
    const urlEnd = content.indexOf('|');
    if (urlEnd === -1) return null;
    const url = content.substring("[ATTACHMENT:PDF]".length, urlEnd);
    
    // Uploadthing URL example: https://utfs.io/f/xyz123.pdf
    try {
      const parts = url.split('/f/');
      if (parts.length > 1) {
        return { type: 'pdf', id: parts[1] };
      }
    } catch (e) {
      console.error("Failed to parse Uploadthing URL:", url);
    }
  }
  return null;
}

/**
 * Safely deletes a single message and its associated cloud files.
 */
export async function deleteMessageAdmin(msgId: string) {
  // 1. Guard against temporary UI IDs
  if (msgId.startsWith('temp-')) {
    return { success: true };
  }

  // 2. Fetch message to see if it has an attachment
  const { data: msg } = await supabase.from('messages').select('content').eq('id', msgId).single();
  
  if (msg?.content) {
    const fileInfo = extractFileId(msg.content);
    if (fileInfo) {
      try {
        if (fileInfo.type === 'image') {
          await deleteMediaFromCloudinary(fileInfo.id);
        } else if (fileInfo.type === 'pdf') {
          await utapi.deleteFiles(fileInfo.id);
        }
      } catch (err) {
        console.error("Failed to delete file from cloud:", err);
      }
    }
  }

  // 2. Delete from database
  const { error } = await supabase.from('messages').delete().eq('id', msgId);
  if (error) throw new Error(error.message);
  
  return { success: true };
}

/**
 * Safely clears a whole group chat and deletes all its associated cloud files.
 */
export async function clearGroupChatAdmin(groupId: string) {
  // 1. Fetch all messages in this group that might have attachments
  const { data: messages } = await supabase
    .from('messages')
    .select('content')
    .eq('group_id', groupId)
    .like('content', '[ATTACHMENT:%');
    
  if (messages && messages.length > 0) {
    const cloudinaryIds: string[] = [];
    const utKeys: string[] = [];
    
    for (const msg of messages) {
      const fileInfo = extractFileId(msg.content);
      if (fileInfo?.type === 'image') cloudinaryIds.push(fileInfo.id);
      if (fileInfo?.type === 'pdf') utKeys.push(fileInfo.id);
    }
    
    // Delete in parallel
    try {
      const deletePromises: Promise<any>[] = [];
      if (utKeys.length > 0) {
        deletePromises.push(utapi.deleteFiles(utKeys));
      }
      for (const pubId of cloudinaryIds) {
        deletePromises.push(deleteMediaFromCloudinary(pubId));
      }
      await Promise.all(deletePromises);
    } catch (err) {
      console.error("Failed to delete some files from cloud during clear chat:", err);
    }
  }

  // 2. Delete all messages from database via RPC
  const { error } = await supabase.rpc('admin_clear_group_chat', { p_group_id: groupId });
  if (error) throw new Error(error.message);
  
  return { success: true };
}

/**
 * Safely deletes a whole chat group and all its contents
 */
export async function deleteChatGroupAdmin(groupId: string) {
  // First clear messages to clean up files
  await clearGroupChatAdmin(groupId);
  
  // Then delete the group itself
  const { error } = await supabase.from('chat_groups').delete().eq('id', groupId);
  if (error) throw new Error(error.message);
  
  return { success: true };
}

import { sendMultiplePushNotifications } from "@/lib/notifications";

/**
 * Sends a push notification to all members of a chat group (except the sender).
 */
export async function sendChatPushNotification(groupId: string, messageContent: string, senderId: string, senderName: string) {
  try {
    const [{ data: group }, members] = await Promise.all([
      supabase.from('chat_groups').select('name').eq('id', groupId).maybeSingle(),
      getGroupMembers(groupId)
    ]);
    const recipientIds = members.filter((m: any) => m.id !== senderId).map((m: any) => m.id);
    
    if (recipientIds.length === 0) return { success: true };

    const { data: users } = await supabase
      .from('users')
      .select('expo_push_token')
      .in('id', recipientIds)
      .not('expo_push_token', 'is', null);

    if (users && users.length > 0) {
      const tokens = users.map(u => u.expo_push_token).filter(Boolean);
      
      let cleanMessage = messageContent;
      if (cleanMessage.startsWith('[ATTACHMENT:IMAGE]')) cleanMessage = '📷 Photo attachment';
      else if (cleanMessage.startsWith('[ATTACHMENT:PDF]')) cleanMessage = '📄 Document PDF';

      const groupPrefix = group?.name ? `${group.name} • ` : '';
      await sendMultiplePushNotifications(
        tokens,
        `💬 ${groupPrefix}${senderName}`,
        cleanMessage,
        { 
          type: 'CHAT', 
          groupId,
          path: `/chats/student?group=${groupId}`
        }
      );
    }
    
    return { success: true };
  } catch (err: any) {
    console.error("Failed to send chat push notification:", err);
    return { success: false, error: err.message };
  }
}
