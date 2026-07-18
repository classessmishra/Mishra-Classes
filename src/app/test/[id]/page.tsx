"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

export default function TestTakingInterface({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [warningCount, setWarningCount] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock Questions
  const questions = [
    {
      id: 1,
      text: "Identify the figure of speech in: 'The wind whispered through the trees.'",
      options: ["Simile", "Metaphor", "Personification", "Hyperbole"]
    },
    {
      id: 2,
      text: "Which of the following sentences is grammatically correct?",
      options: [
        "She don't like apples.",
        "He hasn't went there.",
        "They have been working since morning.",
        "I seen him yesterday."
      ]
    },
    {
      id: 3,
      text: "What is the synonym for 'Ephemeral'?",
      options: ["Permanent", "Short-lived", "Beautiful", "Dangerous"]
    }
  ];

  // Anti-cheat: Tab switching detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitted) {
        setWarningCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            handleSubmit();
          } else {
            alert(`Warning ${newCount}/3: Please do not switch tabs during the test. Your test will be auto-submitted after 3 warnings.`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isSubmitted]);

  // Timer
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) {
      if (timeLeft <= 0 && !isSubmitted) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers({ ...answers, [currentQuestionIndex]: optionIndex });
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    // Submit logic here
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card p-8 rounded-3xl border border-border max-w-md w-full text-center shadow-xl">
          <CheckCircle2 size={64} className="text-green-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold mb-2">Test Submitted!</h2>
          <p className="text-muted-foreground mb-8">Your answers have been saved successfully.</p>
          <button 
            onClick={() => router.push("/student")}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="font-bold text-lg">Class 10 English Mock Test</div>
        <div className="flex items-center gap-6">
          {warningCount > 0 && (
            <div className="flex items-center gap-2 text-orange-500 font-semibold text-sm bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
              <AlertTriangle size={16} /> Warnings: {warningCount}/3
            </div>
          )}
          <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-foreground'}`}>
            <Clock size={20} /> {formatTime(timeLeft)}
          </div>
          <button 
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-bold transition-colors"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Question {currentQuestionIndex + 1}</h2>
              <span className="text-muted-foreground font-medium text-sm">+4 / -1</span>
            </div>
            
            <p className="text-xl leading-relaxed mb-8">{currentQ.text}</p>
            
            <div className="space-y-4">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    answers[currentQuestionIndex] === idx
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-border/80 bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    answers[currentQuestionIndex] === idx ? "border-primary" : "border-muted-foreground/30"
                  }`}>
                    {answers[currentQuestionIndex] === idx && <div className="w-3 h-3 bg-primary rounded-full" />}
                  </div>
                  <span className="font-medium text-lg">{option}</span>
                </button>
              ))}
            </div>

            <div className="mt-12 flex items-center justify-between pt-8 border-t border-border">
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-medium disabled:opacity-50 hover:bg-muted"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              <button 
                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === questions.length - 1}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-muted text-foreground font-medium disabled:opacity-50 hover:bg-muted/80 border border-border"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </main>

        {/* Right: Question Palette Sidebar */}
        <aside className="w-80 border-l border-border bg-card flex flex-col hidden lg:flex shrink-0">
          <div className="p-4 border-b border-border bg-muted/20">
            <h3 className="font-bold text-foreground">Question Palette</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-4 gap-3">
              {questions.map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isCurrent = currentQuestionIndex === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center font-bold text-lg border-2 transition-all ${
                      isCurrent ? "border-primary bg-primary/10 text-primary" :
                      isAnswered ? "bg-primary text-white border-primary" :
                      "bg-white border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-t border-border bg-muted/20 space-y-3">
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-6 h-6 rounded bg-primary border-2 border-primary" /> Answered
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-6 h-6 rounded bg-white border-2 border-border" /> Unanswered
            </div>
            <div className="flex items-center gap-3 text-sm font-medium">
              <div className="w-6 h-6 rounded bg-primary/10 border-2 border-primary text-primary flex items-center justify-center text-xs font-bold">#</div> Current
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
