"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, Plus, Trash2, Image as ImageIcon, Settings, Calendar, Layers } from "lucide-react";
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
    { name: "Default", positive_marks: 4, negative_marks: 1 }
  ]);

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
              const sc = qs[0].test_config.sections_config ?? [{ name: "Default", positive_marks: 4, negative_marks: 1 }];
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

  // Helper to re-sync all question marks if section configs or negative marking toggle change
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
      const updated = [...sectionsConfig];
      updated[idx] = { ...updated[idx], [field]: val };
      setSectionsConfig(updated);
      setQuestions(syncMarks(questions, negativeMarkingEnabled, updated));
  };

  const addSectionConfig = () => {
      const newName = "Section " + String.fromCharCode(65 + sectionsConfig.length);
      const newSec = { name: newName, positive_marks: 4, negative_marks: 1 };
      const updated = [...sectionsConfig, newSec];
      setSectionsConfig(updated);
      if (!activeBuilderSection) setActiveBuilderSection(newName);
  };

  const removeSectionConfig = (idx: number) => {
      if (sectionsConfig.length <= 1) {
          alert("Test must have at least one section.");
          return;
      }
      const removedName = sectionsConfig[idx].name;
      const updated = sectionsConfig.filter((_, i) => i !== idx);
      setSectionsConfig(updated);
      
      // Remove or reassign questions belonging to this section
      const remainingQs = questions.filter(q => (q.section || "Default") !== removedName);
      setQuestions(syncMarks(remainingQs, negativeMarkingEnabled, updated));

      if (activeBuilderSection === removedName) {
          setActiveBuilderSection(updated[0].name);
      }
  };

  const handleAddQuestion = () => {
      const currentSec = sectionsConfig.find(s => s.name === activeBuilderSection) || sectionsConfig[0];
      const newQ: Question = {
          id: Math.random().toString(36).substr(2, 9),
          text: "",
          options: ["", "", "", ""],
          correct_option_index: 0,
          positive_marks: currentSec.positive_marks,
          negative_marks: negativeMarkingEnabled ? currentSec.negative_marks : 0,
          section: currentSec.name
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
      
      const payloadQs = questions.map((q, idx) => {
          if (idx === 0) {
              return {
                  ...q,
                  test_config: {
                      negative_marking_enabled: negativeMarkingEnabled,
                      allow_section_switching: allowSectionSwitching,
                      sections_config: sectionsConfig
                  }
              };
          }
          const { test_config, ...rest } = q;
          return rest;
      });

      const payload = {
        test_title: testTitle,
        duration_minutes: duration,
        scramble_enabled: scramble,
        questions: payloadQs
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
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const activeSectionQs = questions.map((q, idx) => ({ q, idx })).filter(item => (item.q.section || "Default") === activeBuilderSection);

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
        
        {/* Left Column: Settings and Questions (3 cols) */}
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-4">
                  <Layers size={16} /> Advanced Config
              </h3>
              <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <input type="checkbox" id="negMarking" checked={negativeMarkingEnabled} onChange={e => handleToggleNegativeMarking(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                      <div>
                          <label htmlFor="negMarking" className="text-xs font-bold text-slate-700 cursor-pointer">Enable Negative Marking</label>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">If unchecked, all negative marks will be forced to 0 during the test.</p>
                      </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <input type="checkbox" id="secSwitching" checked={allowSectionSwitching} onChange={e => setAllowSectionSwitching(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded" />
                      <div>
                          <label htmlFor="secSwitching" className="text-xs font-bold text-slate-700 cursor-pointer">Allow Section Switching</label>
                          <p className="text-[10px] text-slate-500 leading-tight mt-0.5">If unchecked, students must submit a section before moving to the next (Nimcet pattern).</p>
                      </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-3">
                          <label className="text-xs font-bold text-slate-700">Sections Config</label>
                          <button onClick={addSectionConfig} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold hover:bg-blue-100">+ Add</button>
                      </div>
                      <div className="space-y-3">
                          {sectionsConfig.map((sec, idx) => (
                              <div key={idx} className="p-3 border border-slate-200 rounded-lg bg-white shadow-sm relative group">
                                  {sectionsConfig.length > 1 && (
                                      <button onClick={() => removeSectionConfig(idx)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12}/></button>
                                  )}
                                  <input type="text" value={sec.name} onChange={e => updateSectionConfig(idx, 'name', e.target.value)} className="w-full text-xs font-bold p-1.5 border-b border-slate-200 focus:border-blue-500 outline-none mb-2" placeholder="Section Name" />
                                  <div className="flex gap-2">
                                      <div className="flex-1">
                                          <label className="text-[9px] text-slate-500 font-semibold block mb-0.5">+ve Marks</label>
                                          <input type="number" value={sec.positive_marks} onChange={e => updateSectionConfig(idx, 'positive_marks', Number(e.target.value))} className="w-full p-1 text-xs border border-slate-200 rounded" />
                                      </div>
                                      <div className="flex-1">
                                          <label className="text-[9px] text-slate-500 font-semibold block mb-0.5">-ve Marks</label>
                                          <input type="number" value={sec.negative_marks} onChange={e => updateSectionConfig(idx, 'negative_marks', Number(e.target.value))} disabled={!negativeMarkingEnabled} className="w-full p-1 text-xs border border-slate-200 rounded disabled:bg-slate-100 disabled:text-slate-400" />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
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
                <div className="text-center py-8 text-slate-400 text-sm">No questions added yet.</div>
              ) : (
                questions.map((q, idx) => (
                  <div 
                    key={q.id} 
                    onClick={() => setActiveQIndex(idx)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all flex justify-between items-start ${activeQIndex === idx ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200 bg-white'}`}
                  >
                    <div className="flex gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${activeQIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-700 line-clamp-2 leading-snug break-all">
                          {q.text || "Empty Question..."}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1 block font-semibold">{q.section || "Default"}</span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeQuestion(idx); }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Middle Column: Question Editor (6 cols) */}
        <div className="lg:col-span-6">
          {activeQIndex >= 0 && questions[activeQIndex] ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8">
              
              <div className="flex gap-2 mb-6 border-b border-slate-100 overflow-x-auto no-scrollbar pb-2">
                  {sectionsConfig.map(sec => (
                      <button 
                          key={sec.name} 
                          onClick={() => setActiveBuilderSection(sec.name)}
                          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors whitespace-nowrap ${activeBuilderSection === sec.name ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'}`}
                      >
                          {sec.name} <span className="ml-1 text-[10px] bg-white px-1.5 py-0.5 rounded-full border border-slate-200">{questions.filter(q => (q.section || "Default") === sec.name).length}</span>
                      </button>
                  ))}
              </div>

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800">Question {activeQIndex + 1}</h2>
                <div className="flex gap-3 text-sm">
                    <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-semibold border border-green-100">+{questions[activeQIndex].positive_marks}</span>
                    <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full font-semibold border border-red-100">-{questions[activeQIndex].negative_marks}</span>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-semibold">{questions[activeQIndex].section || "Default"}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Question Text</label>
                  <textarea 
                    value={questions[activeQIndex].text}
                    onChange={e => updateActiveQuestion('text', e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 min-h-[120px] resize-y text-slate-800"
                    placeholder="Enter question content here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Image (Optional)</label>
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
                      <ImageIcon size={18} /> Add Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Options (Select the correct one)</label>
                  <div className="space-y-3">
                    {questions[activeQIndex].options.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all ${questions[activeQIndex].correct_option_index === i ? 'border-green-500 bg-green-50' : 'border-slate-200 bg-white focus-within:border-blue-500'}`}>
                        <input 
                          type="radio" 
                          name="correctOption" 
                          checked={questions[activeQIndex].correct_option_index === i}
                          onChange={() => updateActiveQuestion('correct_option_index', i)}
                          className="w-5 h-5 ml-3 accent-green-600"
                        />
                        <span className="font-bold text-slate-400 text-sm">{(i+10).toString(36).toUpperCase()}</span>
                        <input 
                          type="text" 
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          className="flex-1 p-2 bg-transparent focus:outline-none text-slate-800"
                          placeholder={`Option ${i + 1}`}
                        />
                      </div>
                    ))}
                  </div>
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

        {/* Right Column: Assignment Rules (3 cols) */}
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
              
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-[10px] leading-relaxed">
                When you click "Save & Assign", this will be saved as a brand new independent test and then assigned to the selected target.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
