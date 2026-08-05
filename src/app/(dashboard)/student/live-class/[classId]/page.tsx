"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, Users, Lock, Circle, Maximize, RefreshCw, MessageSquare, Heart, Power, Play, HelpCircle, FileText, Sparkles, ChevronRight, LogOut, Hand, CheckCircle2, BarChart2, Clock } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getLiveClassById, getChatHistory, sendChatMessage, getCanonicalLiveClassId } from "@/actions/liveClasses";
import LivePlayer from "@/components/LivePlayer";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentLiveRoom() {
  const { classId } = useParams();
  const router = useRouter();
  
  const [liveClass, setLiveClass] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canonicalClassId, setCanonicalClassId] = useState<string | null>(null);
  
  // Chat & UI state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showChat, setShowChat] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'qa' | 'notes'>('chat');
  const [syncKey, setSyncKey] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState<{id: number, left: number, size: number, duration: number, isHand?: boolean}[]>([]);
  const [classEnded, setClassEnded] = useState(false);
  const heartCounter = useRef(0);
  
  // Remote Control State
  const [remoteMuted, setRemoteMuted] = useState(false);
  const [remoteVideoHidden, setRemoteVideoHidden] = useState(false);
  const [isChatLocked, setIsChatLocked] = useState(false);
  
  // Poll State
  const [isPollActive, setIsPollActive] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  // Session Timer State
  const [sessionTime, setSessionTime] = useState(0);
  
  // Fullscreen State
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Supabase Channel Refs for Realtime Broadcasts
  const controlChannelRef = useRef<any>(null);
  
  // Student Info & Anti-Piracy
  const [studentName, setStudentName] = useState("Student");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentId, setStudentId] = useState("anonymous");
  const [watermarkPos, setWatermarkPos] = useState({ top: '10%', left: '10%' });

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (liveClass?.is_active && !classEnded) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [liveClass?.is_active, classEnded]);

  // Anti-Piracy & Watermark Effect
  useEffect(() => {
    // Moving Watermark
    const watermarkInterval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 85) + '%',
        left: Math.floor(Math.random() * 75) + '%'
      });
    }, 3000);

    // Prevent Right Click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // Blur video when window loses focus (blocks some screen recorders / snipping tools)
    const handleVisibilityChange = () => {
      if (document.hidden && videoContainerRef.current) {
        videoContainerRef.current.style.filter = 'blur(15px) grayscale(100%)';
        videoContainerRef.current.style.opacity = '0.1';
      } else if (videoContainerRef.current) {
        videoContainerRef.current.style.filter = 'none';
        videoContainerRef.current.style.opacity = '1';
      }
    };

    // Block Screenshot Keyboard Shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' || 
        (e.ctrlKey && e.key === 'p') || 
        (e.metaKey && e.shiftKey && (e.key === 's' || e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        e.preventDefault();
        alert("Screenshots and screen recording are strictly prohibited on this platform.");
        if (videoContainerRef.current) {
          videoContainerRef.current.style.filter = 'blur(20px)';
          setTimeout(() => {
            if (videoContainerRef.current) videoContainerRef.current.style.filter = 'none';
          }, 3000);
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("keydown", handleKeyDown);

    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      clearInterval(watermarkInterval);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", onFullscreenChange);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      if (typeof window !== 'undefined' && (window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'FULLSCREEN', value: false }));
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user: studentId, online_at: new Date().toISOString() });
        }
      });

    const controlChannel = supabase
      .channel(`stream_control_${canonicalClassId}`)
      .on('broadcast', { event: 'CONTROL' }, (payload) => {
        const { type, value } = payload.payload;
        if (type === 'MUTE') setRemoteMuted(value);
        else if (type === 'VIDEO') setRemoteVideoHidden(value);
        else if (type === 'END_CLASS') setClassEnded(true);
        else if (type === 'LOCK_CHAT') setIsChatLocked(value);
        else if (type === 'POLL_START') {
          setIsPollActive(true);
          setHasVoted(false);
        }
        else if (type === 'POLL_END') {
          setIsPollActive(false);
        }
        else if (type === 'LIVE_STATUS') {
          setLiveClass((prev: any) => ({ ...prev, is_active: value }));
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
  }, [canonicalClassId, studentId]);

  useEffect(() => {
    fetchUserData();
    fetchClassData();

    const classChannel = supabase
      .channel(`live_class_status_${classId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'live_classes', filter: `id=eq.${classId}` },
        (payload) => {
          if (payload.new.is_active === false) setClassEnded(true);
          else if (payload.new.is_active === true) setLiveClass((prev: any) => ({ ...prev, is_active: true }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(classChannel);
    };
  }, [classId]);
  
  useEffect(() => {
    if (classEnded && liveClass) {
      const timer = setTimeout(() => {
        router.push(`/student/courses/${liveClass.course_id}`);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [classEnded, liveClass, router]);

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

  const triggerHandAnimation = () => {
    const id = heartCounter.current++;
    const left = Math.random() * 80 + 10;
    const size = 32;
    const duration = 3;
    setFloatingHearts(prev => [...prev, { id, left, size, duration, isHand: true }]);
    setTimeout(() => {
      setFloatingHearts(prev => prev.filter(h => h.id !== id));
    }, 4500);
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

  const sendHeart = async () => {
    triggerHeart();
    try {
      await sendChatMessage(canonicalClassId || (classId as string), studentName, 'student', "HEART_EMOJI_EVENT");
    } catch (err) {}
  };

  const raiseHand = async () => {
    triggerHandAnimation();
    try {
      await broadcastStreamControl('RAISE_HAND', studentName);
    } catch (err) {}
  };

  const votePoll = async (option: string) => {
    if (hasVoted) return;
    setHasVoted(true);
    try {
      await broadcastStreamControl('POLL_ANSWER', option);
    } catch (err) {}
  };

  const fetchUserData = async () => {
    let userId = null;
    const match = document.cookie.match(/(^| )user_id=([^;]+)/);
    if (match) {
      userId = match[2];
      setStudentId(userId);
      try {
        const { data } = await supabase.from('users').select('full_name, phone').eq('id', userId).single();
        if (data) {
          if (data.full_name) setStudentName(data.full_name);
          if (data.phone) setStudentPhone(data.phone);
        }
      } catch (err) {}
    }
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
      router.push("/student");
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    if (!canonicalClassId) return;
    try {
      const chatHistory = await getChatHistory(canonicalClassId);
      const filtered = chatHistory.filter((m: any) => m.message !== "HEART_EMOJI_EVENT");
      setMessages(filtered || []);
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
    if (!newMessage.trim() || isChatLocked) return;
    const messageText = newMessage.trim();
    setNewMessage("");

    try {
      await sendChatMessage(canonicalClassId || (classId as string), studentName, 'student', messageText);
    } catch (err) {
      // Silently fail or show toast
    }
  };

  const handleFullscreen = () => {
    if (videoContainerRef.current) {
      if (document.fullscreenElement) document.exitFullscreen();
      else videoContainerRef.current.requestFullscreen();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

  if (!liveClass) {
    return null; // Will unmount soon due to router.push in fetchClassData catch block
  }

  const isRecorded = liveClass?.status === 'recorded';

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans">
      
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

      {/* Class Ended Popup Overlay (Only for Live Classes) */}
      <AnimatePresence>
        {classEnded && !isRecorded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[999999] bg-slate-900/40 backdrop-blur-md flex items-center justify-center"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white border border-slate-200 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center max-w-md w-full mx-4 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
              
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-8 relative">
                <Power size={36} className="text-red-500 relative z-10" />
                <div className="absolute inset-0 border-2 border-red-500/30 rounded-full animate-ping"></div>
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Session Ended</h2>
              <p className="text-slate-500 mb-8 font-medium leading-relaxed">The educator has concluded this live session. Redirecting you back to your study room...</p>
              
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 3.5, ease: "linear" }}
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-full"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Light Theme Header */}
      <header className="h-16 lg:h-20 shrink-0 border-b border-slate-200 bg-white px-3 lg:px-8 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-3 lg:gap-5">
          <div className="max-w-[140px] sm:max-w-none truncate">
            <h1 className="text-lg lg:text-xl font-black text-slate-900 leading-tight tracking-tight truncate">{liveClass.title || liveClass.topic}</h1>
            <p className="text-[10px] lg:text-xs text-indigo-600 font-bold tracking-widest uppercase mt-0.5 truncate">{liveClass.courses?.title}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isRecorded && liveClass?.is_active && (
            <div className="hidden sm:flex px-4 py-2.5 rounded-xl font-bold text-[13px] items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600">
              <Clock size={14} className="text-indigo-600" />
              <span className="font-mono tracking-widest mt-0.5">{formatTime(sessionTime)}</span>
            </div>
          )}
          
          {!isRecorded && (
            <button 
              onClick={() => setSyncKey(prev => prev + 1)}
              className="hidden md:flex px-4 py-2.5 rounded-xl font-bold text-[13px] items-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-all active:scale-95"
              title="Refresh stream to fix delay"
            >
              <RefreshCw size={14} /> Sync to Live
            </button>
          )}
          
          <motion.div 
            animate={!isRecorded && liveClass.is_active ? { boxShadow: ['0px 0px 0px rgba(239,68,68,0)', '0px 0px 15px rgba(239,68,68,0.3)', '0px 0px 0px rgba(239,68,68,0)'] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`px-5 py-2.5 rounded-xl font-black text-[11px] flex items-center gap-2 tracking-widest uppercase border ${isRecorded ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : liveClass.is_active ? 'bg-red-50 text-red-600 border-red-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}
          >
            {!isRecorded && <Circle size={10} fill="currentColor" className={liveClass.is_active ? "animate-pulse" : ""} />}
            {isRecorded ? "RECORDED VOD" : liveClass.is_active ? "LIVE NOW" : "STARTING SOON"}
          </motion.div>

          <Link 
            href={`/student/courses/${liveClass.course_id}`}
            className={`px-3 py-2 lg:px-5 lg:py-2.5 rounded-lg lg:rounded-xl font-bold text-xs lg:text-[13px] flex items-center gap-1.5 lg:gap-2 shadow-md transition-all active:scale-95 ml-1 lg:ml-2 ${isRecorded ? 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-800/20' : 'bg-red-600 text-white shadow-red-600/20 hover:bg-red-700'}`}
          >
            <LogOut size={16} /> <span className="hidden sm:inline">{isRecorded ? 'Go Back' : 'Leave'}</span>
          </Link>

          <button 
            onClick={() => setShowChat(!showChat)}
            className="lg:hidden w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 rounded-lg lg:rounded-xl text-white transition-all shadow-md ml-1"
          >
            {showChat ? <ChevronRight size={18} /> : <MessageSquare size={18} />}
          </button>
        </div>
      </header>

      {/* Main Content Area: 70/30 Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden p-0 lg:p-5 gap-0 lg:gap-5 relative bg-black lg:bg-transparent">
        
        {/* Left (70%): Video Area */}
        <div 
          ref={videoContainerRef}
          className="lg:w-[70%] h-[35vh] sm:h-[45vh] lg:h-full rounded-none lg:rounded-[1.5rem] overflow-hidden bg-black lg:border border-slate-200 lg:shadow-xl relative flex items-center justify-center group/video shrink-0 lg:shrink"
        >
          {liveClass.is_active || isRecorded ? (
            <>
              {/* Dynamic Watermark */}
              <motion.div 
                animate={{ top: watermarkPos.top, left: watermarkPos.left }}
                transition={{ duration: 2, ease: "linear" }}
                className="absolute z-[40] pointer-events-none opacity-20 text-white font-black whitespace-nowrap select-none text-center tracking-widest uppercase shadow-black/50"
                style={{ fontSize: '16px', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
              >
                <div>{studentName}</div>
                {studentPhone && <div className="text-sm mt-0.5">{studentPhone}</div>}
              </motion.div>

              <div className="w-full h-full relative z-[5]">
                <LivePlayer key={syncKey} videoId={liveClass.youtube_video_id || liveClass.meeting_link} isMuted={remoteMuted} controls={isRecorded} />
              </div>
              
              <AnimatePresence>
                {remoteVideoHidden && !isRecorded && (
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
                    <p className="text-slate-600 mt-4 font-bold tracking-widest uppercase text-sm">Instructor has paused the video stream</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Poll Overlay for Fullscreen Mode */}
              <AnimatePresence>
                {isPollActive && !isRecorded && isFullscreen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 50 }}
                    className="absolute bottom-8 right-8 z-[90] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.3)] p-6 w-72 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                        <BarChart2 size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-slate-900 font-black text-lg leading-none">Live Poll</h3>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Select an option</p>
                      </div>
                    </div>
                    
                    {hasVoted ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100"
                      >
                        <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                        <p className="font-black text-emerald-700 text-lg">Vote Submitted!</p>
                        <p className="text-[10px] text-emerald-600/70 mt-1 font-bold tracking-widest uppercase">Waiting for poll to end</p>
                      </motion.div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {(['A', 'B', 'C', 'D'] as const).map(opt => (
                          <motion.button
                            key={opt}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => votePoll(opt)}
                            className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 py-3 rounded-xl font-black text-xl transition-all shadow-sm flex items-center justify-center"
                          >
                            {opt}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleFullscreen} 
                className="absolute top-4 right-4 z-20 w-12 h-12 flex items-center justify-center bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-xl text-white transition-all shadow-md hover:scale-105 active:scale-95"
                title="Fullscreen"
              >
                <Maximize size={18} />
              </button>

              {/* Interaction Buttons Overlay (Hidden in VOD mode) */}
              {!isRecorded && (
                <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={raiseHand}
                    title="Raise Hand for Doubt"
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-lg transition-all text-white"
                  >
                    <Hand size={20} fill="currentColor" className="drop-shadow-sm text-yellow-400" />
                  </motion.button>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={sendHeart}
                    className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center shadow-lg transition-all group"
                  >
                    <Heart fill="#ef4444" className="text-red-500 drop-shadow-sm group-hover:animate-pulse" size={22} />
                  </motion.button>
                </div>
              )}

            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm z-10 relative">
                <Lock size={32} className="text-slate-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 z-10 relative tracking-tight">Class hasn't started yet</h2>
              <p className="text-slate-500 z-10 relative font-medium">Please wait for the educator to go live.</p>
            </div>
          )}

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
                  {h.isHand ? (
                    <Hand className="text-yellow-400" size={h.size} fill="currentColor" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }} />
                  ) : (
                    <Heart fill="#ef4444" className="text-red-500" size={h.size} style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.5))' }} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Right (30%): Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="lg:w-[30%] flex-1 lg:flex-none shrink-0 bg-white rounded-t-3xl lg:rounded-[1.5rem] lg:border border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] lg:shadow-xl flex flex-col overflow-hidden relative mt-[-15px] lg:mt-0 z-10"
            >
              
              {/* Chat Tabs */}
              <div className="p-3 lg:p-4 border-b border-slate-100 bg-white shrink-0 z-10">
                <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-lg lg:rounded-xl border border-slate-200/50">
                  {(['chat', 'qa', 'notes'] as const).map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)} 
                      className="relative flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors z-10"
                    >
                      {activeTab === tab && (
                        <motion.div 
                          layoutId="activeTabStudent"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/50 -z-10"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <span className={activeTab === tab ? 'text-indigo-600' : 'text-slate-500'}>
                        {tab === 'chat' && <MessageSquare size={14} className="inline mr-1.5 mb-0.5" />}
                        {tab === 'qa' && <HelpCircle size={14} className="inline mr-1.5 mb-0.5" />}
                        {tab === 'notes' && <FileText size={14} className="inline mr-1.5 mb-0.5" />}
                        {tab}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative bg-slate-50/50 flex flex-col">
                <AnimatePresence mode="wait">
                  {activeTab === 'chat' ? (
                    <motion.div 
                      key="chat"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 overflow-y-auto p-4 space-y-5 premium-scrollbar pb-6"
                    >
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                          <Sparkles size={40} className="text-slate-300" />
                          <p className="text-sm font-bold tracking-widest uppercase">Say hello to the class!</p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => {
                          const isMe = msg.user_name === studentName;
                          const isAdmin = msg.user_role === 'admin' || msg.user_role === 'teacher';
                          
                          return (
                            <motion.div 
                              layout
                              initial={{ opacity: 0, scale: 0.9, y: 10, originY: 1 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              key={msg.id || idx} 
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg`}
                            >
                              <div className={`flex items-baseline gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className={`text-[12px] font-bold ${isAdmin ? 'text-red-600' : 'text-slate-500'}`}>{isMe ? "You" : msg.user_name}</span>
                                {isAdmin && <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase font-black tracking-wider">Educator</span>}
                              </div>
                              <div className={`px-4 py-2.5 rounded-[1.25rem] text-[14px] font-medium leading-relaxed max-w-[85%] shadow-sm ${
                                isAdmin ? 'bg-red-600 text-white rounded-tl-sm shadow-red-600/20' : 
                                isMe ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/20' : 'bg-white text-slate-800 rounded-tl-sm border border-slate-200/60'
                              }`}>
                                {msg.message}
                              </div>
                            </motion.div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} className="h-1" />
                    </motion.div>
                  ) : (
                    <motion.div 
                      key={activeTab}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 border border-slate-200 shadow-sm">
                        {activeTab === 'qa' ? <HelpCircle size={28} className="text-slate-400" /> : <FileText size={28} className="text-slate-400" />}
                      </div>
                      <h3 className="text-slate-900 font-bold text-xl mb-2">Coming Soon</h3>
                      <p className="text-slate-500 text-sm font-medium">This feature will be available in the next update.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Poll Overlay inside Chat (Hidden when fullscreen) */}
                <AnimatePresence>
                  {isPollActive && !isRecorded && !isFullscreen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 100 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 100 }}
                      className="absolute bottom-4 left-4 right-4 z-[60] bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_10px_40px_rgba(0,0,0,0.15)] p-6 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                          <BarChart2 size={20} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-slate-900 font-black text-lg leading-none">Live Poll</h3>
                          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Select an option</p>
                        </div>
                      </div>
                      
                      {hasVoted ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center justify-center py-6 text-center bg-emerald-50 rounded-2xl border border-emerald-100"
                        >
                          <CheckCircle2 size={40} className="text-emerald-500 mb-2" />
                          <p className="font-black text-emerald-700 text-lg">Vote Submitted!</p>
                          <p className="text-[10px] text-emerald-600/70 mt-1 font-bold tracking-widest uppercase">Waiting for poll to end</p>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {(['A', 'B', 'C', 'D'] as const).map(opt => (
                            <motion.button
                              key={opt}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => votePoll(opt)}
                              className="bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-400 text-slate-700 hover:text-indigo-700 py-3 rounded-xl font-black text-xl transition-all shadow-sm flex items-center justify-center"
                            >
                              {opt}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Input Area (Hidden for VODs) */}
              {activeTab === 'chat' && (
                <div className="p-3 lg:p-4 bg-white border-t border-slate-100 shrink-0 z-10 pb-safe pb-4 lg:pb-4">
                  {isRecorded ? (
                    <div className="text-center p-2 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 font-medium text-sm">
                      Chat is read-only for recorded classes.
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="relative flex items-center">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={isChatLocked ? "Chat is locked by Educator..." : "Type your message..."}
                        disabled={isChatLocked}
                        className={`w-full bg-slate-50 border border-slate-200 rounded-full pl-5 pr-14 py-3.5 text-[14px] font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white text-slate-800 placeholder-slate-400 transition-all shadow-inner ${isChatLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        disabled={!newMessage.trim() || isChatLocked}
                        className="absolute right-1.5 p-2.5 bg-indigo-600 text-white rounded-full disabled:opacity-0 disabled:scale-75 transition-all shadow-md"
                      >
                        <Send size={16} />
                      </motion.button>
                    </form>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
