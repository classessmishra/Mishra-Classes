"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Users, ShieldAlert, Circle, Settings, Activity, Power, RefreshCw, Trash2, Heart, VolumeX, Volume2, VideoOff, Video, Mic, MicOff, MessageSquare, ChevronRight, Play, MessageSquareOff, Hand, BarChart2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getLiveClassById, updateLiveClass, getChatHistory, sendChatMessage, deleteChatForClass, deleteChatMessageById, getCanonicalLiveClassId, toggleLiveClassStatus } from "@/actions/liveClasses";
import LivePlayer from "@/components/LivePlayer";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLiveStudio() {
  const { classId } = useParams();
  const router = useRouter();
  
  const [liveClass, setLiveClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canonicalClassId, setCanonicalClassId] = useState<string | null>(null);
  
  // Stream Control States
  const [localMute, setLocalMute] = useState(true);
  const [remoteStudentsMuted, setRemoteStudentsMuted] = useState(false);
  const [remoteVideoHidden, setRemoteVideoHidden] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  
  // New Admin Features
  const [isChatLocked, setIsChatLocked] = useState(false);
  
  // Poll & Raise Hand Features
  const [isPollActive, setIsPollActive] = useState(false);
  const [pollResults, setPollResults] = useState({ A: 0, B: 0, C: 0, D: 0 });
  const [raisedHands, setRaisedHands] = useState<{id: string, name: string}[]>([]);
  
  // Presence state
  const [liveViewersCount, setLiveViewersCount] = useState(0);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [floatingHearts, setFloatingHearts] = useState<{id: number, left: number, size: number, duration: number}[]>([]);
  const heartCounter = useRef(0);
  
  // Supabase Channel Refs for Realtime Broadcasts
  const controlChannelRef = useRef<any>(null);

  // Admin Info
  const adminName = "Mishra Classes Admin";
  const adminRole = "admin";

  useEffect(() => {
    if (!canonicalClassId) return;

    fetchChat();

    const channel = supabase
      .channel(`live_class_${canonicalClassId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_class_chat', filter: `class_id=eq.${canonicalClassId}` },
        (payload) => {
          if (payload.new.message === "HEART_EMOJI_EVENT") {
            triggerHeart();
          } else {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'live_class_chat', filter: `class_id=eq.${canonicalClassId}` },
        () => setMessages([])
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        let count = 0;
        for (const key in newState) count += newState[key].length;
        setLiveViewersCount(count);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: 'admin', online_at: new Date().toISOString() });
        }
      });

    const controlChannel = supabase
      .channel(`stream_control_${canonicalClassId}`)
      .on('broadcast', { event: 'CONTROL' }, (payload) => {
        const { type, value } = payload.payload;
        if (type === 'POLL_ANSWER') {
          const opt = value as 'A' | 'B' | 'C' | 'D';
          setPollResults(prev => ({...prev, [opt]: prev[opt] + 1}));
        } else if (type === 'RAISE_HAND') {
          const studentName = value;
          const id = Date.now().toString();
          setRaisedHands(prev => [{ id, name: studentName }, ...prev]);
          setTimeout(() => {
            setRaisedHands(curr => curr.filter(h => h.id !== id));
          }, 8000);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          controlChannelRef.current = controlChannel;
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(controlChannel);
      controlChannelRef.current = null;
    };
  }, [canonicalClassId]);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const triggerHeart = () => {
    const id = heartCounter.current++;
    const left = Math.random() * 80 + 10; 
    const size = Math.random() * 16 + 24; 
    const duration = Math.random() * 2 + 2;
    setFloatingHearts(prev => [...prev, { id, left, size, duration }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 4500);
  };

  const fetchClassData = async () => {
    try {
      const data = await getLiveClassById(classId as string);
      setLiveClass(data);
      if (data?.meeting_link || data?.youtube_video_id) {
        const canonical = await getCanonicalLiveClassId(data.meeting_link || data.youtube_video_id);
        setCanonicalClassId(canonical);
      } else {
        setCanonicalClassId(classId as string);
      }
    } catch (err) {
      alert("Error fetching class data.");
      router.push("/admin/live-classes");
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    if (!canonicalClassId) return;
    try {
      const chatHistory = await getChatHistory(canonicalClassId);
      const filtered = chatHistory.filter((m: any) => m.message !== "HEART_EMOJI_EVENT");
      setMessages(filtered);
      scrollToBottom();
    } catch (err) {}
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await sendChatMessage(canonicalClassId || (classId as string), adminName, adminRole, messageText);
    } catch (err) {
      alert("Failed to send message");
    }
  };

  const broadcastStreamControl = async (type: string, value: any) => {
    if (controlChannelRef.current) {
      await controlChannelRef.current.send({
        type: 'broadcast',
        event: 'CONTROL',
        payload: { type, value }
      });
    }
  };

  const toggleLiveStatus = async () => {
    try {
      const newState = !liveClass.is_active;
      
      // Broadcast over websockets for instant 0ms delay sync
      await broadcastStreamControl('LIVE_STATUS', newState);
      
      // Update local UI immediately
      setLiveClass({ ...liveClass, is_active: newState });

      // Save to database in background
      if (liveClass.youtube_video_id) {
        await toggleLiveClassStatus(liveClass.youtube_video_id, newState);
      } else {
        await updateLiveClass(classId as string, { is_active: newState });
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleEndClass = async () => {
    if (confirm("Are you sure you want to END this class? It will be converted into a recorded VOD session.")) {
      try {
        await broadcastStreamControl('END_CLASS', true);
        
        const videoId = liveClass.meeting_link || liveClass.youtube_video_id;
        if (videoId) {
          // Fetch duration from YouTube and mark as recorded
          const { endAndSyncLiveClass } = await import('@/actions/liveClasses');
          await endAndSyncLiveClass(videoId);
        } else {
          await updateLiveClass(classId as string, { is_active: false, status: 'recorded' });
        }
        
        alert("Class ended and saved as a VOD successfully.");
        router.push("/admin/live-classes");
      } catch (err) {
        alert("Failed to end class");
      }
    }
  };

  const handleClearChat = async () => {
    if (confirm("Clear all messages?")) {
      try {
        await deleteChatForClass(canonicalClassId || (classId as string));
        setMessages([]);
      } catch(e) {
        alert("Failed to clear chat");
      }
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (confirm("Delete this message?")) {
      try {
        await deleteChatMessageById(msgId);
        setMessages(messages.filter(m => m.id !== msgId));
      } catch (err) {
        alert("Failed to delete message");
      }
    }
  };

  const toggleRemoteMute = () => {
    const newVal = !remoteStudentsMuted;
    setRemoteStudentsMuted(newVal);
    broadcastStreamControl('MUTE', newVal);
  };

  const toggleRemoteVideo = () => {
    const newVal = !remoteVideoHidden;
    setRemoteVideoHidden(newVal);
    broadcastStreamControl('VIDEO', newVal);
  };

  const toggleLockChat = () => {
    const newVal = !isChatLocked;
    setIsChatLocked(newVal);
    broadcastStreamControl('LOCK_CHAT', newVal);
  };

  const togglePoll = () => {
    if (isPollActive) {
      setIsPollActive(false);
      broadcastStreamControl('POLL_END', true);
    } else {
      setIsPollActive(true);
      setPollResults({ A: 0, B: 0, C: 0, D: 0 });
      broadcastStreamControl('POLL_START', true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <Activity className="text-red-500 animate-spin w-12 h-12" />
      </div>
    );
  }

  const totalVotes = pollResults.A + pollResults.B + pollResults.C + pollResults.D;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
      {/* Light Theme Scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .premium-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .premium-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.15);
          border-radius: 10px;
        }
        .premium-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.25);
        }
      `}} />

      {/* Light Theme Header */}
      <header className="h-20 shrink-0 border-b border-slate-200 bg-white px-4 lg:px-6 flex justify-between items-center z-50 shadow-sm relative overflow-hidden">
        
        {/* Left Side: Title & Info */}
        <div className="flex items-center gap-4 relative z-10 shrink-0 mr-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 leading-tight tracking-tight max-w-[200px] truncate">{liveClass.title}</h1>
              <span className="text-[9px] bg-indigo-100 text-indigo-700 font-black px-1.5 py-0.5 rounded tracking-widest uppercase">Admin</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase flex items-center gap-1">
                <Users size={10} /> {liveViewersCount} Viewers
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Side: Stream Controls */}
        <div className="flex items-center gap-2 lg:gap-3 relative z-10 flex-wrap justify-end">
          
          {/* Quick Controls */}
          <div className="hidden md:flex items-center gap-1.5 mr-2 p-1 bg-slate-50 border border-slate-200 rounded-xl">
            <button 
              onClick={toggleRemoteMute}
              className={`p-2 rounded-lg transition-all ${remoteStudentsMuted ? 'bg-red-100 text-red-600' : 'text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm'}`}
              title={remoteStudentsMuted ? "Students Muted" : "Mute Students"}
            >
              {remoteStudentsMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <button 
              onClick={toggleRemoteVideo}
              className={`p-2 rounded-lg transition-all ${remoteVideoHidden ? 'bg-orange-100 text-orange-600' : 'text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm'}`}
              title={remoteVideoHidden ? "Video Hidden" : "Hide Video"}
            >
              {remoteVideoHidden ? <VideoOff size={16} /> : <Video size={16} />}
            </button>
            <button 
              onClick={toggleLockChat}
              className={`p-2 rounded-lg transition-all ${isChatLocked ? 'bg-red-100 text-red-600' : 'text-slate-500 hover:bg-white hover:text-slate-700 shadow-sm'}`}
              title={isChatLocked ? "Chat Locked" : "Lock Student Chat"}
            >
              <MessageSquareOff size={16} />
            </button>
            <button 
              onClick={handleClearChat}
              className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
              title="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <button 
              onClick={() => setSyncKey(prev => prev + 1)}
              className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
              title="Sync to Live"
            >
              <RefreshCw size={16} />
            </button>
          </div>
          
          {/* Status & End Controls */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePoll}
            className={`px-4 py-2.5 rounded-xl font-black text-[11px] lg:text-[12px] flex items-center gap-1.5 transition-colors shadow-sm tracking-widest uppercase ${isPollActive ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
          >
            <BarChart2 size={16} />
            <span className="hidden sm:inline">{isPollActive ? "End Poll" : "Start Poll"}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLiveStatus}
            className={`px-4 lg:px-5 py-2.5 rounded-xl font-black text-[11px] lg:text-[12px] flex items-center gap-2 transition-all uppercase tracking-widest ${liveClass.is_active ? 'bg-red-600 text-white shadow-md shadow-red-600/20' : 'bg-slate-800 text-white hover:bg-slate-700 shadow-md'}`}
          >
            <motion.div animate={liveClass.is_active ? { scale: [1, 1.2, 1] } : {}} transition={{ repeat: Infinity, duration: 1 }}>
              <Circle size={12} fill="currentColor" />
            </motion.div>
            <span className="hidden sm:inline">{liveClass.is_active ? "ON AIR" : "GO LIVE"}</span>
          </motion.button>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEndClass}
            className="px-4 py-2.5 rounded-xl font-black text-[11px] lg:text-[12px] flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors shadow-sm tracking-widest uppercase"
          >
            <Power size={14} /> <span className="hidden sm:inline">END</span>
          </motion.button>

          <button 
            onClick={() => setShowChat(!showChat)}
            className="lg:hidden w-10 h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white transition-all shadow-md ml-1"
          >
            {showChat ? <ChevronRight size={18} /> : <MessageSquare size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-4 lg:p-5 gap-5 relative">
        
        {/* Left: Video Area */}
        <div 
          ref={videoContainerRef}
          className="flex-1 rounded-[1.5rem] overflow-hidden bg-black border border-slate-200 shadow-xl relative flex items-center justify-center"
        >
          {/* Always show the video player so Admin can preview before going live */}
          <div className="w-full h-full relative">
            <LivePlayer key={syncKey} videoId={liveClass.meeting_link || liveClass.youtube_video_id} isMuted={localMute} />
          </div>
          
          <AnimatePresence>
            {!liveClass.is_active && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[15] bg-black/40 flex flex-col items-center justify-center pointer-events-none"
              >
                <div className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-4 rounded-2xl flex flex-col items-center gap-3 border border-white/10 shadow-2xl">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Activity size={24} className="text-red-500" />
                  </div>
                  <h2 className="text-xl font-black tracking-widest uppercase">OFF AIR</h2>
                  <p className="text-slate-300 text-sm font-medium">Click GO LIVE to broadcast to students</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {remoteVideoHidden && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(24px)' }}
                exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                className="absolute inset-0 z-[10] bg-white/80 flex flex-col items-center justify-center"
              >
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 bg-indigo-100 rounded-full flex items-center justify-center mb-8 relative shadow-lg shadow-indigo-200"
                >
                  <div className="absolute inset-0 border-[3px] border-indigo-300 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
                  <Play size={48} className="text-indigo-600 ml-2" />
                </motion.div>
                <h2 className="text-4xl font-black tracking-widest uppercase text-indigo-900 text-center px-4">Video Paused</h2>
                <p className="text-slate-600 mt-4 font-bold tracking-widest uppercase text-sm">You have paused the video stream</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Local Controls Overlay */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-3">
            <button 
                onClick={() => setLocalMute(!localMute)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all shadow-md ${localMute ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white/80 backdrop-blur-md text-slate-800 hover:bg-white'}`}
            >
              {localMute ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {localMute ? "Muted Locally" : "Unmuted Locally"}
            </button>
          </div>

          {/* Live Poll Results Overlay */}
          <AnimatePresence>
            {isPollActive && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-20 left-4 z-40 bg-white/95 backdrop-blur-md border border-slate-200 p-5 rounded-2xl shadow-xl w-64"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-900 text-sm tracking-widest uppercase flex items-center gap-2">
                    <BarChart2 size={16} className="text-indigo-600" /> Live Poll
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{totalVotes} Votes</span>
                </div>
                
                <div className="space-y-3">
                  {(['A', 'B', 'C', 'D'] as const).map(opt => {
                    const count = pollResults[opt];
                    const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                    return (
                      <div key={opt} className="relative">
                        <div className="flex justify-between text-[11px] font-bold mb-1 relative z-10 text-slate-700 px-1">
                          <span>Option {opt}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-6 w-full bg-slate-100 rounded-md overflow-hidden relative">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, type: 'spring' }}
                            className="absolute inset-y-0 left-0 bg-indigo-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating Hearts Container */}
          <div className="absolute inset-0 pointer-events-none z-[55] overflow-hidden">
            <AnimatePresence>
              {floatingHearts.map(h => (
                <motion.div 
                  key={h.id}
                  initial={{ opacity: 0, y: 50, scale: 0, x: 0 }}
                  animate={{ 
                    opacity: [0, 1, 1, 0],
                    y: -400,
                    x: [0, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 150],
                    scale: [0.5, 1.2, 1, 1.5] 
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: h.duration, ease: "easeOut" }}
                  className="absolute bottom-10 flex items-center justify-center"
                  style={{ left: `${h.left}%` }}
                >
                  <Heart fill="#ef4444" className="text-red-500 drop-shadow-md" size={h.size} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Raise Hand Notifications Overlay */}
        <div className="absolute bottom-5 left-5 z-[60] flex flex-col gap-2">
          <AnimatePresence>
            {raisedHands.map(hand => (
              <motion.div 
                key={hand.id}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-yellow-500 text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 border border-yellow-400"
              >
                <div className="bg-white/20 p-1.5 rounded-xl">
                  <Hand size={18} fill="currentColor" />
                </div>
                <div>
                  <p className="text-[13px] font-bold leading-none">{hand.name}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-yellow-100 mt-1">Raised Hand for Doubt</p>
                </div>
                <button onClick={() => setRaisedHands(prev => prev.filter(h => h.id !== hand.id))} className="ml-2 hover:bg-black/10 p-1 rounded-lg">
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right: Light Theme Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 400 }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="shrink-0 bg-white rounded-[1.5rem] border border-slate-200 shadow-xl flex flex-col overflow-hidden absolute lg:relative right-4 top-4 bottom-4 lg:inset-0 z-40 lg:z-auto"
            >
              
              <div className="p-5 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between z-10 shadow-sm">
                <h3 className="font-black text-slate-900 text-lg tracking-tight flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" /> Studio Chat
                </h3>
                <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded tracking-widest uppercase animate-pulse">Live</span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 premium-scrollbar relative bg-slate-50/50">
                <AnimatePresence>
                  {messages.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4"
                    >
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                        <ShieldAlert size={24} className="text-slate-300" />
                      </div>
                      <p className="text-[11px] font-black tracking-widest uppercase text-slate-400">No messages yet</p>
                    </motion.div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isAdmin = msg.user_role === 'admin' || msg.user_role === 'teacher';
                      
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, scale: 0.9, y: 10, originY: 1 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          key={msg.id || idx} 
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} group/msg`}
                        >
                          <div className={`flex items-baseline gap-2 mb-1 px-1 ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className={`text-[11px] font-bold ${isAdmin ? 'text-indigo-600' : 'text-slate-500'}`}>{isAdmin ? "You" : msg.user_name}</span>
                            {!isAdmin && (
                              <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover/msg:opacity-100 transition-opacity text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 ml-1">
                                <Trash2 size={12} />
                              </button>
                            )}
                            {isAdmin && <span className="text-[9px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Host</span>}
                          </div>
                          <div className={`px-4 py-2.5 rounded-[1.25rem] text-[13.5px] font-medium leading-relaxed max-w-[85%] shadow-sm ${
                            isAdmin ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/20' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200'
                          }`}>
                            {msg.message}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-1" />
              </div>

              <div className="p-4 bg-white border-t border-slate-100 shrink-0 z-10">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={isChatLocked ? "Chat is locked by Host..." : "Broadcast a message..."}
                    disabled={isChatLocked}
                    className={`w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-14 py-3.5 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white text-slate-800 placeholder-slate-400 transition-all shadow-inner ${isChatLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={!newMessage.trim() || isChatLocked}
                    className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-full disabled:opacity-0 disabled:scale-75 transition-all shadow-md"
                  >
                    <Send size={16} />
                  </motion.button>
                </form>
              </div>
              
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
