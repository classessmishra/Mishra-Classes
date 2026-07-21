"use client";

import { useState, useEffect } from "react";
import { FileJson, AlertCircle, CheckCircle2, Plus, Trash2, Image as ImageIcon, Settings, Layers, Calendar } from "lucide-react";
import { createTest, getTestById, assignTest } from "@/actions/tests";
import { getBatches } from "@/actions/batches";
import { getAllUsers } from "@/actions/users";
import { useRouter, useParams } from "next/navigation";
import { DateTimePicker } from "@/components/DateTimePicker";
import { supabase } from "@/lib/supabase";

type SectionConfig = {
  name: string;
  positive_marks: number;
  negative_marks: number;
  duration_minutes: number;
};

type Question = {
  id: string;
  text: string;
  image_url?: string;
  options: string[];
  correct_option_index: number;
  positive_marks: number;
  negative_marks: number;
  section?: string;
  test_config?: any; // For injecting config into the first question
};

export default function DuplicateTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.testId as string;

  const [status, setStatus] = useState<"idle" | "error" | "success" | "saving" | "loading">("loading");
  const [errorMessage, setErrorMessage] = useState("");

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

  // New Features Config
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(true);
  const [allowSectionSwitching, setAllowSectionSwitching] = useState(true);
  const [sectionsConfig, setSectionsConfig] = useState<SectionConfig[]>([
    { name: "Default", positive_marks: 4, negative_marks: 1, duration_minutes: 60 }
  ]);

  useEffect(() => {
    if (!allowSectionSwitching) {
       const totalDuration = sectionsConfig.reduce((acc, sec) => acc + (sec.duration_minutes || 0), 0);
       setDuration(totalDuration);
    }
  }, [allowSectionSwitching, sectionsConfig]);

  // Questions State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQIndex, setActiveQIndex] = useState<number>(-1);
  const [activeBuilderSection, setActiveBuilderSection] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        const [batchesData, usersData, data] = await Promise.all([
          getBatches(),
          getAllUsers(),
          supabase.from('tests').select('*').eq('id', testId).single().then(res => res.data)
        ]);
        
        setBatches(batchesData || []);
        setStudents((usersData || []).filter((u: any) => u.role === 'student'));
        
        if (data) {
          setTestTitle((data.title || data.test_title || "Untitled") + " (Copy)");
          setDuration(data.duration_minutes || 60);
          setScramble(data.scramble_enabled !== false);
          
          const qs = data.questions || [];
          if (qs.length > 0 && qs[0].test_config) {
              setNegativeMarkingEnabled(qs[0].test_config.negative_marking_enabled ?? true);
              setAllowSectionSwitching(qs[0].test_config.allow_section_switching ?? true);
              const sc = qs[0].test_config.sections_config ?? [{ name: "Default", positive_marks: 4, negative_marks: 1, duration_minutes: 60 }];
              setSectionsConfig(sc);
              setActiveBuilderSection(sc[0]?.name || "Default");
          } else {
              setActiveBuilderSection("Default");
          }
          setQuestions(qs);
          if (qs.length > 0) setActiveQIndex(0);
        } else {
          setErrorMessage("Failed to load original test.");
          setStatus("error");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setStatus("idle");
      }
    }
    loadData();
  }, [testId]);

  const syncMarks = (currentQs: Question[], newNegativeToggle: boolean, newSections: SectionConfig[]) => {
      return currentQs.map(q => {
          const sec = newSections.find(s => s.name === (q.section || "Default")) || newSections[0];
          if (!sec) return q;
          return {
              ...q,
              positive_marks: sec.positive_marks,
              negative_marks: newNegativeToggle ? sec.negative_marks : 0
          };
      });
  };

  const handleToggleNegativeMarking = (val: boolean) => {
      setNegativeMarkingEnabled(val);
      setQuestions(syncMarks(questions, val, sectionsConfig));
  };

  const updateSectionConfig = (idx: number, field: keyof SectionConfig, val: any) => {
      const updatedSections = [...sectionsConfig];
      if (field === 'name') {
          const oldName = updatedSections[idx].name;
          const newName = val as string;
          updatedSections[idx].name = newName;
          
          const updatedQs = questions.map(q => {
              if (q.section === oldName) return { ...q, section: newName };
              return q;
          });
          setSectionsConfig(updatedSections);
          setQuestions(syncMarks(updatedQs, negativeMarkingEnabled, updatedSections));
      } else {
          updatedSections[idx] = { ...updatedSections[idx], [field]: val };
          setSectionsConfig(updatedSections);
          setQuestions(syncMarks(questions, negativeMarkingEnabled, updatedSections));
      }
  };

  const addSection = () => {
      const newSec = { name: `Section ${sectionsConfig.length + 1}`, positive_marks: 4, negative_marks: 1, duration_minutes: 30 };
      setSectionsConfig([...sectionsConfig, newSec]);
  };
  
  const removeSection = (idx: number) => {
      if (sectionsConfig.length <= 1) return;
      const updated = sectionsConfig.filter((_, i) => i !== idx);
      setSectionsConfig(updated);
      setQuestions(syncMarks(questions, negativeMarkingEnabled, updated));
  };

  const updateActiveQuestion = (field: keyof Question, value: any) => {
    if (activeQIndex < 0) return;
    const updated = [...questions];
    
    if (field === "section") {
       const sec = sectionsConfig.find(s => s.name === value);
       if (sec) {
         updated[activeQIndex] = { 
           ...updated[activeQIndex], 
           section: sec.name,
           positive_marks: sec.positive_marks,
           negative_marks: negativeMarkingEnabled ? sec.negative_marks : 0
         };
         setQuestions(updated);
         return;
       }
    }

    updated[activeQIndex] = { ...updated[activeQIndex], [field]: value };
    setQuestions(updated);
  };

  const addOption = () => {
    if (activeQIndex < 0) return;
    const updated = [...questions];
    updated[activeQIndex].options.push("");
    setQuestions(updated);
  };

  const removeOption = (optIndex: number) => {
    if (activeQIndex < 0) return;
    const updated = [...questions];
    if (updated[activeQIndex].options.length <= 2) return;
    updated[activeQIndex].options.splice(optIndex, 1);
    if (updated[activeQIndex].correct_option_index >= updated[activeQIndex].options.length) {
       updated[activeQIndex].correct_option_index = 0;
    }
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
      
      const payloadQuestions = [...questions];
      
      if (!testTitle) throw new Error("Test title is required.");
      if (payloadQuestions.length === 0) throw new Error("Add at least one question.");
      if (!selectedTargetId) throw new Error("Please select a batch or student to assign this to.");
      
      payloadQuestions[0] = {
          ...payloadQuestions[0],
          test_config: {
              negative_marking_enabled: negativeMarkingEnabled,
              allow_section_switching: allowSectionSwitching,
              sections_config: sectionsConfig
          }
      };

      const payload = {
        test_title: testTitle,
        duration_minutes: duration,
        scramble_enabled: scramble,
        allow_section_switching: allowSectionSwitching,
        questions: payloadQuestions
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

  if (status === "loading") {
    return <div className="p-10 flex justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Duplicate & Assign Test</h1>
          <p className="text-slate-500 text-sm mt-1">Review the old test details, make changes, and assign it to a new batch.</p>
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
        
        {/* Left Sidebar: Test Settings & Question List */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* General Settings */}
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
                  <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} disabled={!allowSectionSwitching} className="w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:bg-slate-100" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold text-slate-600">Auto Scramble</label>
                <input type="checkbox" checked={scramble} onChange={e => setScramble(e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold text-slate-600">Enable -ve Marking</label>
                <input type="checkbox" checked={negativeMarkingEnabled} onChange={e => handleToggleNegativeMarking(e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="text-xs font-semibold text-slate-600">Allow Section Switch</label>
                <input type="checkbox" checked={allowSectionSwitching} onChange={e => setAllowSectionSwitching(e.target.checked)} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
              </div>
            </div>
          </div>

          {/* Sections Manager */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Layers size={16} /> Sections Config
              </h3>
              <button onClick={addSection} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Add</button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {sectionsConfig.map((sec, idx) => (
                  <div key={idx} className="border border-slate-100 bg-slate-50 p-3 rounded-lg space-y-2 relative">
                      {sectionsConfig.length > 1 && (
                          <button onClick={() => removeSection(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                              <Trash2 size={14} />
                          </button>
                      )}
                      <div>
                         <label className="block text-[10px] font-bold text-slate-500 uppercase">Section Name</label>
                         <input type="text" value={sec.name} onChange={e => updateSectionConfig(idx, 'name', e.target.value)} className="w-full p-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none" />
                      </div>
                      <div className="flex gap-2">
                          <div className="flex-1">
                             <label className="block text-[10px] font-bold text-green-600 uppercase">+ve</label>
                             <input type="number" value={sec.positive_marks} onChange={e => updateSectionConfig(idx, 'positive_marks', Number(e.target.value))} className="w-full p-1 text-xs border border-slate-200 rounded outline-none" />
                          </div>
                          <div className="flex-1">
                             <label className="block text-[10px] font-bold text-red-500 uppercase">-ve</label>
                             <input type="number" value={sec.negative_marks} onChange={e => updateSectionConfig(idx, 'negative_marks', Number(e.target.value))} disabled={!negativeMarkingEnabled} className="w-full p-1 text-xs border border-slate-200 rounded outline-none disabled:opacity-50 disabled:bg-slate-100" />
                          </div>
                          {!allowSectionSwitching && (
                            <div className="flex-1">
                               <label className="block text-[10px] font-bold text-blue-600 uppercase">Mins</label>
                               <input type="number" value={sec.duration_minutes || 0} onChange={e => updateSectionConfig(idx, 'duration_minutes', Number(e.target.value))} className="w-full p-1 text-xs border border-slate-200 rounded outline-none focus:border-blue-500" />
                            </div>
                            )}
                      </div>
                  </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
            {sectionsConfig.length > 1 && (
              <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 no-scrollbar">
                 {sectionsConfig.map(sec => (
                    <button 
                       key={sec.name} 
                       onClick={() => setActiveBuilderSection(sec.name)}
                       className={`px-4 py-3 text-xs font-bold whitespace-nowrap transition-colors ${activeBuilderSection === sec.name ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                       {sec.name} ({questions.filter(q => (q.section || sectionsConfig[0].name) === sec.name).length})
                    </button>
                 ))}
              </div>
            )}
            <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white">
              <h3 className="font-bold text-sm text-slate-800">
                 Questions {activeBuilderSection && `(${questions.filter(q => (q.section || sectionsConfig[0].name) === activeBuilderSection).length})`}
              </h3>
              <button onClick={() => {
                 const defaultSection = sectionsConfig.find(s => s.name === activeBuilderSection) || sectionsConfig[0];
                 const newQ = {
                   id: Math.random().toString(36).substr(2, 9),
                   text: "",
                   options: ["", "", "", ""],
                   correct_option_index: 0,
                   positive_marks: defaultSection.positive_marks,
                   negative_marks: negativeMarkingEnabled ? defaultSection.negative_marks : 0,
                   section: defaultSection.name
                 };
                 setQuestions([...questions, newQ]);
                 setActiveQIndex(questions.length);
              }} className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 text-xs font-bold">
                <Plus size={14} /> Add
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 p-4 bg-slate-50/50 pr-2">
              {questions.filter(q => (q.section || sectionsConfig[0].name) === (activeBuilderSection || sectionsConfig[0].name)).length === 0 ? (
                <p className="text-xs text-slate-400 text-center mt-10">No questions in this section.</p>
              ) : (
                questions.map((q, idx) => {
                  const s = q.section || sectionsConfig[0].name;
                  if (s !== (activeBuilderSection || sectionsConfig[0].name)) return null;
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

        {/* Middle Area: Question Editor */}
        <div className="lg:col-span-6">
          {activeQIndex >= 0 && questions[activeQIndex] ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold text-slate-800">Question {activeQIndex + 1}</h2>
                   <div className="flex gap-4 text-sm font-bold">
                       <span className="text-green-600 bg-green-50 px-3 py-1 rounded">+{questions[activeQIndex].positive_marks}</span>
                       <span className="text-red-500 bg-red-50 px-3 py-1 rounded">-{questions[activeQIndex].negative_marks}</span>
                   </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                <textarea 
                  value={questions[activeQIndex].text}
                  onChange={e => updateActiveQuestion('text', e.target.value)}
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 min-h-[120px] resize-y text-slate-800"
                  placeholder="Write your question here..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Or Upload Image for Question</label>
                {questions[activeQIndex].image_url ? (
                  <div className="relative inline-block border-2 border-slate-200 rounded-xl p-2 group">
                    <img src={questions[activeQIndex].image_url} alt="Question" className="max-h-48 rounded-lg" />
                    <button 
                      onClick={() => updateActiveQuestion('image_url', undefined)}
                      className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 transition-colors text-slate-600 font-semibold w-fit text-sm">
                    <ImageIcon size={18} /> Choose Image
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-semibold text-slate-700">Options (Select the correct one)</label>
                    <button onClick={addOption} className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg">+ Add Option</button>
                </div>
                <div className="space-y-3">
                  {questions[activeQIndex].options.map((opt, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${questions[activeQIndex].correct_option_index === i ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white focus-within:border-blue-500'}`}>
                      <input 
                        type="radio" 
                        name="correctOption" 
                        checked={questions[activeQIndex].correct_option_index === i}
                        onChange={() => updateActiveQuestion('correct_option_index', i)}
                        className="w-5 h-5 ml-2 accent-green-600 cursor-pointer"
                      />
                      <input 
                        type="text" 
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="flex-1 p-2 bg-transparent focus:outline-none text-slate-800 text-sm"
                        placeholder={`Option ${i + 1}`}
                      />
                      <button onClick={() => removeOption(i)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                          <Trash2 size={16}/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400">
              <Plus size={48} className="mb-4 text-slate-300" />
              <p className="font-medium">Select or Add a question to start editing</p>
            </div>
          )}
        </div>

        {/* Right Column: Assignment Rules */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
              <Calendar size={16} /> Assignment Rules
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">Assign To</label>
                <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                  <button onClick={() => {setAssignType("batch"); setSelectedTargetId("");}} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${assignType === 'batch' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Batch</button>
                  <button onClick={() => {setAssignType("student"); setSelectedTargetId("");}} className={`flex-1 text-xs font-bold py-2 rounded-md transition-all ${assignType === 'student' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Student</button>
                </div>

                <select 
                  value={selectedTargetId}
                  onChange={e => setSelectedTargetId(e.target.value)}
                  className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose {assignType === 'batch' ? 'Batch' : 'Student'} --</option>
                  {assignType === "batch" 
                    ? batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)
                    : students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)
                  }
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time (Optional)</label>
                <DateTimePicker 
                  value={startTime}
                  onChange={(dateStr) => setStartTime(dateStr)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">End Time (Optional)</label>
                <DateTimePicker 
                  value={endTime}
                  onChange={(dateStr) => setEndTime(dateStr)}
                />
              </div>
              
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-[10px] leading-relaxed mt-4">
                When you click "Save & Assign", this will be saved as a brand new independent test and then assigned to the selected target.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
