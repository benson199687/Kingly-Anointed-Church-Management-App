import React, { useState, useEffect } from "react";
import { 
  Brain, Trophy, Users, Award, Play, Clock, ArrowRight, 
  HelpCircle, Check, X, Plus, Trash2, Sparkles, Loader2, 
  BookOpen, AlertCircle, Eye, EyeOff, ClipboardList, CheckCircle2,
  FileSpreadsheet, Upload, Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { User, DatabaseState, Quiz, Question } from "../types";
import { avatarBg, initials } from "./Sidebar";

interface QuizViewProps {
  user: User;
  state: DatabaseState;
  onSubmitScore: (quizId: string, score: number) => void;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
  onUpdateState?: (state: any) => void;
}

export function QuizView({ user, state, onSubmitScore, onToast, onRefresh, onUpdateState }: QuizViewProps) {
  const isLeadPastor = user.role === "pastor" && user.pastorType === "main";
  const isPastor = ["pastor", "admin"].includes(user.role);
  const quizzes = state.quizzes || [];

  // Active Hub tabs
  const [activeTab, setActiveTab] = useState<"assessments" | "leaderboard" | "pastor">(
    isPastor ? "pastor" : "assessments"
  );

  // Quiz taking states
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // Pastor console states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"quiz" | "exam">("quiz");
  const [newWeek, setNewWeek] = useState("");
  const [newDuration, setNewDuration] = useState(15);
  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dynamic list of questions being created
  const [newQuestions, setNewQuestions] = useState<Array<{
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }>>([
    { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }
  ]);

  // Handle starting a specific quiz/exam
  const handleStart = (selectedQuiz: Quiz) => {
    setActiveQuiz(selectedQuiz);
    setIsPlaying(true);
    setCurrentQIndex(0);
    setSelectedOpt(null);
    setAnswered(false);
    setScore(0);
    setDone(false);
  };

  const handleSelect = (idx: number) => {
    if (answered) return;
    setSelectedOpt(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOpt === null || !activeQuiz) return;
    const isCorrect = selectedOpt === activeQuiz.questions[currentQIndex].correct;
    if (isCorrect) setScore((prev) => prev + 1);
    setAnswered(true);
  };

  const handleNext = () => {
    if (!activeQuiz) return;
    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOpt(null);
      setAnswered(false);
    } else {
      setDone(true);
      setIsPlaying(false);
      const percentScore = Math.round((score / activeQuiz.questions.length) * 100);
      onSubmitScore(activeQuiz.id, percentScore);
    }
  };

  // AI drawing of questions from sermon
  const handleDrawQuestions = async () => {
    if (!selectedSermonId) {
      onToast("Please select a sermon teaching first.");
      return;
    }
    setIsDrawing(true);
    onToast("Connecting to Gemini AI to read sermon notes & generate study questions...");
    try {
      const res = await fetch("/api/gemini/draw-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sermonId: selectedSermonId, type: newType })
      });
      const data = await res.json();
      if (data.success && data.questions) {
        setNewQuestions(data.questions);
        onToast(`✨ Successfully drawn ${data.questions.length} questions from sermon teachings!`);
      } else {
        onToast(data.message || "Failed to extract questions.");
      }
    } catch (err) {
      onToast("Error connecting to Gemini questions drawer.");
    } finally {
      setIsDrawing(false);
    }
  };

  // Excel / CSV File Import Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        // Read file contents
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        // Convert sheet to 2D array representing rows
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

        if (rawData.length <= 1) {
          onToast("The spreadsheet is empty or only contains headers.");
          return;
        }

        // Standardize headers
        const headers = rawData[0].map((h: any) => String(h || "").trim().toLowerCase());
        
        let qIdx = headers.findIndex((h: string) => h.includes("question") || h === "q");
        let opt1Idx = headers.findIndex((h: string) => h.includes("option 1") || h.includes("option a") || h.includes("opt 1") || h === "opt a" || h.includes("optiona"));
        let opt2Idx = headers.findIndex((h: string) => h.includes("option 2") || h.includes("option b") || h.includes("opt 2") || h === "opt b" || h.includes("optionb"));
        let opt3Idx = headers.findIndex((h: string) => h.includes("option 3") || h.includes("option c") || h.includes("opt 3") || h === "opt c" || h.includes("optionc"));
        let opt4Idx = headers.findIndex((h: string) => h.includes("option 4") || h.includes("option d") || h.includes("opt 4") || h === "opt d" || h.includes("optiond"));
        let correctIdx = headers.findIndex((h: string) => h.includes("correct") || h.includes("answer") || h === "correct index");
        let expIdx = headers.findIndex((h: string) => h.includes("explanation") || h.includes("reason") || h.includes("theological"));

        // Fallbacks based on standard column indexes:
        // Col 0: Question, Col 1: Option 1, Col 2: Option 2, Col 3: Option 3, Col 4: Option 4, Col 5: Correct Index, Col 6: Explanation
        if (qIdx === -1) qIdx = 0;
        if (opt1Idx === -1) opt1Idx = 1;
        if (opt2Idx === -1) opt2Idx = 2;
        if (opt3Idx === -1) opt3Idx = 3;
        if (opt4Idx === -1) opt4Idx = 4;
        if (correctIdx === -1) correctIdx = 5;
        if (expIdx === -1) expIdx = 6;

        const parsedQuestions: any[] = [];

        for (let i = 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          const questionText = row[qIdx] ? String(row[qIdx]).trim() : "";
          if (!questionText) continue; // Skip empty rows

          const opt1 = row[opt1Idx] !== undefined ? String(row[opt1Idx]).trim() : "";
          const opt2 = row[opt2Idx] !== undefined ? String(row[opt2Idx]).trim() : "";
          const opt3 = row[opt3Idx] !== undefined ? String(row[opt3Idx]).trim() : "";
          const opt4 = row[opt4Idx] !== undefined ? String(row[opt4Idx]).trim() : "";
          
          const explanationText = row[expIdx] !== undefined ? String(row[expIdx]).trim() : "Theological/scriptural basis.";

          let correctVal = row[correctIdx] !== undefined ? String(row[correctIdx]).trim() : "1";
          let correctInt = 0;

          // Convert options or 1-4 indices to 0-3 index
          if (/^[1-4]$/.test(correctVal)) {
            correctInt = parseInt(correctVal) - 1;
          } else if (/^[0-3]$/.test(correctVal)) {
            correctInt = parseInt(correctVal);
          } else {
            const letter = correctVal.toUpperCase();
            if (letter === "A") correctInt = 0;
            else if (letter === "B") correctInt = 1;
            else if (letter === "C") correctInt = 2;
            else if (letter === "D") correctInt = 3;
            else {
              // Try to match the actual option text
              if (correctVal.toLowerCase() === opt1.toLowerCase()) correctInt = 0;
              else if (correctVal.toLowerCase() === opt2.toLowerCase()) correctInt = 1;
              else if (correctVal.toLowerCase() === opt3.toLowerCase()) correctInt = 2;
              else if (correctVal.toLowerCase() === opt4.toLowerCase()) correctInt = 3;
              else correctInt = 0; // default fallback
            }
          }

          parsedQuestions.push({
            question: questionText,
            options: [opt1, opt2, opt3, opt4],
            correct: correctInt,
            explanation: explanationText
          });
        }

        if (parsedQuestions.length === 0) {
          onToast("Could not find any valid questions in the uploaded file. Check headers.");
          return;
        }

        // If currently have only 1 blank placeholder, replace it. Otherwise append.
        setNewQuestions((prev) => {
          const isDefaultSingleEmpty = prev.length === 1 && !prev[0].question.trim() && prev[0].options.every(o => !o.trim());
          if (isDefaultSingleEmpty) {
            return parsedQuestions;
          }
          return [...prev, ...parsedQuestions];
        });

        onToast(`✨ Successfully imported ${parsedQuestions.length} theological questions!`);
        // Reset file input value
        e.target.value = "";
      } catch (error) {
        console.error("Spreadsheet parsing error:", error);
        onToast("Failed to parse spreadsheet. Please verify it matches the template.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Download template CSV file
  const handleDownloadTemplate = () => {
    const headers = [
      "Question",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Correct Option Index (1-4)",
      "Explanation"
    ];
    
    const sampleRows = [
      headers,
      [
        "What is the first book of the New Testament?",
        "Genesis",
        "Matthew",
        "Mark",
        "John",
        "2",
        "The Gospel of Matthew is the first book of the New Testament."
      ],
      [
        "Which prophet was swallowed by a great fish?",
        "Jonah",
        "Elijah",
        "Isaiah",
        "Daniel",
        "1",
        "Jonah was swallowed by a great fish after fleeing God's call to Nineveh."
      ],
      [
        "What is the fruit of the Spirit mentioned in Galatians 5?",
        "Wealth and Fame",
        "Love, Joy, Peace, Patience...",
        "Strength and Power",
        "Wisdom and Knowledge",
        "2",
        "Galatians 5:22-23 lists love, joy, peace, longsuffering, kindness, goodness, faithfulness, gentleness, self-control."
      ]
    ];

    // Build CSV string with escaping
    const csvContent = sampleRows.map(row => 
      row.map(val => `"${val.replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "theological_assessment_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manual Question handlers
  const handleAddQuestionField = () => {
    setNewQuestions((prev) => [
      ...prev,
      { question: "", options: ["", "", "", ""], correct: 0, explanation: "" }
    ]);
  };

  const handleRemoveQuestionField = (idx: number) => {
    setNewQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: any) => {
    setNewQuestions((prev) => {
      const copy = [...prev];
      if (field === "question") copy[idx].question = value;
      else if (field === "explanation") copy[idx].explanation = value;
      else if (field === "correct") copy[idx].correct = Number(value);
      return copy;
    });
  };

  const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
    setNewQuestions((prev) => {
      const copy = [...prev];
      copy[qIdx].options[optIdx] = value;
      return copy;
    });
  };

  // Submit new assessment
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newWeek) {
      onToast("Please fill in Title and Week/Topic reference.");
      return;
    }

    // Validate questions
    if (newQuestions.length === 0) {
      onToast("Please add at least one question.");
      return;
    }

    for (let i = 0; i < newQuestions.length; i++) {
      const q = newQuestions[i];
      if (!q.question.trim()) {
        onToast(`Question ${i + 1} cannot be empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          onToast(`Question ${i + 1}, Option ${j + 1} cannot be empty.`);
          return;
        }
      }
      if (!q.explanation.trim()) {
        onToast(`Question ${i + 1} requires an explanation.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          type: newType,
          week: newWeek,
          duration: newDuration,
          questions: newQuestions.map((q, i) => ({ id: `q_${Date.now()}_${i}`, ...q }))
        })
      });
      const data = await response.json();
      if (data.success) {
        onToast(`Successfully published dynamic theological ${newType}!`);
        setShowCreateForm(false);
        setNewTitle("");
        setNewWeek("");
        setNewDuration(15);
        setSelectedSermonId("");
        setNewQuestions([{ question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]);
        if (onUpdateState) {
          onUpdateState(data.state);
        } else if (onRefresh) {
          onRefresh();
        }
      } else {
        onToast(data.message || "Failed to publish assessment.");
      }
    } catch (err) {
      onToast("Network error publishing assessment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Archive / Toggle Status handler
  const handleToggleStatus = async (quizId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "active" ? "archived" : "active";
      const res = await fetch(`/api/quizzes/${quizId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Assessment updated to ${nextStatus}.`);
        if (onUpdateState) {
          onUpdateState(data.state);
        } else if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err) {
      onToast("Failed to update status.");
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (quizId: string) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;
    try {
      const res = await fetch(`/api/quizzes/${quizId}?role=${user.role}&userName=${encodeURIComponent(user.name)}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          onToast("Deletion request has been submitted to Lead Pastor for certification.");
        } else {
          onToast("Assessment successfully deleted.");
        }
        if (onUpdateState) {
          onUpdateState(data.state);
        } else if (onRefresh) {
          onRefresh();
        }
      }
    } catch (err) {
      onToast("Failed to delete assessment.");
    }
  };

  // Leaderboard mock
  const leaderboard = [
    { name: "Sarah Johnson", score: 100, time: "8m 20s" },
    { name: "Michael Brown", score: 80, time: "9m 15s" },
    { name: "John Doe", score: 80, time: "10m 30s" },
    { name: "Emily Davis", score: 60, time: "11m 45s" },
  ];

  if (isPlaying && activeQuiz) {
    const currentQ: Question = activeQuiz.questions[currentQIndex];
    const pctProgress = Math.round((currentQIndex / activeQuiz.questions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto space-y-6" id="active-quiz-runner">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
              (activeQuiz as any).type === "exam" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {(activeQuiz as any).type === "exam" ? "Academic Exam" : "Weekly Quiz"}
            </span>
            <span className="font-bold text-slate-700">{activeQuiz.title}</span>
          </div>
          <span className="flex items-center gap-1 font-bold">
            <Clock size={12} className="text-slate-400" />
            <span>Time: {activeQuiz.duration} min</span>
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-500 font-bold px-1">
            <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
            <span>{pctProgress}% Complete</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
            <div className="h-full bg-blue-600 transition-all duration-300 rounded-full" style={{ width: `${pctProgress}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-sm md:text-base leading-relaxed flex gap-2">
            <HelpCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <span>{currentQ.question}</span>
          </h3>

          <div className="space-y-3">
            {currentQ.options.map((opt, i) => {
              let optClass = "border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700";
              let optIcon = null;

              if (selectedOpt === i) {
                optClass = "border-blue-500 bg-blue-50/50 text-blue-900 font-semibold";
              }

              if (answered) {
                if (i === currentQ.correct) {
                  optClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                  optIcon = <Check size={14} className="text-emerald-600" />;
                } else if (selectedOpt === i) {
                  optClass = "border-red-500 bg-red-50 text-red-900";
                  optIcon = <X size={14} className="text-red-600" />;
                } else {
                  optClass = "border-slate-150 text-slate-400 opacity-60";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={answered}
                  className={`w-full p-4 border rounded-xl text-left text-xs md:text-sm font-medium transition-all flex items-center justify-between outline-none cursor-pointer ${optClass}`}
                >
                  <span>{opt}</span>
                  {optIcon}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-900 leading-relaxed">
              <span className="font-bold text-amber-950 block mb-1">📖 Theological Insight:</span>
              {currentQ.explanation}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            {!answered ? (
              <button
                onClick={handleCheckAnswer}
                disabled={selectedOpt === null}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors shadow-sm cursor-pointer outline-none"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer outline-none"
              >
                <span>{currentQIndex < activeQuiz.questions.length - 1 ? "Next Question" : "Finish Assessment"}</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (done && activeQuiz) {
    const pct = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <div className="max-w-md mx-auto text-center space-y-6" id="quiz-results-screen">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-lg space-y-6">
          <div className="text-6xl">{pct >= 85 ? "🏆" : pct >= 60 ? "👍" : "💪"}</div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">Assessment Finished!</h3>
            <p className="text-slate-400 text-xs">
              You scored {score} out of {activeQuiz.questions.length} correct.
            </p>
          </div>

          <div
            className={`text-5xl font-black leading-none ${
              pct >= 85 ? "text-emerald-500" : pct >= 60 ? "text-amber-500" : "text-red-500"
            }`}
          >
            {pct}%
          </div>

          <p className="text-slate-500 text-xs leading-relaxed max-w-[280px] mx-auto font-medium">
            {pct >= 85
              ? "Wonderful knowledge of the scriptures! You passed this academic assessment with honors."
              : pct >= 60
              ? "Good passing score! Revise the sermon notes to deepen your grasp of this week's message."
              : "Keep studying! Let's connect during midweek fellowship study sessions to grow together."}
          </p>

          <button
            onClick={() => {
              setDone(false);
              setActiveQuiz(null);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-xs transition-colors shadow-sm cursor-pointer outline-none"
          >
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="quiz-hub-container">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Discipleship Assessments</h2>
          <p className="text-slate-500 text-xs mt-1">Test your understanding of sermon outlines, doctrines, and biblical knowledge</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60 self-start text-xs font-semibold">
          {isPastor && (
            <button
              onClick={() => {
                setShowCreateForm(false);
                setActiveTab("pastor");
              }}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === "pastor" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Pastor Console
            </button>
          )}
          <button
            onClick={() => {
              setShowCreateForm(false);
              setActiveTab("assessments");
            }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "assessments" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Available Quizzes & Exams
          </button>
          <button
            onClick={() => {
              setShowCreateForm(false);
              setActiveTab("leaderboard");
            }}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              activeTab === "leaderboard" ? "bg-white text-slate-800 shadow-xs font-bold" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* PASTOR CONSOLE TAB */}
      {activeTab === "pastor" && isPastor && (
        <div className="space-y-6">
          {!showCreateForm ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Drafted Quizzes & Exams</h3>
                  <p className="text-slate-400 text-[11px] font-medium">Manage existing assessments and monitor scores</p>
                </div>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create Quiz or Exam</span>
                </button>
              </div>

              {quizzes.length === 0 ? (
                <p className="text-center text-slate-400 italic py-8 text-xs font-semibold">No assessments built yet. Tap 'Create Quiz or Exam' to launch your first assessment.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quizzes.map((q: any) => (
                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                            q.type === "exam" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {q.type === "exam" ? "Academic Exam" : "Weekly Quiz"}
                          </span>
                          <h4 className="font-bold text-slate-800 text-xs md:text-sm">{q.title}</h4>
                        </div>
                        <p className="text-slate-400 text-[10px] font-semibold">{q.week} · {q.questions?.length || 0} Questions · {q.duration} mins limit</p>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center text-xs font-semibold">
                        <div className="text-right mr-3 hidden md:block">
                          <span className="block font-bold text-slate-700">{q.participants || 0} taken</span>
                          <span className="text-[10px] text-emerald-600 font-bold">Avg: {q.avgScore || 0}%</span>
                        </div>

                        <button
                          onClick={() => handleToggleStatus(q.id, q.status)}
                          className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                            q.status === "active" 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" 
                              : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                          }`}
                        >
                          {q.status === "active" ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{q.status === "active" ? "Active" : "Archived"}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteAssessment(q.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg border border-red-150 transition-colors cursor-pointer"
                          title="Delete Assessment"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* QUIZ / EXAM CREATOR FORM */
            <form onSubmit={handleCreateSubmit} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-150 pb-5 gap-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm md:text-base flex items-center gap-1.5">
                    <ClipboardList className="text-blue-500" size={18} />
                    <span>Design Theological Assessment</span>
                  </h3>
                  <p className="text-slate-400 text-[10px] font-medium mt-1">Configure full multiple-choice questionnaires manually or using sermon notes</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors self-start cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Assessment Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Genesis Foundation Quiz or Midterm Exam"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Assessment Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "quiz" | "exam")}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer text-slate-800 font-bold"
                  >
                    <option value="quiz">Weekly Quiz</option>
                    <option value="exam">Academic Exam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Sermon / Week Reference</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Week 26, 2026"
                    value={newWeek}
                    onChange={(e) => setNewWeek(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>

                {/* Sermon Linkage for AI Questions */}
                {isLeadPastor && (
                  <div className="md:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1 text-blue-700">
                      <Sparkles size={13} />
                      <span>Link Sermon for AI Drawing (Optional)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedSermonId}
                        onChange={(e) => setSelectedSermonId(e.target.value)}
                        className="flex-1 bg-blue-50/50 border border-blue-150 rounded-lg px-3 py-2 outline-none focus:border-blue-500 cursor-pointer text-blue-900 font-bold"
                      >
                        <option value="">-- Choose Sermon Teaching --</option>
                        {(state.sermons || []).map((s) => (
                          <option key={s.id} value={s.id}>{s.title} ({s.scripture})</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={isDrawing || !selectedSermonId}
                        onClick={handleDrawQuestions}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        {isDrawing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                        <span>Draw Questions</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Questions Area */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs md:text-sm">Multiple Choice Questions</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestionField}
                    className="border border-blue-200 hover:bg-blue-50 text-blue-600 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={13} />
                    <span>Add Manual Question</span>
                  </button>
                </div>

                {/* Spreadsheet Import Control Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div className="space-y-0.5">
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Spreadsheet Import / Custom Creation</span>
                      </h5>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Upload an Excel (.xlsx, .xls) or CSV file with your questions, options, and correct answers.
                      </p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="text-[10px] bg-white hover:bg-slate-50 text-slate-700 font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Download template CSV layout"
                    >
                      <Download size={11} className="text-slate-500" />
                      <span>Download Template</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* File selector input */}
                    <div className="relative group border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg p-4 bg-white transition-colors duration-200 flex flex-col items-center justify-center text-center">
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors mb-1.5" />
                      <span className="text-xs font-bold text-slate-700 group-hover:text-emerald-700">Choose file or drag & drop</span>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Supports Excel (.xlsx, .xls) and CSV</span>
                    </div>

                    {/* Guide and Status info */}
                    <div className="flex flex-col justify-between text-[11px] text-slate-600 space-y-2.5 font-semibold">
                      <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1.5">
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>📋 Column Layout Requirements</span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[9px] text-slate-500 font-medium">
                          <div>• Question</div>
                          <div>• Option 1, Option 2</div>
                          <div>• Option 3, Option 4</div>
                          <div>• Correct Index (1 to 4)</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500">
                          Loaded Questions: <strong className="text-slate-800 font-extrabold">{newQuestions.length}</strong> {newQuestions.length === 1 ? "question" : "questions"}
                        </span>
                        {newQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Clear all loaded questions?")) {
                                setNewQuestions([{ question: "", options: ["", "", "", ""], correct: 0, explanation: "" }]);
                              }
                            }}
                            className="text-[9px] text-red-600 hover:text-red-700 font-bold uppercase tracking-wider cursor-pointer"
                          >
                            Clear list
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {newQuestions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:p-5 relative space-y-4 text-xs font-semibold text-slate-600">
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestionField(qIdx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 cursor-pointer"
                      title="Remove Question"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div className="pr-6">
                      <label className="block text-slate-700 font-bold mb-1">Question {qIdx + 1}</label>
                      <input
                        type="text"
                        required
                        placeholder="Type biblical question prompt here..."
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold text-slate-800"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx}>
                          <label className="block text-slate-500 text-[10px] font-bold mb-0.5">Option {optIdx + 1}</label>
                          <input
                            type="text"
                            required
                            placeholder={`Option ${optIdx + 1} text`}
                            value={opt}
                            onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Correct Answer Index</label>
                        <select
                          value={q.correct}
                          onChange={(e) => handleQuestionChange(qIdx, "correct", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 cursor-pointer text-slate-800 font-bold"
                        >
                          <option value={0}>Option 1</option>
                          <option value={1}>Option 2</option>
                          <option value={2}>Option 3</option>
                          <option value={3}>Option 4</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-slate-700 font-bold mb-1">Theological explanation</label>
                        <input
                          type="text"
                          required
                          placeholder="Why is this answer correct spiritually/scripturally?"
                          value={q.explanation}
                          onChange={(e) => handleQuestionChange(qIdx, "explanation", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 font-semibold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Save Panel */}
              <div className="flex justify-end gap-3 pt-5 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-xs border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Publish Assessment</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* DISCIPLE ASSESSMENT HUB */}
      {activeTab === "assessments" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-indigo-950">
            <div className="space-y-2 text-center md:text-left">
              <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide">
                Faith & Wisdom
              </span>
              <h3 className="text-xl md:text-2xl font-black">Spiritual Knowledge Center</h3>
              <p className="text-indigo-200 text-xs max-w-md font-medium">Test your biblical, doctrinal, and chapel teachings. Complete active assessments to accumulate points and track theological retention.</p>
            </div>
            <div className="flex gap-4 shrink-0 text-center bg-white/10 p-4 rounded-xl border border-white/10">
              <div>
                <div className="text-2xl font-black text-amber-300">{quizzes.filter(q => q.status === "active").length}</div>
                <div className="text-[10px] font-semibold text-indigo-200">Active Exams</div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-2xl font-black text-emerald-300">100%</div>
                <div className="text-[10px] font-semibold text-indigo-200">Accredited</div>
              </div>
            </div>
          </div>

          {quizzes.filter((q: any) => q.status === "active").length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 italic font-semibold">
              No active theological quizzes or exams are currently scheduled. Check back later!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {quizzes.filter((q: any) => q.status === "active").map((q: any) => (
                <div key={q.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 md:p-6 transition-all shadow-xs flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                        q.type === "exam" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {q.type === "exam" ? "Theological Exam" : "Weekly Quiz"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock size={11} />
                        <span>{q.duration} Mins Limit</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs md:text-sm leading-snug">{q.title}</h4>
                    <p className="text-slate-400 text-[10px] font-semibold">{q.week}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <div className="text-[10px] font-semibold text-slate-400">
                      <span className="font-bold text-slate-600 block">{q.participants || 0} participants</span>
                      <span>Average score: <span className="font-bold text-emerald-600">{q.avgScore || 0}%</span></span>
                    </div>

                    <button
                      onClick={() => handleStart(q)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Play size={11} className="fill-white" />
                      <span>Start Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LEADERBOARD TAB */}
      {activeTab === "leaderboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm md:text-base border-b border-slate-100 pb-4">
              <Trophy className="text-amber-500 fill-amber-100" size={18} />
              <span>Weekly Assessment Leaders</span>
            </div>
            <div className="divide-y divide-slate-100">
              {leaderboard.map((userRow, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                  <span className="font-extrabold text-sm text-slate-400 w-5 text-center">{i + 1}</span>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] select-none shrink-0"
                    style={{ backgroundColor: avatarBg(userRow.name) }}
                  >
                    {initials(userRow.name)}
                  </div>
                  <div className="font-bold text-slate-800 text-xs flex-1">{userRow.name}</div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 text-xs">{userRow.score}%</span>
                    <span className="block text-[9px] text-slate-400 font-semibold">{userRow.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm md:text-base border-b border-slate-100 pb-4">
              <Brain className="text-blue-500" size={18} />
              <span>Congregational Distribution Curve</span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center bg-slate-50 border border-slate-200/50 rounded-xl p-4">
              <div className="space-y-1">
                <div className="text-xl font-bold text-blue-600">328</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Passed</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-emerald-500">81.4%</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Avg Rating</div>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-purple-500">92%</div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Retention</div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-4">Congregational Score Distributions</h4>
              <div className="flex items-end justify-between h-36 px-4">
                {[
                  { label: "90-100%", val: 30, bg: "bg-emerald-500" },
                  { label: "80-89%", val: 35, bg: "bg-blue-500" },
                  { label: "70-79%", val: 20, bg: "bg-amber-500" },
                  { label: "<70%", val: 15, bg: "bg-red-500" }
                ].map((bar, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-[10px] font-bold text-slate-400">{bar.val}%</span>
                    <div
                      className={`w-10 rounded-t ${bar.bg} transition-all duration-300`}
                      style={{ height: `${bar.val * 2}px` }}
                    />
                    <span className="text-[10px] font-semibold text-slate-500 whitespace-nowrap">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
