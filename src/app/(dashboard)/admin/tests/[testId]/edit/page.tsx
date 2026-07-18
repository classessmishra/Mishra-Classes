"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle2, Plus, Trash2, Image as ImageIcon, Settings } from "lucide-react";
import { createTest, updateTestQuestions } from "@/actions/tests";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function TestEditorPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "json">("builder");
  const [status, setStatus] = useState<"idle" | "error" | "success" | "saving" | "loading">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  // Test Settings State
  const [testTitle, setTestTitle] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [batchId, setBatchId] = useState("");
  const [scramble, setScramble] = useState(true);
  const [globalPositive, setGlobalPositive] = useState<number>(4);
  const [globalNegative, setGlobalNegative] = useState<number>(1);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQIndex, setActiveQIndex] = useState<number>(-1);

  // JSON State
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    async function loadTest() {
      if (!testId) return;
      const { data, error } = await supabase.from('tests').select('*').eq('id', testId).single();
      if (data) {
        setTestTitle(data.title || data.test_title);
        setDuration(data.duration_minutes || 60);
        setScramble(data.scramble_enabled || false);
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) setActiveQIndex(0);
      }
      setStatus("idle");
    }
    loadTest();
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

  const handleSave = async () => {
    try {
      setStatus("saving");
      
      let payloadQuestions = questions;
      
      if (activeTab === "builder") {
        if (!testTitle) throw new Error("Test title is required.");
        if (questions.length === 0) throw new Error("Add at least one question.");
      } else {
        const payload = JSON.parse(jsonInput);
        if (!payload.test_title || !payload.questions || !Array.isArray(payload.questions)) {
          throw new Error("Invalid JSON structure. Missing test_title or questions array.");
        }
        if (payload.test_title) setTestTitle(payload.test_title);
        payloadQuestions = payload.questions;
      }

      // First update the test details
      const { error } = await supabase.from('tests').update({
        title: testTitle,
        duration_minutes: duration,
        scramble_enabled: scramble
      }).eq('id', testId);
      
      if (error) throw new Error(error.message);
      
      // Then update questions
      await updateTestQuestions(testId, payloadQuestions);
      
      setStatus("success");
      setTimeout(() => {
        router.push("/admin/tests");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save test.");
      setStatus("error");
    }
  };

  if (status === "loading") {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Test</h1>
          <p className="text-slate-500 text-sm">Update questions and settings for this test.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all"
        >
          {status === "saving" ? "Saving..." : "Publish Test"}
        </button>
      </div>

      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "builder" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          Test Builder (Primary)
        </button>
        <button
          onClick={() => setActiveTab("json")}
          className={`px-6 py-3 font-semibold text-sm transition-colors ${activeTab === "json" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground hover:text-foreground"}`}
        >
          JSON Import (Backup)
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
            <p className="font-bold">Test Created Successfully!</p>
            <p className="text-sm">Students can now access this test. Redirecting...</p>
          </div>
        </div>
      )}

      {activeTab === "builder" ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar: Test Settings & Question List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
                <Settings size={16} /> Test Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Test Title</label>
                  <input type="text" value={testTitle} onChange={e => setTestTitle(e.target.value)} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" placeholder="e.g. Mock Test 1" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Duration (Mins)</label>
                  <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <label className="text-xs font-semibold text-slate-600">Auto Scramble</label>
                  <input type="checkbox" checked={scramble} onChange={e => setScramble(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-slate-800">Questions ({questions.length})</h3>
                <button onClick={handleAddQuestion} className="bg-blue-100 text-blue-700 p-1.5 rounded-lg hover:bg-blue-200 transition-colors">
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {questions.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-10">No questions added.</p>
                ) : (
                  questions.map((q, idx) => {
                    const s = q.section || "Default";
                    return (
                      <div
                        key={q.id}
                        onClick={() => setActiveQIndex(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveQIndex(idx); } }}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all cursor-pointer ${activeQIndex === idx ? 'bg-blue-50 border-blue-600 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${activeQIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-slate-800 truncate">{q.text || "Empty Question"}</p>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{s}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }} 
                          className="text-slate-400 hover:text-red-500 p-1 shrink-0 z-10"
                          aria-label="Delete question"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Main Area: Question Editor */}
          <div className="lg:col-span-3">
            {activeQIndex >= 0 && questions[activeQIndex] ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-lg font-bold text-slate-800 mb-6">Question {activeQIndex + 1}</h2>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">+ve Marks</label>
                      <input 
                        type="number" 
                        value={questions[activeQIndex].positive_marks} 
                        onChange={(e) => updateActiveQuestion('positive_marks', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">-ve Marks</label>
                      <input 
                        type="number" 
                        value={questions[activeQIndex].negative_marks} 
                        onChange={(e) => updateActiveQuestion('negative_marks', Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">Section</label>
                      <input 
                        type="text" 
                        value={questions[activeQIndex].section || ""} 
                        onChange={(e) => updateActiveQuestion('section', e.target.value)}
                        placeholder="e.g. Physics"
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                  <textarea 
                    value={questions[activeQIndex].text}
                    onChange={e => updateActiveQuestion("text", e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl min-h-[120px] focus:outline-none focus:border-blue-500 text-sm"
                    placeholder="Write your question here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Or Upload Image for Question</label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                      <ImageIcon size={16} /> Choose Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                    {questions[activeQIndex].image_url && (
                      <div className="relative group inline-block">
                        <img src={questions[activeQIndex].image_url} alt="Q-Img" className="h-16 rounded border" />
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
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${questions[activeQIndex].correct_option_index === i ? "border-green-500 bg-green-50" : "border-slate-200"}`}>
                        <input 
                          type="radio" 
                          name="correct_option" 
                          checked={questions[activeQIndex].correct_option_index === i}
                          onChange={() => updateActiveQuestion("correct_option_index", i)}
                          className="w-5 h-5 text-green-600 focus:ring-green-500 cursor-pointer" 
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
                <p className="mb-4">Select a question or add a new one.</p>
                <button onClick={handleAddQuestion} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-semibold hover:bg-slate-100 flex items-center gap-2 shadow-sm">
                  <Plus size={16} /> Add First Question
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileJson size={20} className="text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Paste JSON Configuration</h2>
          </div>
          <p className="text-sm text-slate-500 mb-4">You can paste an entire test configuration here as a backup method.</p>
          <textarea
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            className="w-full h-[500px] p-4 font-mono text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            placeholder="Paste your JSON here..."
          />
        </div>
      )}
    </div>
  );
}
