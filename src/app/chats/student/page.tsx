"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Search, MoreVertical, Paperclip, Hash, User, Check, Ban, X, FileText, Loader2, Image as ImageIcon, Download, Pin, PinOff, Mic, ArrowLeft, Eye } from "lucide-react";
import { checkChatBan, uploadChatAttachment, sendChatPushNotification } from "@/actions/chat";
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

export default function StudentChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [acceptType, setAcceptType] = useState("image/*,application/pdf");
  const attachMenuRef = useRef<HTMLDivElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<{url: string, type: string, filename: string} | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // For scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedPinned = localStorage.getItem('pinnedChats_student');
    if (savedPinned) {
      try { setPinnedChats(JSON.parse(savedPinned)); } catch(e) {}
    }
    
    try {
      const cached = localStorage.getItem('cached_student_chat_groups');
      if (cached) setGroups(JSON.parse(cached));
    } catch(e) {}

    // Handle deep linking from push notifications
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const groupParam = searchParams.get('group');
      if (groupParam) {
        setActiveGroupId(groupParam);
      }
    }
  }, []);

  const togglePinChat = () => {
    if (!activeGroupId) return;
    setPinnedChats(prev => {
      const newPinned = prev.includes(activeGroupId) ? prev.filter(id => id !== activeGroupId) : [...prev, activeGroupId];
      localStorage.setItem('pinnedChats_student', JSON.stringify(newPinned));
      return newPinned;
    });
    setShowMenu(false);
  };
  
  // Ref to store unread counts from realtime updates temporarily before re-fetching
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const ADMIN_USER_ID = "00000000-0000-0000-0000-000000000000"; 

  useEffect(() => {
    // Read user_id from cookie
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      setUserId(match[2]);
    } else {
      // Fallback to dummy user if missing
      setUserId("11111111-1111-1111-1111-111111111111");
    }
    
    const handleUnreadUpdate = () => {
      try {
        const counts = JSON.parse(localStorage.getItem('student_unread_counts') || '{}');
        setGroups(prev => prev.map(g => ({
          ...g,
          unread_count: counts[g.id] || 0
        })));
      } catch(e) {}
    };
    window.addEventListener('student_unread_updated', handleUnreadUpdate);
    return () => window.removeEventListener('student_unread_updated', handleUnreadUpdate);
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGroups();
      checkChatBan(userId)
        .then(banned => setIsBanned(banned))
        .catch(err => console.error("Ignored checkChatBan error:", err));
      
      const userChannel = supabase
        .channel(`user_updates_${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`
        }, payload => {
          if (payload.new.is_banned_from_chat !== undefined) {
            setIsBanned(payload.new.is_banned_from_chat);
          }
        })
        .subscribe();
        
      return () => { supabase.removeChannel(userChannel); }
    }
  }, [userId]);

  useEffect(() => {
    if (activeGroupId && userId) {
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
  }, [activeGroupId, userId]);

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
        const counts = JSON.parse(localStorage.getItem('student_unread_counts') || '{}');
        const lastRead = JSON.parse(localStorage.getItem('student_last_read_times') || '{}');
        
        lastRead[activeGroupId] = new Date().toISOString();
        localStorage.setItem('student_last_read_times', JSON.stringify(lastRead));

        if (counts[activeGroupId]) {
          delete counts[activeGroupId];
          localStorage.setItem('student_unread_counts', JSON.stringify(counts));
          window.dispatchEvent(new Event('student_unread_updated'));
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
    if (!userId) return;

    // Ensure the dummy user exists in the database to prevent Foreign Key errors
    if (userId === "11111111-1111-1111-1111-111111111111") {
      await supabase.from('users').upsert({
        id: userId,
        full_name: "Dummy Student",
        email: "dummy@student.com",
        role: "student"
      });
    }

    // Fetch groups where this user is a member
    const { data: memberGroups } = await supabase
      .from('chat_members')
      .select('chat_groups(*)')
      .eq('user_id', userId);

    const fetchedGroups: any[] = (memberGroups || []).map((mg: any) => {
      return Array.isArray(mg.chat_groups) ? mg.chat_groups[0] : mg.chat_groups;
    }).filter(Boolean);

    // Ensure they always have a 1-on-1 direct message group with Admin
    let supportGroup = fetchedGroups.find(g => g.name === `Support-${userId}`);
    if (!supportGroup) {
      const { data: dmGroup } = await supabase
        .from('chat_groups')
        .select('*')
        .eq('is_direct_message', true)
        .eq('name', `Support-${userId}`)
        .single();
      
      supportGroup = dmGroup;
    }

    if (!supportGroup) {
      // Create it if it doesn't exist
      const { data: newDm } = await supabase.from('chat_groups').insert([{
        name: `Support-${userId}`,
        is_direct_message: true
      }]).select().single();
      
      supportGroup = newDm;
      if (newDm) {
        await supabase.from('chat_members').insert([{ group_id: newDm.id, user_id: userId }]);
      }
    }

    if (supportGroup && !fetchedGroups.find(g => g.id === supportGroup.id)) {
      fetchedGroups.unshift(supportGroup);
    }

    // Now fetch the latest message for each group manually in chunks
    const enrichedGroups = [];
    const CHUNK_SIZE = 10;
    for (let i = 0; i < fetchedGroups.length; i += CHUNK_SIZE) {
      const chunk = fetchedGroups.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(chunk.map(async (g) => {
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
          unread_count: 0 // Placeholder
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

    let currentUnread: Record<string, number> = {};
    try {
      currentUnread = JSON.parse(localStorage.getItem('student_unread_counts') || '{}');
    } catch(e) {}

    const finalGroups = enrichedGroups.map(g => ({
      ...g,
      unread_count: currentUnread[g.id] || 0
    }));

    setGroups(finalGroups);
    try { localStorage.setItem('cached_student_chat_groups', JSON.stringify(finalGroups)); } catch(e) {}
  };

  const fetchMessages = async (groupId: string) => {
    let chatClearedAt = new Date(0).toISOString();
    
    // Find when this user last cleared the chat
    const { data: memberData } = await supabase
      .from('chat_members')
      .select('cleared_at')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single();
      
    if (memberData?.cleared_at) {
      chatClearedAt = memberData.cleared_at;
    }

    const { data } = await supabase
      .from('messages')
      .select('*, users(*), reply_to:messages(id, content, sender_id, users(*))')
      .eq('group_id', groupId)
      .gte('created_at', chatClearedAt)
      .order('created_at', { ascending: true })
      .limit(100);

    setMessages(data || []);
  };

  const handleClearChat = async () => {
    if (!activeGroupId || !userId) return;
    if (confirm("Are you sure you want to clear this chat from your view?")) {
      await supabase.rpc('clear_user_chat', { p_group_id: activeGroupId, p_user_id: userId });
      setMessages([]);
      setShowMenu(false);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeGroupId || !userId || isUploading) return;

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
      sender_id: userId,
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
      sender_id: userId,
      reply_to_id: optimisticMsg.reply_to_id
    }]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      // Find current user's name
      const userNameMatch = document.cookie.match(/(^| )user_name=([^;]+)/);
      const senderName = userNameMatch ? decodeURIComponent(userNameMatch[2]) : "Student";
      sendChatPushNotification(activeGroupId, currentMessage, userId, senderName);
    }
  };

  if (!userId) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center bg-card border border-border rounded-2xl shadow-sm">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] md:h-[calc(100vh-6rem)] bg-white border-0 md:border md:border-border/50 rounded-none md:rounded-xl overflow-hidden shadow-none md:shadow-sm">
      {/* Sidebar */}
      <div className={`${activeGroupId ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] border-r border-border bg-white flex-col shrink-0`}>
        {/* Desktop Header */}
        <div className="hidden md:block p-5 pb-3">
          <h2 className="text-xl font-bold text-gray-800">Chats</h2>
        </div>
        
        <div className="p-3 bg-gray-100/80 md:bg-white border-b border-gray-200">
          <div className="relative bg-white rounded-md border border-gray-200/60 shadow-sm flex items-center px-3 py-2">
            <Search className="text-gray-400 shrink-0" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or number" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-2 bg-transparent text-[15px] focus:outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="px-4 py-2 border-b border-gray-100 bg-white">
          <span className="text-[12px] font-medium tracking-wide text-gray-500 uppercase">MESSAGES</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {[...groups].filter(g => {
            const name = g.is_direct_message ? "Mishra Classes" : g.name;
            return name.toLowerCase().includes(searchQuery.toLowerCase());
          }).sort((a, b) => {
            const isAPinned = pinnedChats.includes(a.id);
            const isBPinned = pinnedChats.includes(b.id);
            if (isAPinned && !isBPinned) return -1;
            if (!isAPinned && isBPinned) return 1;
            return 0;
          }).map(g => {
            const isDm = g.is_direct_message;
            const isPinned = pinnedChats.includes(g.id);
            return (
              <div 
                key={g.id}
                onClick={() => setActiveGroupId(g.id)}
                className={`p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors border-b border-gray-100 ${
                  activeGroupId === g.id ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <div className="relative shrink-0 w-12 h-12">
                  <div className={`w-full h-full rounded-full flex items-center justify-center overflow-hidden shadow-sm ${isDm ? 'bg-white border border-gray-200' : 'bg-[#eab308] text-black'}`}>
                    {isDm ? (
                      <img src="/logo.png" alt="Admin" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="font-bold text-lg">{g.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {/* Green online dot only for Mishra Classes (DM) */}
                  {isDm && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="font-medium text-gray-900 text-[15px] truncate pr-2 flex items-center gap-1">
                      {isDm ? "Mishra Classes" : g.name}
                      {isPinned && <Pin size={12} className="text-[#0088cc] fill-[#0088cc]/20 shrink-0" />}
                    </h3>
                    {g.last_message_time && (
                      <span className="text-[12px] text-gray-500 shrink-0">
                        {new Date(g.last_message_time).toLocaleDateString('en-CA').replace(/-/g, '/')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] text-gray-600 truncate pr-2">
                      {isDm && <span className="text-gray-800 font-medium">Mishra Classes : </span>}
                      {g.last_message_content ? (
                        (() => {
                          const parsed = parseMessageContent(g.last_message_content);
                          if (parsed.type === 'image') return `📷 Photo ${parsed.text ? '- ' + parsed.text : ''}`;
                          if (parsed.type === 'pdf') return `📄 Document ${parsed.text ? '- ' + parsed.text : ''}`;
                          return parsed.text;
                        })()
                      ) : (isDm ? "Direct Message" : "Batch Group")}
                    </p>
                    {(g.unread_count > 0 && activeGroupId !== g.id) && (
                      <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-sm">
                        {g.unread_count > 99 ? '99+' : g.unread_count}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {groups.filter(g => (g.is_direct_message ? "Mishra Classes" : g.name).toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className="p-4 text-sm text-muted-foreground text-center">No chats match "{searchQuery}"</div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div 
        data-chat-conversation={activeGroupId ? "active" : "none"}
        className={`${!activeGroupId ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#f5f5f5] overflow-hidden ${activeGroupId ? 'fixed inset-0 z-[200] md:relative md:inset-auto md:z-auto' : 'relative'}`}
      >
        {!activeGroupId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#f5f5f5]">
            <div className="w-24 h-24 mb-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
              <Hash size={40} className="text-blue-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Your Messages</h2>
            <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
              Tap on a chat from the sidebar to see messages and start conversing.
            </p>
          </div>
        ) : (
          <>
            {/* Native Mobile Header for Active Chat */}
            <div className="flex md:hidden absolute top-0 w-full h-[60px] bg-[#5B58FF] justify-between items-center px-2 shadow-md z-20 shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveGroupId(null)} 
                  className="md:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>
                <div className={`relative w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-white overflow-hidden shadow-sm`}>
                  {groups.find(g => g.id === activeGroupId)?.is_direct_message ? <img src="/logo.png" alt="Logo" className="w-full h-full object-contain p-1" /> : <Hash size={18} className="text-gray-500" />}
                </div>
                <div className="ml-2">
                  <h3 className="font-bold text-white text-[16px] tracking-wide">{groups.find(g => g.id === activeGroupId)?.is_direct_message ? "Mishra Classes" : groups.find(g => g.id === activeGroupId)?.name || "Select a group"}</h3>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                  <MoreVertical size={24} />
                </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden">
                  <button onClick={togglePinChat} className="w-full text-left px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">
                    {pinnedChats.includes(activeGroupId!) ? <><PinOff size={16} /> Unpin Chat</> : <><Pin size={16} /> Pin Chat</>}
                  </button>
                  <button onClick={handleClearChat} className="w-full text-left px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Clear Chat
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Adjust top padding since header is visible on mobile */}
        <div 
          data-no-ptr="true"
          id="chat-message-list"
          className="flex-1 overflow-y-auto p-6 pt-[80px] md:pt-6 space-y-4" 
          onClick={() => setShowMenu(false)}
        >
          <div className="flex justify-center my-4">
            <span className="text-[10px] text-gray-400 font-medium">2026/07/08</span>
          </div>
          
          {messages.map((msg, idx) => {
            const isOwn = msg.sender_id === userId;
            const isDM = groups.find(g => g.id === activeGroupId)?.is_direct_message;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();

            return (
              <div key={idx} className={`flex max-w-[85%] w-fit relative group ${isOwn ? "ml-auto" : "mr-auto"}`}>
                <div className={`flex flex-col w-full`}>
                  <div 
                    className={`relative w-full`}
                    onContextMenu={(e) => { e.preventDefault(); setActiveMessageId(msg.id === activeMessageId ? null : msg.id); }}
                  >
                    <div className={`px-3 pt-2 pb-6 text-[15px] shadow-sm relative min-w-[100px] leading-snug ${
                      isOwn 
                        ? "bg-[#5B58FF] text-white rounded-xl rounded-tr-sm" 
                        : "bg-white text-slate-800 border border-gray-200 rounded-xl rounded-tl-sm shadow-sm"
                    }`}>
                      {!isOwn && (
                        <div className={`font-semibold text-[11px] mb-1 capitalize ${isOwn ? 'text-blue-200' : 'text-[#5B58FF]'}`}>
                          {msg.sender_id === '00000000-0000-0000-0000-000000000000' ? "Mishra Classes" : (msg.users?.full_name || "Student")}
                        </div>
                      )}
                      {/* Reply visual block */}
                      {msg.reply_to_id && (
                        (() => {
                          const repliedMsg = messages.find(m => m.id === msg.reply_to_id) || (Array.isArray(msg.reply_to) ? msg.reply_to[0] : msg.reply_to);
                          if (!repliedMsg) return null;
                          const parsedReply = parseMessageContent(repliedMsg.content);
                          return (
                            <div className={`mb-2 p-2 rounded-lg text-xs border-l-[3px] flex flex-col ${isOwn ? 'bg-black/10 border-white/50 text-white' : 'bg-gray-50 border-[#5B58FF] text-gray-600'}`}>
                              <div className="font-bold text-[10px] mb-0.5 tracking-wider uppercase">
                                {repliedMsg.sender_id === userId 
                                  ? "You" 
                                  : (repliedMsg.sender_id === '00000000-0000-0000-0000-000000000000' 
                                      ? "Mishra Classes" 
                                      : (repliedMsg.users?.full_name || "Student"))}
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
                                className={`flex items-center gap-3 p-3 w-full max-w-[200px] sm:max-w-[250px] text-left rounded-lg border ${isOwn ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-slate-800'} transition-colors focus:outline-none`}
                              >
                                <FileText size={24} className={isOwn ? 'text-white' : 'text-red-500'} />
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

                      <div className={`absolute bottom-1 right-2 text-[10px] font-medium flex items-center justify-end gap-1 ${isOwn ? "text-blue-100" : "text-gray-400"}`}>
                        {timeStr}
                      </div>
                    </div>

                    {/* Message Context Menu (Dots) */}
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-8' : '-right-8'} opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity`}>
                      <button onClick={() => setActiveMessageId(msg.id === activeMessageId ? null : msg.id)} className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    {/* Dropdown Menu */}
                    {activeMessageId === msg.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMessageId(null); }}></div>
                        <div className={`absolute top-0 ${isOwn ? 'right-full mr-10' : 'left-full ml-10'} w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50`}>
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
        <div className="z-30 shrink-0 w-full bg-white border-t border-gray-200">
        {groups.find(g => g.id === activeGroupId)?.is_read_only ? (
          <div className="p-4 bg-gray-50 text-center text-[13px] text-gray-500 font-medium">
            🔒 Only admins can send messages to this group.
          </div>
        ) : isBanned ? (
          <div className="p-4 bg-red-50 text-center text-[13px] text-red-600 flex items-center justify-center gap-2 font-medium">
            <Ban size={18} /> You have been banned from sending messages.
          </div>
        ) : (
          <div className="flex flex-col w-full bg-white relative">
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <div className="flex-1 min-w-0 border-l-[3px] border-[#5B58FF] pl-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#5B58FF] mb-0.5">
                    Replying
                  </div>
                  <div className="text-xs text-slate-600 font-medium truncate">
                    {(() => {
                      const parsed = parseMessageContent(replyingTo.content);
                      return parsed.type === 'image' ? `🖼️ Photo (${parsed.filename})` : parsed.type === 'pdf' ? `📄 PDF (${parsed.filename})` : parsed.text;
                    })()}
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1.5 text-slate-400 hover:text-slate-800 ml-2 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={16} />
                </button>
              </div>
            )}
            {selectedFile && (
              <div className={`px-4 py-2 bg-blue-50 border-b border-blue-100 flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  {selectedFile.type.startsWith("image/") ? <ImageIcon size={18} className="text-blue-500" /> : <FileText size={18} className="text-red-500" />}
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{selectedFile.name}</span>
                </div>
                <button onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="px-2 py-1.5 md:py-2">
              <form onSubmit={sendMessage} className="flex gap-1 md:gap-2 items-center">
                <div className="relative" ref={attachMenuRef}>
                  <input type="file" ref={fileInputRef} onChange={(e) => { handleFileChange(e); setShowAttachMenu(false); }} accept={acceptType} className="hidden" />
                  
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-2 text-gray-500 hover:text-gray-700 rounded-full shrink-0">
                    <Paperclip size={24} className="-rotate-45" />
                  </button>
                  
                  {showAttachMenu && (
                    <div className="absolute bottom-full left-0 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden flex flex-col">
                      <button type="button" onClick={() => { setAcceptType("image/*"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-left font-medium transition-colors">
                        <ImageIcon size={16} className="text-blue-500" /> Photos
                      </button>
                      <button type="button" onClick={() => { setAcceptType(".pdf,application/pdf"); setTimeout(() => fileInputRef.current?.click(), 0); }} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 text-left font-medium transition-colors">
                        <FileText size={16} className="text-red-500" /> Document
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Write something here..."
                  className="flex-1 bg-transparent py-2 px-2 text-[15px] text-slate-800 focus:outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                  className={`p-2 shrink-0 transition-colors ${(!newMessage.trim() && !selectedFile) ? 'text-gray-300' : 'text-gray-400'}`}
                >
                  {isUploading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                </button>
              </form>
            </div>
          </div>
        )}
        </div>
          </>
        )}
      </div>

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
