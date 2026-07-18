"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2, Image as ImageIcon, Settings, Calendar } from "lucide-react";
import { createTest, getTestById, assignTest } from "@/actions/tests";
import { getBatches } from "@/actions/batches";
import { getAllUsers } from "@/actions/users";
import { useRouter, useParams } from "next/navigation";
import { DateTimePicker } from "@/components/DateTimePicker";

type Question = {
  id: string;
  text: string;
  image_url?: string;
  options: string[];
  correct_option_index: number;
  positive_marks: number;
  negative_marks: number;
  section?: string;
};

export default function DuplicateTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [status, setStatus] = useState<"idle" | "error" | "success" | "saving">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Assignment & Settings State
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [testTitle, setTestTitle] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [scramble, setScramble] = useState(true);
  
  // Assignment form state
  const [assignType, setAssignType] = useState<"batch" | "student">("batch");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQIndex, setActiveQIndex] = useState<number>(-1);
  const [globalPositive, setGlobalPositive] = useState<number>(4);
  const [globalNegative, setGlobalNegative] = useState<number>(1);

  useEffect(() => {
    async function loadData() {
      try {
        const [batchesData, usersData, oldTest] = await Promise.all([
          getBatches(),
          getAllUsers(),
          getTestById(testId)
        ]);
        
        setBatches(batchesData || []);
        setStudents((usersData || []).filter((u: any) => u.role === 'student'));
        
        if (oldTest) {
          setTestTitle((oldTest.title || oldTest.test_title || "Untitled") + " (Copy)");
          setDuration(oldTest.duration_minutes || 60);
          setScramble(oldTest.scramble_enabled !== false);
          
          if (oldTest.questions && Array.isArray(oldTest.questions)) {
            setQuestions(oldTest.questions);
            if (oldTest.questions.length > 0) setActiveQIndex(0);
          }
        } else {
          setErrorMessage("Failed to load original test.");
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [testId]);

  const handleAddQuestion = () => {
    const newQ: Question = {
      id: Math.random().toString(36).substr(2, 9),
      text: "",
      options: ["", "", "", ""],
      correct_option_index: 0,
      positive_marks: globalPositive,
      negative_marks: globalNegative,
      section: "Default"
    };
    setQuestions([...questions, newQ]);
    setActiveQIndex(questions.length);
  };

  const updateActiveQuestion = (field: keyof Question, value: any) => {
    if (activeQIndex < 0) return;
    const updated = [...questions];
    updated[activeQIndex] = { ...updated[activeQIndex], [field]: value };
    setQuestions(updated);
  };

  const updateOption = (optIndex: number, value: string) => {
    if (activeQIndex < 0) return;
    const updated = [...questions];
    const newOptions = [...updated[activeQIndex].options];
    newOptions[optIndex] = value;
    updated[activeQIndex] = { ...updated[activeQIndex], options: newOptions };
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (activeQIndex === idx) {
      setActiveQIndex(updated.length > 0 ? 0 : -1);
    } else if (activeQIndex > idx) {
      setActiveQIndex(activeQIndex - 1);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateActiveQuestion("image_url", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAndAssign = async () => {
    try {
      setStatus("saving");
      
      if (!testTitle) throw new Error("Test title is required.");
      if (questions.length === 0) throw new Error("Add at least one question.");
      if (!selectedTargetId) throw new Error("Please select a batch or student to assign this to.");
      
      const payload = {
        test_title: testTitle,
        duration_minutes: duration,
        scramble_enabled: scramble,
        questions: questions
      };

      // 1. Create Brand New Test
      const newTest = await createTest(payload);
      if (!newTest || !newTest.id) throw new Error("Failed to create new test record.");
      
      // 2. Assign the newly created test
      const assignPayload: any = {};
      if (assignType === "batch") assignPayload.batch_id = selectedTargetId;
      else assignPayload.student_id = selectedTargetId;
      
      if (startTime) assignPayload.start_time = new Date(startTime).toISOString();
      if (endTime) assignPayload.end_time = new Date(endTime).toISOString();

      await assignTest(newTest.id, assignPayload);
      
      setStatus("success");
      setErrorMessage("");
      setTimeout(() => {
        setStatus("idle");
        router.push("/admin/test-bank");
      }, 2000);
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message || "Invalid Data");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Duplicate & Assign Test</h1>
          <p className="text-muted-foreground text-sm mt-1">Review the old test details, make changes, and assign it to a new batch.</p>
        </div>
        <button
          onClick={handleSaveAndAssign}
          disabled={status === "saving"}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {status === "saving" ? "Creating & Assigning..." : "Save & Assign New Test"}
        </button>
      </div>

      {status === "error" && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700">
          <AlertCircle size={20} className="mt-0.5" />
          <div>
            <p className="font-bold">Error</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 text-green-700">
          <CheckCircle2 size={20} className="mt-0.5" />
          <div>
            <p className="font-bold">Test Created & Assigned Successfully!</p>
            <p className="text-sm">Redirecting to Test Bank...</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Settings and Questions (4 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
              <Settings size={16} /> Basic Settings
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">New Test Title</label>
                <input type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g. Mock Test 1 - Revision" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (Mins)</label>
                <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="text-xs font-semibold text-slate-600">Auto Scramble</label>
                <input type="checkbox" checked={scramble} onChange={e => setScramble(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-[400px]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-sm text-slate-800">Questions ({questions.length})</h3>
              <button onClick={handleAddQuestion} className="bg-blue-100 text-blue-700 p-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {questions.length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-10">No questions added.</p>
              ) : (
                questions.map((q, idx) => {
                  const s = q.section || "Default";
                  return (
                    <div
                      key={q.id || idx}
                      onClick={() => setActiveQIndex(idx)}
                      className={`w-full cursor-pointer text-left p-3 rounded-xl border flex items-center gap-3 transition-all ${activeQIndex === idx ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${activeQIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-semibold text-slate-800 truncate">{q.text || "Empty Question"}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} className="text-slate-400 hover:text-red-500 p-1 shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center Main Area: Question Editor (6 cols) */}
        <div className="lg:col-span-6">
          {activeQIndex >= 0 && questions[activeQIndex] ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6 h-full">
              
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Question {activeQIndex + 1}</h2>
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">+ve Marks</label>
                    <input 
                      type="number" 
                      value={questions[activeQIndex].positive_marks} 
                      onChange={(e) => updateActiveQuestion('positive_marks', Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">-ve Marks</label>
                    <input 
                      type="number" 
                      value={questions[activeQIndex].negative_marks} 
                      onChange={(e) => updateActiveQuestion('negative_marks', Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Section</label>
                    <input 
                      type="text" 
                      value={questions[activeQIndex].section || ""} 
                      onChange={(e) => updateActiveQuestion('section', e.target.value)}
                      placeholder="e.g. Physics"
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                <textarea 
                  value={questions[activeQIndex].text}
                  onChange={e => updateActiveQuestion("text", e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl min-h-[100px] focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Write your question here..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Image (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                    <ImageIcon size={16} /> Replace Image
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  {questions[activeQIndex].image_url && (
                    <div className="relative group inline-block">
                      <img src={questions[activeQIndex].image_url} alt="Q-Img" className="h-12 rounded border" />
                      <button onClick={() => updateActiveQuestion("image_url", "")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Options (Select the correct one)</label>
                <div className="space-y-3">
                  {questions[activeQIndex].options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${questions[activeQIndex].correct_option_index === i ? "border-green-500 bg-green-50" : "border-slate-200"}`}>
                      <input 
                        type="radio" 
                        name="correct_option" 
                        checked={questions[activeQIndex].correct_option_index === i}
                        onChange={() => updateActiveQuestion("correct_option_index", i)}
                        className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer shrink-0" 
                      />
                      <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400">
              <p className="mb-4">Select a question from the left sidebar to edit.</p>
            </div>
          )}
        </div>

        {/* Right Column: Assignment Details (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sticky top-6">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Calendar size={16} /> Assignment Rules
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-2 block">Assign To</label>
                <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                  <button
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${assignType === 'batch' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => { setAssignType('batch'); setSelectedTargetId(""); }}
                  >
                    Batch
                  </button>
                  <button
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${assignType === 'student' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => { setAssignType('student'); setSelectedTargetId(""); }}
                  >
                    Student
                  </button>
                </div>
                
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-sm"
                >
                  <option value="">-- Choose {assignType === 'batch' ? 'Batch' : 'Student'} --</option>
                  {assignType === 'batch' ? (
                    batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  ) : (
                    students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name || s.phone || "Unknown"}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-4">
                <DateTimePicker 
                  label="Start Time (Optional)" 
                  value={startTime} 
                  onChange={setStartTime} 
                />
                <DateTimePicker 
                  label="End Time (Optional)" 
                  value={endTime} 
                  onChange={setEndTime} 
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                 <p className="text-xs text-slate-500 leading-relaxed">
                   When you click "Save & Assign", this will be saved as a brand new independent test in your Test Bank and instantly assigned to the chosen target.
                 </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
