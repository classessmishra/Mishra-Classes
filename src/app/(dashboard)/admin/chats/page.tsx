"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Search, MoreVertical, Paperclip, Hash, User, Ban, Users, X, Check, FileText, Loader2, Image as ImageIcon, Download, Pin, PinOff, Eye } from "lucide-react";
import { toggleChatBan, getGroupMembers, uploadChatAttachment, addMemberToGroup, removeMemberFromGroup, getAllStudents, deleteMessageAdmin, clearGroupChatAdmin, deleteChatGroupAdmin, sendChatPushNotification } from "@/actions/chat";
import { uploadFiles } from "@/utils/uploadthing";

const getHashStr = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  return Math.abs(hash).toString().substring(0, 8);
};

const parseMessageContent = (content: string) => {
  if (!content) return { type: 'text', url: null, text: '', filename: '' };
  if (content.startsWith("[ATTACHMENT:IMAGE]")) {
    const parts = content.split("|");
    const url = parts[0].replace("[ATTACHMENT:IMAGE]", "");
    const text = parts.slice(1).join("|");
    return { type: 'image', url, text, filename: `${getHashStr(url)}.jpg` };
  } else if (content.startsWith("[ATTACHMENT:PDF]")) {
    const parts = content.split("|");
    const url = parts[0].replace("[ATTACHMENT:PDF]", "");
    const text = parts.slice(1).join("|");
    return { type: 'pdf', url, text, filename: `${getHashStr(url)}.pdf` };
  }
  return { type: 'text', url: null, text: content, filename: '' };
};

const handleDownloadFile = async (url: string | null, type: string, filename?: string) => {
  if (!url) return;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const isPdf = type === 'pdf' || url.toLowerCase().endsWith('.pdf') || blob.type.includes('pdf');
    let mimeType = blob.type;
    let finalFilename = filename || url.split('/').pop() || 'download';
    if (isPdf && !mimeType) mimeType = 'application/pdf';
    if (!isPdf && !mimeType) mimeType = 'image/jpeg';

    if (typeof window !== 'undefined' && (window as any).ReactNativeWebView && (window as any).ReactNativeWebView.postMessage) {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result;
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_FILE',
          base64: base64data,
          filename: finalFilename,
          mimeType: mimeType,
          dialogTitle: `Download Attachment`
        }));
      };
    } else {
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.error("Failed to download attachment via fetch, falling back to window.open:", err);
    window.open(url, '_blank');
  }
};

export default function AdminChatsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [membersSearchQuery, setMembersSearchQuery] = useState("");
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [acceptType, setAcceptType] = useState("image/*,application/pdf");
  const attachMenuRef = useRef<HTMLDivElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<{url: string, type: string, filename: string} | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedPinned = localStorage.getItem('pinnedChats_admin');
    if (savedPinned) {
      try { setPinnedChats(JSON.parse(savedPinned)); } catch(e) {}
    }
  }, []);

  const togglePinChat = () => {
    if (!activeGroupId) return;
    setPinnedChats(prev => {
      const newPinned = prev.includes(activeGroupId) ? prev.filter(id => id !== activeGroupId) : [...prev, activeGroupId];
      localStorage.setItem('pinnedChats_admin', JSON.stringify(newPinned));
      return newPinned;
    });
    setShowMenu(false);
  };

  const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000000"; 

  useEffect(() => {
    fetchGroups();
    
    const handleUnreadUpdate = () => {
      try {
        const counts = JSON.parse(localStorage.getItem('admin_unread_counts') || '{}');
        setGroups(prev => prev.map(g => ({
          ...g,
          unread_count: counts[g.id] || 0
        })));
      } catch(e) {}
    };
    window.addEventListener('admin_unread_updated', handleUnreadUpdate);
    return () => window.removeEventListener('admin_unread_updated', handleUnreadUpdate);
  }, []);



  useEffect(() => {
    if (activeGroupId) {
      setMessages([]);
      fetchMessages(activeGroupId);
      
      // ROBUST POLLING FALLBACK FOR REALTIME CHAT
      const pollInterval = setInterval(async () => {
        // Fetch latest messages for active chat
        const { data: newMsgs } = await supabase
          .from('messages')
          .select('*, users(*), reply_to:messages(id, content, sender_id, users(*))')
          .eq('group_id', activeGroupId)
          .order('created_at', { ascending: false })
          .limit(15);
          
        if (newMsgs && newMsgs.length > 0) {
          setMessages(prev => {
            const newMap = new Map(prev.map(m => [m.id, m]));
            let hasNew = false;
            
            // Step 1: Process and deduplicate all new messages
            newMsgs.forEach(m => {
              const tempMsg = prev.find(pm => pm.id.toString().startsWith('temp-') && pm.content === m.content && pm.sender_id === m.sender_id);
              
              if (tempMsg) {
                newMap.delete(tempMsg.id);
                newMap.set(m.id, m);
                hasNew = true;
              } else if (!newMap.has(m.id)) {
                newMap.set(m.id, m);
                hasNew = true;
              }
            });

            // Step 2: Ensure any msg.reply_to data is preserved as a fallback if the target ID is still missing
            if (hasNew) {
              const finalArr = Array.from(newMap.values());
              finalArr.forEach(m => {
                if (m.reply_to_id && !newMap.has(m.reply_to_id) && m.reply_to) {
                  // If the replied message isn't in state, but we got the nested reply_to object, insert it as a dummy message
                  // so messages.find() will succeed
                  const nestedReply = Array.isArray(m.reply_to) ? m.reply_to[0] : m.reply_to;
                  if (nestedReply && nestedReply.id) {
                     newMap.set(nestedReply.id, {
                        ...nestedReply,
                        id: nestedReply.id,
                        group_id: m.group_id,
                        created_at: m.created_at // fallback
                     });
                  }
                }
              });
              return Array.from(newMap.values()).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
            return prev;
          });
        }
      }, 2000);

      const groupsPollInterval = setInterval(async () => {
        // Lightweight check for latest messages in all member groups
        const { data: latestMsgs } = await supabase
          .from('messages')
          .select('group_id, content, created_at')
          .order('created_at', { ascending: false })
          .limit(20);
          
        if (latestMsgs) {
          setGroups(prevGroups => {
            let updated = false;
            const newGroups = prevGroups.map(g => {
              const latestForGroup = latestMsgs.find(m => m.group_id === g.id);
              if (latestForGroup && new Date(latestForGroup.created_at).getTime() > new Date(g.last_message_time || 0).getTime()) {
                updated = true;
                return { ...g, last_message_content: latestForGroup.content, last_message_time: latestForGroup.created_at };
              }
              return g;
            });
            
            if (updated) {
              newGroups.sort((a, b) => new Date(b.last_message_time || b.created_at).getTime() - new Date(a.last_message_time || a.created_at).getTime());
              return newGroups;
            }
            return prevGroups;
          });
        }
      }, 5000);

      // Local state reset when selecting chat
      setGroups(prevGroups => {
        return prevGroups.map(g => g.id === activeGroupId ? { ...g, unread_count: 0 } : g);
      });

      return () => {
        clearInterval(pollInterval);
        clearInterval(groupsPollInterval);
      };
    }
  }, [activeGroupId, ADMIN_USER_ID]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAttachMenu]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (activeGroupId) {
      localStorage.setItem('active_chat_id', activeGroupId);
      
      try {
        const counts = JSON.parse(localStorage.getItem('admin_unread_counts') || '{}');
        const lastRead = JSON.parse(localStorage.getItem('admin_last_read_times') || '{}');
        
        lastRead[activeGroupId] = new Date().toISOString();
        localStorage.setItem('admin_last_read_times', JSON.stringify(lastRead));

        if (counts[activeGroupId]) {
          delete counts[activeGroupId];
          localStorage.setItem('admin_unread_counts', JSON.stringify(counts));
          window.dispatchEvent(new Event('admin_unread_updated'));
        }
      } catch(e) {}
    } else {
      localStorage.removeItem('active_chat_id');
    }
    
    return () => {
      localStorage.removeItem('active_chat_id');
    };
  }, [activeGroupId]);

  const fetchGroups = async () => {
    // Ensure Admin user exists to prevent Foreign Key errors on message insert
    await supabase.from('users').upsert({
      id: ADMIN_USER_ID,
      full_name: "Mishra Classes (Official)",
      email: "admin@mishraclasses.com",
      role: "admin"
    });

    // Admin sees ALL groups
    const { data: rawGroups } = await supabase.from('chat_groups').select('*').order('created_at', { ascending: false });
    
    if (rawGroups) {
      const userIdsToFetch = rawGroups
        .filter((g: any) => g.is_direct_message && g.name.startsWith('Support-'))
        .map((g: any) => g.name.replace('Support-', ''));
        
      if (userIdsToFetch.length > 0) {
        const { data: usersData } = await supabase.from('users').select('id, full_name, profile_photo_url, is_banned_from_chat').in('id', userIdsToFetch);
        if (usersData) {
          rawGroups.forEach((g: any) => {
            if (g.is_direct_message && g.name.startsWith('Support-')) {
              const uid = g.name.replace('Support-', '');
              const user = usersData.find(u => u.id === uid);
              if (user) {
                g.display_name = user.full_name;
                g.profile_photo_url = user.profile_photo_url;
                g.is_banned_from_chat = user.is_banned_from_chat;
              }
            }
          });
        }
      }

      // Now fetch the latest message for each group manually in chunks to prevent hanging
      const enrichedGroups = [];
      const CHUNK_SIZE = 10;
      for (let i = 0; i < rawGroups.length; i += CHUNK_SIZE) {
        const chunk = rawGroups.slice(i, i + CHUNK_SIZE);
        const chunkResults = await Promise.all(chunk.map(async (g: any) => {
          const { data: msgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('group_id', g.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          return {
            ...g,
            last_message_content: msgData?.content || null,
            last_message_time: msgData?.created_at || null,
            unread_count: 0 // Placeholder, will set below
          };
        }));
        enrichedGroups.push(...chunkResults);
      }

      // Sort by latest message
      enrichedGroups.sort((a, b) => {
        const tA = new Date(a.last_message_time || a.created_at).getTime();
        const tB = new Date(b.last_message_time || b.created_at).getTime();
        return tB - tA;
      });

      // Read current unread from localStorage right before setting state to avoid race conditions
      let currentUnread: Record<string, number> = {};
      try {
        currentUnread = JSON.parse(localStorage.getItem('admin_unread_counts') || '{}');
      } catch(e) {}
      
      const finalGroups = enrichedGroups.map(g => ({
        ...g,
        unread_count: currentUnread[g.id] || 0
      }));

      setGroups(finalGroups);
    }
  };

  const filteredGroups = groups.filter(g => {
    const name = g.display_name || g.name;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const fetchMessages = async (groupId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, users(*), reply_to:messages(id, content, sender_id, users(*))')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeGroupId || isUploading) return;

    setIsUploading(true);
    let attachmentPrefix = "";

    try {
      if (selectedFile) {
        if (selectedFile.type.startsWith("image/")) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const { url } = await uploadChatAttachment(formData);
          attachmentPrefix = `[ATTACHMENT:IMAGE]${url}|`;
        } else if (selectedFile.type === "application/pdf") {
          const res = await uploadFiles("coursePdfUploader", {
            files: [selectedFile],
          });
          if (res && res.length > 0) {
            attachmentPrefix = `[ATTACHMENT:PDF]${res[0].url}|`;
          }
        }
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Failed to upload file");
      setIsUploading(false);
      return;
    }

    const currentMessage = attachmentPrefix + newMessage;
    setNewMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Optimistic UI Update
    const optimisticMsg = {
      id: "temp-" + Date.now(),
      group_id: activeGroupId,
      content: currentMessage,
      sender_id: ADMIN_USER_ID,
      created_at: new Date().toISOString(),
      reply_to_id: replyingTo?.id || null,
      reply_to: replyingTo ? { content: replyingTo.content, sender_id: replyingTo.sender_id, users: replyingTo.users } : null
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setReplyingTo(null);
    setIsUploading(false);

    const { error } = await supabase.from('messages').insert([{
      group_id: activeGroupId,
      content: currentMessage,
      sender_id: ADMIN_USER_ID,
      reply_to_id: optimisticMsg.reply_to_id
    }]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      sendChatPushNotification(activeGroupId, currentMessage, ADMIN_USER_ID, "Ujjwal Sharma (Admin)");
    }
  };

  const handleClearChat = async () => {
    if (!activeGroupId) return;
    if (confirm("Are you sure you want to clear this chat for EVERYONE? This cannot be undone.")) {
      await clearGroupChatAdmin(activeGroupId);
      setMessages([]);
      setShowMenu(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroupId) return;
    const group = groups.find(g => g.id === activeGroupId);
    if (group?.is_direct_message || group?.batch_id) {
      alert("Cannot delete a direct message or batch group. You can only clear it.");
      return;
    }
    if (confirm("Are you sure you want to permanently delete this group? This cannot be undone.")) {
      try {
        await deleteChatGroupAdmin(activeGroupId);
        setGroups(prev => prev.filter(g => g.id !== activeGroupId));
        setActiveGroupId(null);
        setShowMenu(false);
      } catch (err: any) {
        alert("Failed to delete group: " + err.message);
      }
    }
  };

  const handleToggleLock = async () => {
    if (!activeGroupId) return;
    const activeGroup = groups.find(g => g.id === activeGroupId);
    if (!activeGroup) return;
    
    const newLockState = !activeGroup.is_read_only;
    try {
      await supabase.rpc('toggle_group_read_only', { p_group_id: activeGroupId, p_is_read_only: newLockState });
    } catch(e) {}
    setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, is_read_only: newLockState } : g));
    
    // Broadcast the change directly to connected students
    const channel = supabase.channel(`group_updates_${activeGroupId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'lock_toggled',
          payload: { is_read_only: newLockState }
        });
      }
    });

    setShowMenu(false);
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm("Delete this message?")) {
      try {
        if (!msgId.toString().startsWith('temp-')) {
          await deleteMessageAdmin(msgId);
        }
        setMessages(prev => prev.filter(m => m.id !== msgId));
        setActiveMessageId(null);
      } catch (err: any) {
        alert(err.message || "Failed to delete message");
      }
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setActiveMessageId(null);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleToggleBan = async () => {
    const group = groups.find(g => g.id === activeGroupId);
    if (!group || !group.is_direct_message) return;
    
    const uid = group.name.replace('Support-', '');
    const newBanStatus = !group.is_banned_from_chat;
    
    try {
      await toggleChatBan(uid, newBanStatus);
      setGroups(prev => prev.map(g => g.id === activeGroupId ? { ...g, is_banned_from_chat: newBanStatus } : g));
      
      // Update local members state if modal is open
      setGroupMembers(prev => prev.map(m => m.id === uid ? { ...m, is_banned_from_chat: newBanStatus } : m));
      
      setShowMenu(false);
      alert(`Student has been ${newBanStatus ? 'banned from' : 'allowed in'} chat.`);
    } catch (err: any) {
      alert("Failed to change ban status: " + err.message);
    }
  };

  const handleOpenMembers = async () => {
    if (!activeGroupId) return;
    const members = await getGroupMembers(activeGroupId);
    const students = await getAllStudents();
    setGroupMembers(members);
    setAllStudents(students);
    setActiveTab('members');
    setShowMembersModal(true);
    setShowMenu(false);
  };

  return (
    <div className="flex h-full min-h-[600px] bg-white border border-border/50 rounded-xl overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className="w-[320px] md:w-[350px] border-r border-border bg-white flex flex-col shrink-0">
        <div className="p-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800">Master Chat Panel</h2>
        </div>
        
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by name" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc]"
            />
          </div>
        </div>

        <div className="px-4 py-2">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase">Messages</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {[...filteredGroups].sort((a, b) => {
            const isAPinned = pinnedChats.includes(a.id);
            const isBPinned = pinnedChats.includes(b.id);
            if (isAPinned && !isBPinned) return -1;
            if (!isAPinned && isBPinned) return 1;
            return 0;
          }).map(g => {
            const isDm = g.is_direct_message;
            const isActive = activeGroupId === g.id;
            const groupName = g.display_name || g.name;
            const isPinned = pinnedChats.includes(g.id);
            const colors = ['bg-red-700', 'bg-amber-700', 'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600'];
            const avatarColor = colors[groupName.length % colors.length];
            const initial = groupName.charAt(0).toUpperCase();

            return (
              <div 
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`p-4 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100 ${
                  activeGroupId === g.id ? 'bg-sky-50/50' : ''
                }`}
              >
                <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center shrink-0 font-bold text-lg ${!g.profile_photo_url ? avatarColor + ' text-white' : 'bg-gray-100 border border-gray-200'}`}>
                  {g.profile_photo_url ? (
                    <img src={g.profile_photo_url} alt={groupName} className="w-full h-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className={`font-bold text-[14px] truncate flex items-center gap-1 ${isActive ? 'text-[#0088cc]' : 'text-gray-800'}`}>
                      {groupName}
                      {isPinned && <Pin size={12} className={isActive ? "text-[#0088cc] fill-[#0088cc]/20 shrink-0" : "text-gray-400 shrink-0"} />}
                    </h3>
                    {g.last_message_time && (
                      <span className="text-[11px] text-gray-400 shrink-0">
                        {new Date(g.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[13px] text-gray-500 truncate pr-2">
                      {g.last_message_content ? (
                        (() => {
                          const parsed = parseMessageContent(g.last_message_content);
                          if (parsed.type === 'image') return `📷 Photo ${parsed.text ? '- ' + parsed.text : ''}`;
                          if (parsed.type === 'pdf') return `📄 Document ${parsed.text ? '- ' + parsed.text : ''}`;
                          return parsed.text;
                        })()
                      ) : (isDm ? "Direct Message" : (g.batch_id ? "Batch Group" : "Global/Custom Group"))}
                    </p>
                    {(g.unread_count > 0 && activeGroupId !== g.id) && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                        {g.unread_count > 99 ? '99+' : g.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredGroups.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">No chat groups found.</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#f9f9f9] relative">
        {!activeGroupId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white">
            <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
              <Hash size={40} className="text-blue-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Select a Chat</h2>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Tap on a chat from the sidebar to view messages and manage the conversation.
            </p>
          </div>
        ) : (
          <>
            <div className="h-16 px-6 border-b border-gray-200 bg-white flex justify-between items-center z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 overflow-hidden">
              {(() => {
                const activeGroup = groups.find(g => g.id === activeGroupId);
                if (activeGroup?.is_direct_message) {
                  return activeGroup.profile_photo_url ? (
                    <img src={activeGroup.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  );
                }
                return <Hash size={20} />;
              })()}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{groups.find(g => g.id === activeGroupId)?.display_name || groups.find(g => g.id === activeGroupId)?.name || "Select a group"}</h3>
              <div className="text-[11px] text-gray-500">
                {groups.find(g => g.id === activeGroupId)?.is_read_only ? "🔒 Locked (Only Admin can send)" : "Admin Access Mode"}
              </div>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors">
              <MoreVertical size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-50">
                  {groups.find(g => g.id === activeGroupId)?.is_direct_message && (
                    <button onClick={handleToggleBan} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                      <Ban size={16} className={groups.find(g => g.id === activeGroupId)?.is_banned_from_chat ? "text-green-500" : "text-red-500"} />
                      {groups.find(g => g.id === activeGroupId)?.is_banned_from_chat ? "Unban from Chat" : "Ban from Chat"}
                    </button>
                  )}
                  <button onClick={togglePinChat} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    {pinnedChats.includes(activeGroupId!) ? <><PinOff size={16} /> Unpin Chat</> : <><Pin size={16} /> Pin Chat</>}
                  </button>
                  {!groups.find(g => g.id === activeGroupId)?.is_direct_message && (
                    <button onClick={handleOpenMembers} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                      View Group Members
                      <Users size={16} className="text-gray-400" />
                    </button>
                  )}
                  <button onClick={handleToggleLock} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    {groups.find(g => g.id === activeGroupId)?.is_read_only ? "Unlock Chat (Allow Students)" : "Lock Chat (Only Admin)"}
                  </button>
                  <button onClick={handleClearChat} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
                    Clear Chat (Delete All)
                  </button>
                  {!(groups.find(g => g.id === activeGroupId)?.is_direct_message || groups.find(g => g.id === activeGroupId)?.batch_id) && (
                    <button onClick={handleDeleteGroup} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium border-t border-gray-100">
                      Delete Group
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div 
          data-no-ptr="true"
          id="chat-message-list"
          className="flex-1 overflow-y-auto p-6 space-y-6" 
          onClick={() => setShowMenu(false)}
        >
          <div className="flex justify-center my-4">
            <span className="text-[10px] text-gray-400 font-medium">2026/07/08</span>
          </div>

          {messages.map((msg, idx) => {
            const isAdmin = msg.sender_id === ADMIN_USER_ID;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
            const isDM = groups.find(g => g.id === activeGroupId)?.is_direct_message;

            return (
              <div key={idx} className={`flex gap-3 max-w-[70%] relative group ${isAdmin ? "ml-auto flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-1 overflow-hidden">
                  {msg.sender_id === ADMIN_USER_ID ? (
                    <img src="/icon.png" alt="Admin" className="w-full h-full object-cover" />
                  ) : msg.users?.profile_photo_url ? (
                    <img src={msg.users.profile_photo_url} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-blue-600" />
                  )}
                </div>
                
                <div className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                  <div 
                    className={`relative ${isDM ? "" : ""}`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveMessageId(msg.id === activeMessageId ? null : msg.id); }}
                  >
                    <div className={`px-4 py-2 text-[13px] shadow-sm relative transition-all ${
                      isAdmin 
                        ? "bg-[#0088cc] text-white rounded-l-lg rounded-tr-lg rounded-br-sm" 
                        : "bg-white text-gray-800 border border-gray-100 rounded-r-lg rounded-tl-lg rounded-bl-sm"
                    }`}>
                      {!isAdmin && (
                        <div className="font-bold text-[11px] text-[#0088cc] mb-1 capitalize">
                          {msg.users?.full_name || "Student"}
                        </div>
                      )}
                      {/* Reply visual block */}
                      {msg.reply_to_id && (
                        (() => {
                          const repliedMsg = messages.find(m => m.id === msg.reply_to_id) || (Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to);
                          if (!repliedMsg) return null;
                          const parsedReply = parseMessageContent(repliedMsg.content);
                          return (
                            <div className={`mb-2 p-2 rounded text-xs border-l-4 flex flex-col opacity-90 ${isAdmin ? 'bg-[#0077b3] border-white/50 text-white' : 'bg-gray-50 border-blue-400 text-gray-600'}`}>
                              <div className="font-bold text-[10px] mb-0.5">
                                {repliedMsg.sender_id === ADMIN_USER_ID 
                                  ? "You" 
                                  : (repliedMsg.users?.full_name || "Student")}
                              </div>
                              <div className="line-clamp-1">{parsedReply.type === 'image' ? '🖼️ Photo' : parsedReply.type === 'pdf' ? '📄 PDF Document' : parsedReply.text}</div>
                            </div>
                          );
                        })()
                      )}
                      
                      {(() => {
                        const parsed = parseMessageContent(msg.content);
                        if (parsed.type === 'image') {
                          return (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setViewingAttachment(parsed as any)} 
                                className="block w-full max-w-[200px] sm:max-w-[250px] rounded-lg overflow-hidden border border-white/20 relative group/img text-left focus:outline-none"
                              >
                                <img src={parsed.url || ""} alt="Attachment" className="w-full h-32 sm:h-40 object-cover bg-white" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center">
                                  <div className="bg-black/60 p-2 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity">
                                    <Eye size={20} className="text-white" />
                                  </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 px-2 text-center backdrop-blur-sm truncate">
                                  {parsed.filename}
                                </div>
                              </button>
                              {parsed.text && <span>{parsed.text}</span>}
                            </div>
                          );
                        } else if (parsed.type === 'pdf') {
                          return (
                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setViewingAttachment(parsed as any)}
                                className={`flex items-center gap-3 p-3 w-full max-w-[200px] sm:max-w-[250px] text-left rounded-lg border ${isAdmin ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-slate-800'} transition-colors focus:outline-none`}
                              >
                                <FileText size={24} className={isAdmin ? 'text-white' : 'text-red-500'} />
                                <div className="flex flex-col min-w-[120px] max-w-[160px]">
                                  <span className="text-sm font-bold truncate">{parsed.filename}</span>
                                  <span className="text-[10px] opacity-80">Click to view/download</span>
                                </div>
                              </button>
                              {parsed.text && <span>{parsed.text}</span>}
                            </div>
                          );
                        }
                        return <span>{parsed.text}</span>;
                      })()}

                      <div className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${isAdmin ? "text-blue-100" : "text-gray-400"}`}>
                        {timeStr}
                      </div>
                    </div>

                    {/* Message Context Menu (Dots) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isAdmin ? '-left-8' : '-right-8'} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}>
                      <button onClick={() => setActiveMessageId(msg.id === activeMessageId ? null : msg.id)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {activeMessageId === msg.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMessageId(null); }}></div>
                        <div className={`absolute top-0 ${isAdmin ? 'right-full mr-10' : 'left-full ml-10'} w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50`}>
                          <button onClick={() => { setReplyingTo(msg); setActiveMessageId(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                            Reply
                          </button>
                          <button onClick={() => { handleCopyMessage(msg.content); setActiveMessageId(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50">
                            Copy
                          </button>
                          {(() => {
                            const p = parseMessageContent(msg.content);
                            if (p.type === 'image' || p.type === 'pdf') {
                              return (
                                <button onClick={() => { handleDownloadFile(p.url, p.filename); setActiveMessageId(null); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center justify-between">
                                  <span>Download</span>
                                  <Download size={14} className="text-gray-400" />
                                </button>
                              );
                            }
                            return null;
                          })()}
                          <button onClick={() => { handleDeleteMessage(msg.id); setActiveMessageId(null); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50">
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        
        {activeGroupId && (
          <div className="flex flex-col bg-white border-t border-gray-200 shrink-0">
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex-1 min-w-0 border-l-4 border-[#0088cc] pl-2">
                  <div className="text-[10px] font-bold text-[#0088cc] mb-0.5">
                    Replying
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {(() => {
                      const parsed = parseMessageContent(replyingTo.content);
                      return parsed.type === 'image' ? `🖼️ Photo (${parsed.filename})` : parsed.type === 'pdf' ? `📄 PDF (${parsed.filename})` : parsed.text;
                    })()}
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 text-gray-400 hover:text-gray-700 ml-2 rounded-full hover:bg-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            )}
            {selectedFile && (
              <div className="px-4 py-2 bg-blue-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {selectedFile.type.startsWith("image/") ? <ImageIcon size={16} className="text-blue-500" /> : <FileText size={16} className="text-red-500" />}
                  <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{selectedFile.name}</span>
                </div>
                <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="p-3">
              <form onSubmit={sendMessage} className="flex gap-2 items-center">
                <div className="relative" ref={attachMenuRef}>
                  <input type="file" ref={fileInputRef} onChange={(e) => { handleFileChange(e); setShowAttachMenu(false); }} accept={acceptType} className="hidden" />
                  
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 text-gray-400 hover:text-gray-600 shrink-0 transition-colors">
                    <Paperclip size={20} />
                  </button>
                  
                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 overflow-hidden flex flex-col">
                      <button type="button" onClick={() => { setAcceptType("image/*"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left">
                        <ImageIcon size={16} className="text-blue-500" /> Photos
                      </button>
                      <button type="button" onClick={() => { setAcceptType(".pdf,application/pdf"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 text-left">
                        <FileText size={16} className="text-red-500" /> Document
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Message as Mishra Classes (Official)..."
                  className="flex-1 bg-transparent py-2 px-2 text-sm focus:outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  className="p-2 text-[#0088cc] hover:text-[#006699] shrink-0 disabled:opacity-50 transition-colors"
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </form>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" /> Manage Group Members
              </h2>
              <button onClick={() => setShowMembersModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b border-gray-200">
              <button 
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('members')}
              >
                Current Members ({groupMembers.length})
              </button>
              <button 
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'add' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('add')}
              >
                Add Students
              </button>
            </div>

            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={activeTab === 'members' ? "Search current members..." : "Search all students..."}
                  value={membersSearchQuery}
                  onChange={(e) => setMembersSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc]"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeTab === 'members' ? (
                <>
                  {groupMembers
                    .filter(m => m.full_name?.toLowerCase().includes(membersSearchQuery.toLowerCase()))
                    .map(member => (
                      <div key={member.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                            {member.profile_photo_url ? (
                              <img src={member.profile_photo_url} alt={member.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className="text-blue-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{member.full_name}</h4>
                            <p className="text-xs text-gray-500">{member.phone || "No phone"}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const newBanStatus = !member.is_banned_from_chat;
                                await toggleChatBan(member.id, newBanStatus);
                                setGroupMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_banned_from_chat: newBanStatus } : m));
                              } catch (err: any) {
                                alert("Failed to ban/unban: " + err.message);
                              }
                            }}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors ${
                              member.is_banned_from_chat 
                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200" 
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                            }`}
                          >
                            {member.is_banned_from_chat ? <Ban size={12} /> : <Check size={12} />}
                            {member.is_banned_from_chat ? "Banned" : "Ban"}
                          </button>
                          
                          {/* Only show remove for custom groups, not batch groups */}
                          {!groups.find(g => g.id === activeGroupId)?.batch_id && (
                            <button
                              onClick={async () => {
                                if (!activeGroupId) return;
                                if (confirm(`Remove ${member.full_name} from this group?`)) {
                                  try {
                                    await removeMemberFromGroup(activeGroupId, member.id);
                                    setGroupMembers(prev => prev.filter(m => m.id !== member.id));
                                  } catch (err: any) {
                                    alert("Failed to remove user: " + err.message);
                                  }
                                }
                              }}
                              className="px-2 py-1.5 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                              title="Remove from group"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  {groupMembers.length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">No members found.</div>
                  )}
                </>
              ) : (
                <>
                  {allStudents
                    .filter(s => !groupMembers.some(m => m.id === s.id))
                    .filter(s => s.full_name?.toLowerCase().includes(membersSearchQuery.toLowerCase()))
                    .map(student => (
                      <div key={student.id} className="flex justify-between items-center bg-white border border-gray-100 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {student.profile_photo_url ? (
                              <img src={student.profile_photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <User size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-800">{student.full_name}</h4>
                            <p className="text-xs text-gray-500">{student.phone || "No phone"}</p>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!activeGroupId) return;
                            try {
                              await addMemberToGroup(activeGroupId, student.id);
                              setGroupMembers(prev => [...prev, student]);
                            } catch (err: any) {
                              alert("Failed to add user: " + err.message);
                            }
                          }}
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-bold transition-colors"
                        >
                          Add User
                        </button>
                      </div>
                    ))}
                  {allStudents.filter(s => !groupMembers.some(m => m.id === s.id)).length === 0 && (
                    <div className="text-center py-6 text-gray-500 text-sm">All students are already in this group.</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 truncate">
                <ImageIcon size={18} className="text-blue-600" /> {viewingAttachment.filename}
              </h3>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="p-1.5 bg-slate-200 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black min-h-[50vh]">
              {viewingAttachment.type === 'pdf' || viewingAttachment.url.toLowerCase().endsWith('.pdf') ? (
                <iframe src={viewingAttachment.url} className="w-full h-[70vh] rounded border border-slate-700 bg-white" title="Attachment PDF" />
              ) : (
                <img src={viewingAttachment.url} alt="Attachment" className="max-w-full max-h-[70vh] object-contain shadow-sm" />
              )}
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => handleDownloadFile(viewingAttachment.url, viewingAttachment.type, viewingAttachment.filename)}
                disabled={isDownloading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                {isDownloading ? "Downloading..." : "Download"}
              </button>
              <button 
                onClick={() => setViewingAttachment(null)}
                className="px-5 py-2 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
