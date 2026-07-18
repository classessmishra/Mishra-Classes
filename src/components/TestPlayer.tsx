"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Clock, Check, X, Minus, AlertTriangle, ArrowRight, ArrowLeft, Flag, Trophy, Target, BarChart2, Hash, Users } from "lucide-react";
import { submitTest, reportQuestion, getComprehensiveTestAnalytics } from "@/actions/tests";
import { supabase } from "@/lib/supabase";

type Question = {
  id?: string;
  text: string;
  image_url?: string;
  options: string[];
  correct_option_index: number;
  positive_marks: number;
  negative_marks: number;
  original_index?: number;
  section?: string;
};

type TestConfig = {
  id?: string;
  test_title: string;
  duration_minutes: number;
  scramble_enabled?: boolean;
  questions: Question[];
  initial_answers?: (number | null)[];
  initial_time_spent?: number[];
};

export default function TestPlayer({ testData, studentId, initialMode = false, leaderboard: initialLeaderboard, courseId }: { testData: TestConfig, studentId?: string, initialMode?: boolean, leaderboard?: any[], courseId?: string }) {
  const [stage, setStage] = useState<"start" | "running" | "result">(initialMode ? "result" : "start");
  
  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>(initialLeaderboard || []);
  
  useEffect(() => {
    if (initialLeaderboard) {
      setLeaderboard(initialLeaderboard);
    }
  }, [initialLeaderboard]);
  
  // Realtime Leaderboard updates
  useEffect(() => {
    if (!testData.id || stage !== "result") return;

    const fetchLatest = async () => {
      try {
        const analytics = await getComprehensiveTestAnalytics(testData.id!);
        if (analytics && analytics.leaderboard) {
          setLeaderboard(analytics.leaderboard);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };

    const channel = supabase
      .channel(`test_updates:${testData.id}`)
      .on('postgres_changes', {
        event: '*', // Listen to INSERT/UPDATE/DELETE
        schema: 'public',
        table: 'test_submissions',
        filter: `test_id=eq.${testData.id}`
      }, () => {
        fetchLatest();
      })
      .on('postgres_changes', {
        event: 'UPDATE', // Admin updating test questions/scores
        schema: 'public',
        table: 'tests',
        filter: `id=eq.${testData.id}`
      }, () => {
        fetchLatest();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [testData.id, stage]);
  
  // Test State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(testData.initial_answers || []);
  const [reviewStatus, setReviewStatus] = useState<boolean[]>([]);
  const [timeSpent, setTimeSpent] = useState<number[]>(testData.initial_time_spent || []);
  const [timeLeft, setTimeLeft] = useState(testData.duration_minutes * 60);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [hasSavedState, setHasSavedState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Sections
  const sections = Array.from(new Set(questions.map(q => q.section || "Default")));
  const activeSection = questions[currentQ]?.section || "Default";
  const firstIdxOfActiveSection = questions.findIndex(q => (q.section || "Default") === activeSection);
  const localQNum = currentQ - (firstIdxOfActiveSection !== -1 ? firstIdxOfActiveSection : 0) + 1;
  
  // New Config State
  const [testConfig, setTestConfig] = useState<any>({ allow_section_switching: true });
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  
  // UI State
  const [panelOpen, setPanelOpen] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "correct" | "wrong" | "skipped">("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  
  // Security State
  const [violations, setViolations] = useState(0);
  const [warningActive, setWarningActive] = useState(false);
  const MAX_VIOLATIONS = 4;
  
  // Declaration State
  const [agreed, setAgreed] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false);

  // Initialize and Scramble
  useEffect(() => {
    let finalQs: Question[] = [];
    const sectionGroups: Record<string, Question[]> = {};
    const sectionOrder: string[] = [];
    
    testData.questions.forEach((q, i) => {
      const sec = q.section || "Default";
      if (!sectionGroups[sec]) {
        sectionGroups[sec] = [];
        sectionOrder.push(sec);
      }
      sectionGroups[sec].push({ ...q, original_index: i });
    });

    sectionOrder.forEach(sec => {
      let secQs = sectionGroups[sec];
      if (testData.scramble_enabled) {
        // Basic Fisher-Yates shuffle for questions within section
        for (let i = secQs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [secQs[i], secQs[j]] = [secQs[j], secQs[i]];
        }
      }
      finalQs = [...finalQs, ...secQs];
    });
    
    let qs = finalQs;
    // Check local storage for saved state
    const storageKey = `test_state_${testData.id || testData.test_title}`;
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      setHasSavedState(true);
    }
    
    
    if (initialMode) {
      setQuestions(qs);
      return;
    }

    setQuestions(qs);
    setAnswers(new Array(qs.length).fill(null));
    setReviewStatus(new Array(qs.length).fill(false));
    setTimeSpent(new Array(qs.length).fill(0));
  }, [testData, initialMode]);

  // Timer Logic & Time Spent Tracking
  useEffect(() => {
    if (stage === "running" && !warningActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        
        // Track time spent on current question
        if (!isReviewMode) {
           setTimeSpent(prev => {
             const newTs = [...prev];
             newTs[currentQ] = (newTs[currentQ] || 0) + 1;
             return newTs;
           });
        }
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage, warningActive, currentQ, isReviewMode]);

  // Save State Periodically
  useEffect(() => {
    if (stage === "running" && !isReviewMode) {
      const storageKey = `test_state_${testData.id || testData.test_title}`;
      const state = {
        answers,
        reviewStatus,
        timeSpent,
        timeLeft
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [answers, reviewStatus, timeSpent, timeLeft, stage, isReviewMode, testData, completedSections]);

  const handleReportQuestion = async () => {
    if (!reportReason.trim() || !studentId || !testData.id) return;
    setReporting(true);
    try {
      await reportQuestion(testData.id, studentId, currentQ, reportReason);
      alert("Question reported successfully. We will review it shortly.");
      setShowReportModal(false);
      setReportReason("");
    } catch (e: any) {
      alert("Failed to report question: " + e.message);
    } finally {
      setReporting(false);
    }
  };

  // Security: Fullscreen Listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (stage === "running" && !isReviewMode && !isSubmittingRef.current && !document.fullscreenElement) {
        handleViolation();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [stage, violations, warningActive, isReviewMode]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log("Fullscreen Error:", err));
    }
  };

  const handleViolation = () => {
    if (warningActive || isReviewMode) return;
    const newViolations = violations + 1;
    setViolations(newViolations);
    setWarningActive(true);
    
    if (newViolations >= MAX_VIOLATIONS) {
      setTimeout(() => {
        handleAutoSubmit();
      }, 2000);
    }
  };

  const resumeAfterViolation = () => {
    enterFullscreen();
    setWarningActive(false);
  };

  const startTest = (resume = false) => {
    const storageKey = `test_state_${testData.id || testData.test_title}`;
    
    if (!resume && hasSavedState) {
      if (!confirm("⚠️ Old test data found!\n\nStarting a new test will DELETE your previous progress.\n\nClick OK to Start New (Delete Data) or Cancel to go back.")) {
        return;
      }
      localStorage.removeItem(storageKey);
      setHasSavedState(false);
      setAnswers(new Array(questions.length).fill(null));
      setReviewStatus(new Array(questions.length).fill(false));
      setTimeSpent(new Array(questions.length).fill(0));
      setTimeLeft(testData.duration_minutes * 60);
    } else if (resume) {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        if (saved.answers) setAnswers(saved.answers);
        if (saved.reviewStatus) setReviewStatus(saved.reviewStatus);
        if (saved.timeSpent) setTimeSpent(saved.timeSpent);
        if (saved.timeLeft) setTimeLeft(saved.timeLeft);
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    enterFullscreen();
    setStage("running");
  };

  const handleAutoSubmit = async () => {
    isSubmittingRef.current = true;
    setWarningActive(false);
    setIsSubmitting(true);
    
    // Save to DB
    if (studentId && testData.id) {
      const { score } = getScoreData();
      const timeTaken = (testData.duration_minutes * 60) - timeLeft;
      
      try {
        await submitTest(testData.id, studentId, {
          score,
          time_taken_seconds: timeTaken,
          answers,
          time_spent: timeSpent,
          course_id: courseId
        });
        
        // Refetch leaderboard to update ranks and overall stats immediately
        const analytics = await getComprehensiveTestAnalytics(testData.id);
        if (analytics && analytics.leaderboard) {
          setLeaderboard(analytics.leaderboard);
        }
      } catch (err) {
        console.error("Failed to submit test", err);
      }
    }

    setStage("result");
    setIsSubmitting(false);
    
    const storageKey = `test_state_${testData.id || testData.test_title}`;
    localStorage.removeItem(storageKey);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(e => console.log(e));
    }
  };

  const submitManual = () => {
    isSubmittingRef.current = true;
    if (confirm("Are you sure you want to submit the test?")) {
      handleAutoSubmit();
    } else {
      enterFullscreen();
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 1000);
    }
  };

  const toggleOption = (optIdx: number) => {
    if (isReviewMode) return;
    const newAnswers = [...answers];
    if (newAnswers[currentQ] === optIdx) {
      newAnswers[currentQ] = null; // Unselect
    } else {
      newAnswers[currentQ] = optIdx; // Select
    }
    setAnswers(newAnswers);
  };

  const toggleReview = () => {
    if (isReviewMode) return;
    const newRev = [...reviewStatus];
    newRev[currentQ] = !newRev[currentQ];
    setReviewStatus(newRev);
  };

  const getScoreData = () => {
    let score = 0;
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let maxScore = 0;

    questions.forEach((q, idx) => {
      maxScore += q.positive_marks;
      const ans = answers[idx];
      if (ans === null || ans === undefined) {
        skipped++;
      } else if (ans === q.correct_option_index) {
        correct++;
        score += q.positive_marks;
      } else {
        wrong++;
        score -= q.negative_marks;
      }
    });

    const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0;

    return { score, maxScore, correct, wrong, skipped, accuracy };
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const currentQuestionData = questions[currentQ];

  // --------- START SCREEN (DECLARATION) ---------
  if (stage === "start") {
    return (
      <div className="min-h-screen bg-slate-50 absolute inset-0 z-[200] flex flex-col h-full w-full">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 p-4 px-8 flex items-center justify-between shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">{testData.test_title}</h1>
            <p className="text-sm text-slate-500">Duration: {testData.duration_minutes} Minutes | Total Questions: {testData.questions.length}</p>
          </div>
          <div className="text-sm font-semibold text-slate-600 bg-slate-100 px-4 py-2 rounded-lg">
            Candidate ID: {studentId || "Guest"}
          </div>
        </header>

        {/* Instructions Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
            <div className="bg-blue-600 text-white p-4 font-bold text-lg">
              General Instructions
            </div>
            <div className="p-8 space-y-6 text-slate-700 text-sm leading-relaxed">
              <p><strong>Please read the following instructions carefully before starting the exam:</strong></p>
              
              <ul className="list-decimal pl-5 space-y-3">
                <li>Total duration of this test is <strong>{testData.duration_minutes} minutes</strong>.</li>
                <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                <li>Each question has 4 options, out of which only one is correct.</li>
                <li>For each correct answer, you will be awarded positive marks. For each wrong answer, negative marks may be deducted as per the question's rules. Unanswered questions will receive 0 marks.</li>
                <li>You can navigate to any question directly by clicking on the question number palette on the right side of the screen.</li>
                <li><span className="text-red-600 font-bold">WARNING:</span> Do not exit Fullscreen mode. Your test will auto-submit after {MAX_VIOLATIONS} warnings.</li>
                <li>Do not refresh the page or close the browser window during the test. Doing so may result in your answers being lost or early submission of the test.</li>
                <li>Ensure you have a stable internet connection before starting the test.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Declaration and Action */}
        <div className="bg-white border-t border-slate-200 p-6 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
          <div className="max-w-4xl mx-auto">
            <label className="flex items-start gap-3 cursor-pointer p-4 border border-blue-100 bg-blue-50/50 rounded-xl mb-6 hover:bg-blue-50 transition-colors">
              <input 
                type="checkbox" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">
                I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action.
              </span>
            </label>
            
            <div className="flex justify-end gap-4">
              {hasSavedState && (
                <button 
                  onClick={() => startTest(true)} 
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-8 py-3 rounded-xl font-bold text-lg shadow-sm transition-colors"
                >
                  Resume Previous Session
                </button>
              )}
              <button 
                onClick={() => startTest(false)}
                disabled={!agreed}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-10 py-3 rounded-xl font-bold text-lg shadow-sm transition-colors"
              >
                I am ready to begin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------- RESULT DASHBOARD SCREEN ---------
  if (stage === "result" && !isReviewMode) {
    const res = getScoreData();
    
    // Compute section stats
    const sectionStats: Record<string, { total: number, correct: number, wrong: number, skipped: number }> = {};
    questions.forEach((q, idx) => {
      const sec = q.section || "General";
      if (!sectionStats[sec]) sectionStats[sec] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      sectionStats[sec].total++;
      const ans = answers[idx];
      if (ans === null || ans === undefined) {
        sectionStats[sec].skipped++;
      } else if (ans === q.correct_option_index) {
        sectionStats[sec].correct++;
      } else {
        sectionStats[sec].wrong++;
      }
    });

    const currentRank = leaderboard.find(l => l.student_id === studentId)?.rank || "-";

    return (
      <div className="fixed inset-0 z-[200] bg-slate-50 overflow-y-auto w-full h-full">
        {/* Mobile Native Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-[#5B58FF] z-[210] flex items-center px-4 shadow-md text-white">
          <button onClick={() => window.location.href = "/student/tests"} className="p-2 -ml-2 shrink-0">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold truncate ml-2">Test Analysis</h1>
        </div>

        <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-24 pt-20 p-3 md:p-8 md:pt-8">
          
          {/* Desktop Header */}
          <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">{testData.test_title} <span className="text-slate-400 font-medium">| Analysis</span></h1>
              <p className="text-slate-500 text-sm mt-1 flex items-center gap-2 font-medium">
                <Clock size={16} className="text-blue-500" /> Completed in {Math.floor(((testData.duration_minutes * 60) - timeLeft) / 60)}m {((testData.duration_minutes * 60) - timeLeft) % 60}s
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 w-full md:w-auto">
              <button onClick={() => window.location.href = "/student/tests"} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                Exit
              </button>
              <button onClick={() => { setIsReviewMode(true); setStage("running"); setCurrentQ(0); setFilterType("all"); }} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 transition-colors">
                Review Answers
              </button>
            </div>
          </div>

          {/* Mobile Action Buttons */}
          <div className="md:hidden flex gap-3">
            <button onClick={() => window.location.href = "/student/tests"} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm">
              Exit
            </button>
            <button onClick={() => { setIsReviewMode(true); setStage("running"); setCurrentQ(0); setFilterType("all"); }} className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm shadow-blue-200">
              Review
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Overall Performance */}
            <div className="lg:col-span-1 space-y-6">
              {/* Score Card */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold tracking-[3px] mb-1 md:mb-2 mt-1 md:mt-2">FINAL SCORE</p>
                <h2 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-indigo-600 leading-none">{res.score}</h2>
                <p className="text-slate-400 text-[10px] md:text-xs mt-1 md:mt-2 mb-4 md:mb-6 font-bold tracking-wider">OUT OF {res.maxScore}</p>

                <div className="relative w-32 h-32 mx-auto mb-6 flex items-center justify-center rounded-full shadow-inner" style={{ background: `conic-gradient(#10b981 ${res.accuracy}%, #f1f5f9 0)` }}>
                  <div className="w-28 h-28 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                    <span className="text-2xl font-black text-slate-800">{res.accuracy}%</span>
                    <span className="text-[9px] text-slate-400 font-bold tracking-widest mt-1">ACCURACY</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-5">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-1"><Check size={16} strokeWidth={3} /></div>
                    <div className="font-bold text-lg text-slate-800 leading-tight">{res.correct}</div>
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Correct</div>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <div className="w-8 h-8 mx-auto bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-1"><X size={16} strokeWidth={3} /></div>
                    <div className="font-bold text-lg text-slate-800 leading-tight">{res.wrong}</div>
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Wrong</div>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-1"><Minus size={16} strokeWidth={3} /></div>
                    <div className="font-bold text-lg text-slate-800 leading-tight">{res.skipped}</div>
                    <div className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Skipped</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Analytics & Leaderboard */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Leaderboard Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 md:p-6 rounded-3xl shadow-sm text-white relative overflow-hidden flex flex-col justify-center">
                  <Trophy size={100} className="absolute -right-4 -bottom-4 text-white/10" />
                  <p className="text-indigo-100 text-[10px] md:text-sm font-bold tracking-wider mb-0.5 md:mb-1 relative z-10">YOUR BATCH RANK</p>
                  <div className="flex items-end gap-1.5 md:gap-2 relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black leading-none">{currentRank}</h2>
                    <span className="text-indigo-200 text-sm md:text-base font-medium mb-0.5 md:mb-1">/ {leaderboard.filter((l: any) => l.has_submitted).length || "-"}</span>
                  </div>
                  <p className="text-indigo-200 text-[11px] md:text-sm mt-3 md:mt-4 relative z-10 font-medium">Keep pushing! Every test makes you better.</p>
                </div>
                
                <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart2 size={18} className="text-indigo-500" /> Overall Test</h3>
                  
                  {leaderboard.length > 0 ? (() => {
                    const topperScore = Math.max(...leaderboard.map(l => l.score || 0));
                    const averageScore = Math.round(leaderboard.reduce((acc, l) => acc + (l.score || 0), 0) / leaderboard.length);
                    const studentScore = res.score;
                    const maxGraphVal = Math.max(topperScore, averageScore, studentScore, 10); // Ensure non-zero denominator

                    return (
                      <div className="space-y-5">
                        {/* Topper */}
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Trophy size={14} className="text-yellow-500" /> Highest Score</span>
                            <span className="text-slate-700 font-bold">{topperScore}</span>
                          </div>
                          <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden">
                            <div style={{ width: `${(topperScore / maxGraphVal) * 100}%` }} className="bg-yellow-400 h-full rounded-full transition-all duration-1000"></div>
                          </div>
                        </div>

                        {/* Average */}
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Users size={14} className="text-slate-400" /> Average Score</span>
                            <span className="text-slate-700 font-bold">{averageScore}</span>
                          </div>
                          <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden">
                            <div style={{ width: `${(averageScore / maxGraphVal) * 100}%` }} className="bg-slate-300 h-full rounded-full transition-all duration-1000"></div>
                          </div>
                        </div>

                        {/* Student */}
                        <div>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-indigo-700 flex items-center gap-1.5"><Target size={14} className="text-indigo-500" /> Your Score</span>
                            <span className="text-indigo-700 font-bold">{studentScore}</span>
                          </div>
                          <div className="w-full h-4 bg-indigo-100 rounded-full flex overflow-hidden">
                            <div style={{ width: `${(studentScore / maxGraphVal) * 100}%` }} className="bg-indigo-500 h-full rounded-full transition-all duration-1000"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="text-sm text-slate-500 text-center py-4">Not enough data to generate comparison.</div>
                  )}
                </div>
              </div>



              {/* Leaderboard Table */}
              <div className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm md:text-base"><Trophy size={18} className="text-yellow-500" /> Batch Top Performers</h3>
                
                {leaderboard.length > 0 ? (
                  <div className="flex flex-col gap-0">
                    {leaderboard.slice(0, 10).map((l, i) => (
                      <div key={i} className={`flex items-center justify-between p-3 md:p-4 border-b last:border-0 border-slate-100 ${l.student_id === studentId ? 'bg-blue-50/50' : ''} ${!l.has_submitted ? 'opacity-60' : ''}`}>
                        <div className="flex items-center gap-3 md:gap-4">
                          {l.has_submitted ? (
                            <span className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shrink-0 ${l.rank === 1 ? 'bg-yellow-100 text-yellow-700' : l.rank === 2 ? 'bg-slate-200 text-slate-700' : l.rank === 3 ? 'bg-amber-100 text-amber-700' : 'text-slate-500'}`}>
                              {l.rank}
                            </span>
                          ) : (
                            <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">-</span>
                          )}
                          
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg shrink-0">
                            {l.student_name.charAt(0).toUpperCase()}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-sm md:text-base leading-tight">
                              {l.student_name}
                            </span>
                            <div className="flex gap-2 mt-0.5">
                              {l.student_id === studentId && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">You</span>}
                              {!l.has_submitted && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Absent</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end shrink-0">
                          <span className="font-bold text-blue-600 text-lg md:text-xl leading-tight">
                            {l.has_submitted ? l.score : <span className="text-slate-400 text-base">N/A</span>}
                          </span>
                          <span className="text-[10px] md:text-xs text-slate-400 font-medium">
                            {l.has_submitted ? `${Math.floor(l.time_taken_seconds / 60)}m ${l.time_taken_seconds % 60}s` : 'Did not test'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Trophy size={48} className="mx-auto text-slate-200 mb-3" />
                    <p>Leaderboard is not available yet.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------- RUNNING / REVIEW SCREEN ---------
  // --------- RUNNING / REVIEW SCREEN ---------
  return (
    <>
      <div className={`flex flex-col h-screen w-screen bg-slate-50 absolute inset-0 z-[100] overflow-hidden ${warningActive ? "select-none blur-sm pointer-events-none" : ""}`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 relative z-10">
        <div className="font-bold text-blue-600 tracking-wider truncate max-w-[40%]">{testData.test_title}</div>
        <div className="flex items-center gap-4">
          {!isReviewMode && (
            <div className="bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full font-mono font-bold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-blue-600" /> {formatTime(timeLeft)}
            </div>
          )}
          {isReviewMode && (
            <button onClick={() => { setIsReviewMode(false); setStage("result"); }} className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg">Back to Result</button>
          )}
          <button onClick={() => setPanelOpen(!panelOpen)} className="md:hidden bg-slate-100 p-2 rounded-lg"><Flag size={20}/></button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Question Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${panelOpen ? "md:mr-80" : ""}`}>
          <div className="flex-1 overflow-y-auto p-6 md:p-10 pb-32">
            
            {/* Section Tabs */}
            {sections.length > 1 && (
              <div className="flex gap-2 mb-6 border-b border-slate-200 overflow-x-auto no-scrollbar">
                {sections.map(sec => {
                  const isActive = sec === activeSection;
                  return (
                    <button 
                      key={sec}
                      onClick={() => {
                        const firstQIdx = questions.findIndex(q => (q.section || "Default") === sec);
                        if (firstQIdx !== -1) setCurrentQ(firstQIdx);
                      }}
                      className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${isActive ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                    >
                      {sec}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <span className="bg-blue-50 text-blue-700 font-bold px-4 py-1.5 rounded-lg border border-blue-100">
                  Question {localQNum}
                </span>
                {isReviewMode && (
                  <span className="text-sm font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                    <Clock size={14} /> {timeSpent[currentQ] < 60 ? `${timeSpent[currentQ]}s` : `${Math.floor(timeSpent[currentQ]/60)}m ${timeSpent[currentQ]%60}s`}
                  </span>
                )}
                <span className="text-sm font-semibold text-green-600">+{currentQuestionData?.positive_marks || 0}</span>
                <span className="text-sm font-semibold text-red-500">-{currentQuestionData?.negative_marks || 0}</span>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded hover:bg-red-50 ml-2"
                  title="Report a mistake in this question"
                >
                  <Flag size={14} /> <span className="hidden sm:inline">Report</span>
                </button>
              </div>
            </div>

            <div className="text-lg md:text-xl font-medium text-slate-800 mb-8 leading-relaxed max-w-4xl">
              {currentQuestionData?.text}
            </div>

            {currentQuestionData?.image_url && (
              <div className="mb-8">
                <img src={currentQuestionData.image_url} alt="Question Graphic" className="max-w-full h-auto rounded-xl border border-slate-200 shadow-sm max-h-80" />
              </div>
            )}

            <div className="space-y-4 max-w-4xl">
              {currentQuestionData?.options.map((opt, i) => {
                const isSelected = answers[currentQ] === i;
                const isCorrect = currentQuestionData.correct_option_index === i;
                
                let btnClass = "bg-white border-slate-300 text-slate-700 hover:bg-slate-50";
                let showTick = false;
                let showCross = false;
                
                if (isReviewMode) {
                  if (isCorrect) {
                    if (isSelected) {
                      btnClass = "bg-green-50 border-green-500 text-green-800 font-semibold";
                      showTick = true;
                    } else {
                      btnClass = "bg-white border-green-500 text-green-800 font-semibold";
                    }
                  } else if (isSelected) {
                    btnClass = "bg-red-50 border-red-500 text-red-800 font-semibold";
                    showCross = true;
                  } else {
                    btnClass = "bg-white border-slate-200 text-slate-400 cursor-default opacity-60";
                  }
                } else {
                  if (isSelected) btnClass = "bg-blue-50 border-blue-600 text-blue-800 font-semibold ring-1 ring-blue-600";
                }

                return (
                  <div 
                    key={i} 
                    onClick={() => toggleOption(i)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center ${btnClass} ${isReviewMode ? "cursor-default" : ""}`}
                  >
                    <span className="font-bold text-slate-400 mr-4 text-sm w-6">{(i + 10).toString(36).toUpperCase()}</span>
                    <span className="flex-1">{opt}</span>
                    {showTick && <Check className="text-green-600 ml-2" size={20} />}
                    {showCross && <X className="text-red-600 ml-2" size={20} />}
                  </div>
                );
              })}
            </div>
            
          </div>
          
          {/* Footer Navigation */}
          <div className={`absolute bottom-0 left-0 bg-white border-t border-slate-200 p-4 flex items-center justify-between z-20 ${panelOpen ? "right-0 md:right-80" : "right-0"}`}>
            {!isReviewMode ? (
              <button 
                onClick={toggleReview} 
                className={`font-bold px-5 py-2.5 rounded-lg border text-sm transition-colors ${reviewStatus[currentQ] ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"}`}
              >
                {reviewStatus[currentQ] ? "Unmark Review" : "Mark for Review"}
              </button>
            ) : <div/>}

            <div className="flex gap-3">
              <button onClick={() => setCurrentQ(q => Math.max(0, q - 1))} disabled={currentQ === 0} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2">
                <ArrowLeft size={16} /> Prev
              </button>
              {currentQ === questions.length - 1 ? (
                <button onClick={submitManual} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm">
                  Submit <Check size={16} />
                </button>
              ) : (
                <button onClick={() => setCurrentQ(q => Math.min(questions.length - 1, q + 1))} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-sm">
                  Next <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Side Panel (Question Palette) */}
        <aside className={`absolute top-0 bottom-0 right-0 w-80 bg-slate-50 border-l border-slate-200 flex flex-col z-30 transition-transform duration-300 ${panelOpen ? "translate-x-0" : "translate-x-full md:translate-x-0 md:w-0 md:border-none md:overflow-hidden"}`}>
          
          <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center font-bold text-slate-800">
            Question Palette
            <button onClick={() => setPanelOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>

          {isReviewMode ? (
            <div className="flex p-2 bg-white border-b border-slate-200 overflow-x-auto text-xs font-semibold gap-2">
              <button onClick={() => setFilterType("all")} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterType === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
              <button onClick={() => setFilterType("correct")} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterType === "correct" ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}>Correct</button>
              <button onClick={() => setFilterType("wrong")} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterType === "wrong" ? "bg-red-600 text-white" : "bg-slate-100 text-slate-600"}`}>Wrong</button>
              <button onClick={() => setFilterType("skipped")} className={`px-3 py-1.5 rounded-full whitespace-nowrap ${filterType === "skipped" ? "bg-slate-500 text-white" : "bg-slate-100 text-slate-600"}`}>Skipped</button>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3 text-xs bg-white border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-green-500 border border-green-600"/> Answered ({answers.filter(a => a !== null).length})</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md border-2 border-slate-300 bg-white"/> Not Answered ({answers.filter(a => a === null).length})</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-amber-500 border border-amber-600"/> Mark for Review ({reviewStatus.filter(Boolean).length})</div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {(() => {
              const sec = activeSection;
              const firstIdx = questions.findIndex(q => (q.section || "Default") === sec);
              const secQuestions = questions.map((q, idx) => ({ q, idx })).filter(item => (item.q.section || "Default") === sec);
              
              let visibleInSec = 0;
              const renderedButtons = secQuestions.map(({q, idx}) => {
                const isAns = answers[idx] !== null;
                const isRev = reviewStatus[idx];
                const isAct = currentQ === idx;
                
                let statusClass = "bg-white border-slate-300 text-slate-600 hover:bg-slate-100";
                let display = true;

                if (isReviewMode) {
                  const isCorrect = q.correct_option_index === answers[idx];
                  if (!isAns) {
                    statusClass = "bg-slate-300 border-slate-300 text-white";
                    if (filterType !== "all" && filterType !== "skipped") display = false;
                  } else if (isCorrect) {
                    statusClass = "bg-green-500 border-green-500 text-white";
                    if (filterType !== "all" && filterType !== "correct") display = false;
                  } else {
                    statusClass = "bg-red-500 border-red-500 text-white";
                    if (filterType !== "all" && filterType !== "wrong") display = false;
                  }
                } else {
                  if (isRev) statusClass = "bg-amber-500 border-amber-500 text-white";
                  else if (isAns) statusClass = "bg-green-500 border-green-500 text-white";
                }

                if (isAct) {
                  statusClass += " ring-2 ring-offset-1 ring-blue-500 font-bold scale-105";
                }

                if (!display) return null;
                visibleInSec++;

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQ(idx)}
                    className={`w-10 h-10 rounded-lg border text-sm transition-all flex items-center justify-center ${statusClass}`}
                  >
                    {idx - firstIdx + 1}
                  </button>
                );
              });

              if (visibleInSec === 0) return null;

              return (
                <div key={sec} className="mb-6">
                  {sections.length > 1 && <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{sec}</h4>}
                  <div className="grid grid-cols-5 gap-2 content-start">
                    {renderedButtons}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Submit Button at Bottom */}
          {!isReviewMode && (
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <button onClick={submitManual} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-lg text-sm transition-colors shadow-sm uppercase tracking-wide">
                Submit Test
              </button>
            </div>
          )}

        </aside>

      </div>
    </div>
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Flag className="text-red-500" size={20} /> Report Question {currentQ + 1}
              </h2>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">What is wrong with this question?</label>
              <textarea 
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:border-red-500 outline-none min-h-[100px]"
                placeholder="e.g. Option A and C are the same, Question is incomplete..."
              />
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowReportModal(false)} className="px-4 py-2 text-slate-500 font-semibold hover:bg-slate-50 rounded-lg">Cancel</button>
                <button 
                  onClick={handleReportQuestion}
                  disabled={reporting || !reportReason.trim()} 
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                  {reporting ? "Reporting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Warning Overlay */}
      {warningActive && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center select-none pointer-events-auto backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-red-500 flex justify-center mb-4"><AlertTriangle size={48} /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Security Violation</h3>
            <p className="text-slate-600 text-sm mb-4">
              {violations >= MAX_VIOLATIONS ? "Maximum violations reached. Submitting test..." : "You must stay in full screen mode."}
            </p>
            <div className="text-xs font-bold text-slate-400 mb-6 bg-slate-100 py-2 rounded-lg">ATTEMPT {violations} / {MAX_VIOLATIONS}</div>
            {violations < MAX_VIOLATIONS && (
              <button onClick={resumeAfterViolation} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700">Resume Test</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
