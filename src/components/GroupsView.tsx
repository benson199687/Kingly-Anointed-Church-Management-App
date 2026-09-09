import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, Clock, MapPin, ArrowLeft, MessageSquare, BookOpen, Heart, 
  Plus, UserPlus, Award, CheckCircle, Lock, Play, Pause, Send, Bookmark, 
  Sparkles, AlertCircle, Printer, Check, GraduationCap, ChevronRight, HelpCircle, FileText, PlusCircle, Download,
  User as UserIcon, Tv, ExternalLink, Trash2, ChevronDown, ChevronUp
} from "lucide-react";
import { User as UserType, DatabaseState, Group, Message } from "../types";
import { initials, avatarBg } from "./Sidebar";
import { generateCertificatePdf } from "../lib/pdfHelper";

interface GroupsViewProps {
  user: UserType;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh: () => void;
  onViewSermon?: (id: string) => void;
  onFloatVideo?: (url: string, title: string) => void;
  setCurrentView?: (view: string) => void;
}

// 1. Initial State Hydration / Fallback Database Mocking
export const SEED_LESSONS = [
  {
    id: "les_1",
    title: "Lesson 1: Foundations of Faith",
    order: 1,
    introduction: "In this introductory lesson, we explore the bedrock of our relationship with God. Faith is more than intellectual assent; it is an active trust in His promises and character.",
    notes: "### What is Biblical Faith?\n\n* **Confidence and Assurance**: Hebrews 11:1 defines faith as confidence in what we hope for and assurance about what we do not see.\n* **The Word as Food**: Romans 10:17 teaches us that faith comes by hearing, and hearing through the word of God.\n* **Faith in Action**: True faith naturally manifests itself in loving obedience and active works (James 2:17).",
    scriptures: ["Hebrews 11:1", "Romans 10:17", "James 2:17"],
    discussionQuestions: [
      "What does 'walking by faith, not by sight' look like in your daily life?",
      "How can reading the Bible regularly build your trust in God's promises?"
    ],
    quiz: [
      {
        question: "According to Hebrews 11:1, faith is the assurance of what?",
        options: ["What we already possess", "What we do not see", "What is historically proven", "What we fear"],
        correctIndex: 1,
        explanation: "Hebrews 11:1 explicitly states faith is the assurance of things hoped for and conviction of things not seen."
      },
      {
        question: "How does faith come, according to Romans 10:17?",
        options: ["Through miracles", "By hearing the word of God", "By personal success", "Through meditation"],
        correctIndex: 1,
        explanation: "Romans 10:17 says faith comes by hearing, and hearing by the word of God."
      }
    ]
  },
  {
    id: "les_2",
    title: "Lesson 2: Grace and Salvation",
    order: 2,
    introduction: "Grace is God's extravagant favor given to us freely. In this lesson, we study the nature of grace, how it saves us, and how it empowers us to live holy lives.",
    notes: "### Understanding Extravagant Grace\n\n* **Saved by Grace**: Ephesians 2:8-9 declares that we are saved by grace through faith—not of works, so that no one can boast.\n* **Sufficient Grace**: In times of difficulty, 2 Corinthians 12:9 reassures us that His grace is completely sufficient for us.\n* **Grace to Grow**: Grace trains us to reject ungodliness and live upright, self-controlled lives (Titus 2:11-12).",
    scriptures: ["Ephesians 2:8-9", "2 Corinthians 12:9", "Titus 2:11-12"],
    discussionQuestions: [
      "Why is grace so difficult for us to accept as a completely free gift?",
      "How does understanding grace change the way you extend forgiveness to others?"
    ],
    quiz: [
      {
        question: "Ephesians 2:8-9 teaches that salvation is:",
        options: ["Earned by good works", "A free gift of God through grace", "Only for scholars", "Reserved for the perfect"],
        correctIndex: 1,
        explanation: "Ephesians 2:8 states salvation is a free gift of God, not of works, so that no one can boast."
      }
    ]
  }
];

const PATHWAY_STAGES = [
  { id: "visitor", label: "Visitor", description: "Exploring the community and fellowship", xpNeeded: 0 },
  { id: "new_believer", label: "New Believer", description: "Enrolled in Foundation Classes", xpNeeded: 100 },
  { id: "baptized", label: "Water Baptized", description: "Completed Baptism Class & Baptized", xpNeeded: 300 },
  { id: "volunteer", label: "Ministry Volunteer", description: "Serving in Sunday Teams", xpNeeded: 600 },
  { id: "leader", label: "Group Shepherd", description: "Leading and mentoring others", xpNeeded: 1000 }
];

const SCRIPTURES_DATABASE: Record<string, Record<string, string>> = {
  "Hebrews 11:1": {
    NIV: "Now faith is confidence in what we hope for and assurance about what we do not see.",
    ESV: "Now faith is the assurance of things hoped for, the conviction of things not seen.",
    KJV: "Now faith is the substance of things hoped for, the evidence of things not seen.",
    AMP: "Now faith is the assurance (title deed, confirmation) of things hoped for, the conviction of their reality."
  },
  "Romans 10:17": {
    NIV: "Consequently, faith comes from hearing the message, and the message is heard through the word about Christ.",
    ESV: "So faith comes from hearing, and hearing through the word of Christ.",
    KJV: "So then faith cometh by hearing, and hearing by the word of God.",
    AMP: "So faith comes from hearing [what is told], and what is heard comes by the co-referring word of Christ."
  },
  "James 2:17": {
    NIV: "In the same way, faith by itself, if it is not accompanied by action, is dead.",
    ESV: "So also faith by itself, if it does not have works, is dead.",
    KJV: "Even so faith, if it hath not works, is dead, being alone.",
    AMP: "So too faith, if it does not have works (deeds and actions of obedience), is by itself dead."
  },
  "Ephesians 2:8-9": {
    NIV: "For it is by grace you have been saved, through faith—and this is not from yourselves, it is the gift of God—not by works, so that no one can boast.",
    ESV: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.",
    KJV: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God: Not of works, lest any man should boast.",
    AMP: "For it is by free grace that you are saved through your faith. And this salvation is not of yourselves, but it is the gift of God; Not of works, lest any man should boast."
  }
};

export function GroupsView({ user, state, onToast, onRefresh, onViewSermon, onFloatVideo, setCurrentView }: GroupsViewProps) {
  // Current user's metadata / gamification tracking in localStorage
  const [userProgress, setUserProgress] = useState({
    xp: 220,
    streak: 4,
    completedLessons: ["les_1"],
    notebookNotes: {} as Record<string, string>,
    badges: ["Faithful Learner", "Scripture Explorer"]
  });

  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<string>("academy");
  const [groupCategory, setGroupCategory] = useState<string>("all");
  const [expandedTranscripts, setExpandedTranscripts] = useState<Record<string, boolean>>({});
  const [tempLiveLink, setTempLiveLink] = useState("");
  const [isUpdatingLink, setIsUpdatingLink] = useState(false);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<string[]>([]);

  useEffect(() => {
    if (activeGroup) {
      setTempLiveLink(activeGroup.liveStreamLink || "");
    }
  }, [activeGroup]);
  
  // Modals / Input States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddPersonModal, setShowAddPersonModal] = useState(false);
  const [createGroup, setCreateGroup] = useState({ name: "", leader: "", day: "Tuesday", time: "18:30", location: "Online", type: "class", certificateEnabled: true });
  const [addPersonName, setAddPersonName] = useState("");
  const [addPersonEmail, setAddPersonEmail] = useState("");
  const [addPersonPhone, setAddPersonPhone] = useState("");
  const [newBulletinText, setNewBulletinText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [activeChannel, setActiveChannel] = useState("#general");

  // Discipleship / Scripture Academy Qualification Pipeline States
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [selectedQualMemberId, setSelectedQualMemberId] = useState<string>("");
  const [selectedQualStage, setSelectedQualStage] = useState<string>("new_believer");
  const [isSubmittingQual, setIsSubmittingQual] = useState(false);
  const [isApprovingAllQual, setIsApprovingAllQual] = useState(false);

  const fetchQualifications = async () => {
    try {
      const res = await fetch("/api/qualifications");
      const data = await res.json();
      if (data.success) {
        setQualifications(data.qualifications || []);
      }
    } catch (err) {
      console.error("Error fetching qualifications:", err);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, []);

  const handleSubmitQualification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQualMemberId) {
      onToast("Please select a church member to qualify.");
      return;
    }

    const memberObj = (state.members || []).find((m: any) => String(m.id) === String(selectedQualMemberId));
    if (!memberObj) {
      onToast("Selected member not found in directory.");
      return;
    }

    const stageObj = PATHWAY_STAGES.find(s => s.id === selectedQualStage);
    if (!stageObj) return;

    setIsSubmittingQual(true);
    try {
      const res = await fetch("/api/qualifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedQualMemberId,
          memberName: memberObj.name,
          stage: selectedQualStage,
          stageLabel: stageObj.label,
          submittedBy: user.name,
          submittedRole: user.role
        })
      });
      const data = await res.json();
      if (data.success) {
        if (["pastor", "admin"].includes(user.role)) {
          onToast(`Successfully qualified & approved ${memberObj.name} for ${stageObj.label}!`);
        } else {
          onToast(`Discipleship pass for ${memberObj.name} submitted successfully! Awaiting Pastor approval.`);
        }
        setSelectedQualMemberId("");
        fetchQualifications();
        onRefresh(); // refresh main DB state
      } else {
        onToast(data.message || "Could not submit qualification.");
      }
    } catch (err) {
      onToast("Error submitting qualification.");
    } finally {
      setIsSubmittingQual(false);
    }
  };

  const handleApproveAllQualifications = async () => {
    setIsApprovingAllQual(true);
    try {
      const res = await fetch("/api/qualifications/approve-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully approved and registered all ${data.approvedCount} pending discipleship graduates!`);
        fetchQualifications();
        onRefresh();
      }
    } catch (err) {
      onToast("Error approving pending submissions.");
    } finally {
      setIsApprovingAllQual(false);
    }
  };

  const handleApproveSingleQualification = async (qualId: string) => {
    try {
      const res = await fetch(`/api/qualifications/${qualId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast("Discipleship qualification signed off & registered!");
        fetchQualifications();
        onRefresh();
      }
    } catch (err) {
      onToast("Error signing off qualification.");
    }
  };

  // Discipleship Academy States
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [notebookInput, setNotebookInput] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [activeScripture, setActiveScripture] = useState<string | null>(null);

  // New Academy and Exam Active States
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [quizAnswersState, setQuizAnswersState] = useState<Record<number, any>>({});
  const [activeExam, setActiveExam] = useState<any>(null);
  const [examAnswersState, setExamAnswersState] = useState<Record<number, any>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const [showCertificateCourse, setShowCertificateCourse] = useState<any>(null);
  const [isGradingMode, setIsGradingMode] = useState(false);
  const [selectedGradingAttempt, setSelectedGradingAttempt] = useState<any>(null);
  const [gradingScores, setGradingScores] = useState<Record<number, number>>({});
  const [gradingComments, setGradingComments] = useState("");

  // Events Form States
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [eventLoc, setEventLoc] = useState("");
  const [eventStatus, setEventStatus] = useState<any>("Upcoming");

  // Course Admin Form States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [courseIsPublished, setCourseIsPublished] = useState(true);

  // Module Admin Form States
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [moduleOrder, setModuleOrder] = useState("");
  const [moduleQuizScore, setModuleQuizScore] = useState("70");

  // Lesson Admin Form States
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  const [lessonTitleState, setLessonTitleState] = useState("");
  const [lessonIntroState, setLessonIntroState] = useState("");
  const [lessonNotesState, setLessonNotesState] = useState("");
  const [lessonScripturesState, setLessonScripturesState] = useState("");
  const [lessonQuestionsState, setLessonQuestionsState] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonAudioUrl, setLessonAudioUrl] = useState("");
  const [lessonDocUrl, setLessonDocUrl] = useState("");

  // Quiz Admin Form States
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<any>(null);
  const [quizTitleState, setQuizTitleState] = useState("");
  const [quizLinkedType, setQuizLinkedType] = useState<any>("module");
  const [quizLinkedId, setQuizLinkedId] = useState("");
  const [quizPassingMark, setQuizPassingMark] = useState("70");
  const [quizTimeLimit, setQuizTimeLimit] = useState("");
  const [quizAttemptsAllowed, setQuizAttemptsAllowed] = useState("0");
  const [quizIsSelf, setQuizIsSelf] = useState(true);
  const [quizQuestionsList, setQuizQuestionsList] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0, type: "multiple-choice" }
  ]);

  // Exam Admin Form States
  const [showExamModal, setShowExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);
  const [examTitleState, setExamTitleState] = useState("");
  const [examCourseId, setExamCourseId] = useState("");
  const [examSyllabusId, setExamSyllabusId] = useState("");
  const [examModuleIds, setExamModuleIds] = useState<string[]>([]);
  const [examStartDate, setExamStartDate] = useState("");
  const [examEndDate, setExamEndDate] = useState("");
  const [examPassingMark, setExamPassingMark] = useState("70");
  const [examTimeLimit, setExamTimeLimit] = useState("");
  const [examAttemptsAllowed, setExamAttemptsAllowed] = useState("1");
  const [examQuestionsList, setExamQuestionsList] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctIndex: 0, type: "multiple-choice" }
  ]);
  
  // AI Generator States
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  // Custom Lesson & Quiz Builder States
  const [showLessonBuilder, setShowLessonBuilder] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonIntro, setLessonIntro] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [lessonScriptures, setLessonScriptures] = useState("");
  const [lessonDiscussion, setLessonDiscussion] = useState("");
  const [customQuestions, setCustomQuestions] = useState<any[]>([
    { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }
  ]);

  // AI Assistant States
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantAnswers, setAssistantAnswers] = useState<Array<{ q: string; a: string }>>([]);
  const [assistantLoading, setAssistantLoading] = useState(false);

  // Prayer Circle States
  const [prayerRequestInput, setPrayerRequestInput] = useState("");
  const [prayerCategory, setPrayerCategory] = useState("Health");
  const [groupPrayers, setGroupPrayers] = useState<any[]>([
    { id: "pr_1", member: "Brother James", category: "Health", request: "Pray for my grandmother who is recovering from knee surgery.", date: "Today", prayingCount: 5, prayingUsers: ["Elder John"], encouragements: [], answered: false }
  ]);
  const [encouragementInput, setEncouragementInput] = useState<Record<string, string>>({});

  // Virtual Live Stream simulation
  const [livePlaying, setLivePlaying] = useState(false);
  const [handsRaised, setHandsRaised] = useState<string[]>([]);
  const [activePoll, setActivePoll] = useState({ question: "Is your personal devotion time consistent?", options: ["Daily", "Weekly", "Struggling"], votes: [12, 8, 4] });
  const [userVoted, setUserVoted] = useState(false);

  // Attendance logging state
  const [attendanceForm, setAttendanceForm] = useState({ date: new Date().toISOString().split("T")[0], male: 0, female: 0, kids: 0, level: "Mixed", notes: "" });

  // Certificate download & sign-off States
  const [showCertificateStudentName, setShowCertificateStudentName] = useState<string | null>(null);
  const [tempSig1, setTempSig1] = useState("");
  const [tempSig1Title, setTempSig1Title] = useState("");
  const [tempSig2, setTempSig2] = useState("");
  const [tempSig2Title, setTempSig2Title] = useState("");
  const [tempGroupStatus, setTempGroupStatus] = useState("published");
  const [tempCertTheme, setTempCertTheme] = useState("gold");
  const [tempAllowDownload, setTempAllowDownload] = useState(true);

  useEffect(() => {
    if (activeGroup) {
      setTempSig1(activeGroup.signatory1 || "Pastor Benson Nyirenda");
      setTempSig1Title(activeGroup.signatory1Title || "Lead Pastor");
      setTempSig2(activeGroup.signatory2 || "Deaconess Winnie Nyirenda");
      setTempSig2Title(activeGroup.signatory2Title || "Education Director");
      setTempGroupStatus(activeGroup.status || "published");
      setTempCertTheme(activeGroup.certificateTheme || "gold");
      setTempAllowDownload(activeGroup.allowMemberDownloads !== false);
    }
  }, [activeGroup]);

  const handleUpdateCourseStatus = async (status: string) => {
    if (!activeGroup) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Course status updated to "${status}" successfully!`);
        setTempGroupStatus(status);
        setActiveGroup(prev => prev ? { ...prev, status } : null);
        onRefresh();
      } else {
        onToast(data.message || "Failed to update course status.");
      }
    } catch (err) {
      onToast("Error updating course status.");
    }
  };

  const handleUpdateSignatories = async () => {
    if (!activeGroup) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatory1: tempSig1,
          signatory1Title: tempSig1Title,
          signatory2: tempSig2,
          signatory2Title: tempSig2Title,
          certificateTheme: tempCertTheme,
          allowMemberDownloads: tempAllowDownload
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast("Certificate settings updated successfully!");
        setActiveGroup(prev => prev ? { 
          ...prev, 
          signatory1: tempSig1,
          signatory1Title: tempSig1Title,
          signatory2: tempSig2,
          signatory2Title: tempSig2Title,
          certificateTheme: tempCertTheme,
          allowMemberDownloads: tempAllowDownload
        } : null);
        onRefresh();
      } else {
        onToast(data.message || "Failed to update certificate settings.");
      }
    } catch (err) {
      onToast("Error saving certificate settings.");
    }
  };

  const handleApproveCertificate = async (studentName: string) => {
    if (!activeGroup) return;

    const currentProgress = { ...(activeGroup.studentProgress || {}) };
    const progress = currentProgress[studentName] || {
      userId: studentName,
      completedLessons: [],
      completedModules: [],
      completedCourses: [],
      quizAttempts: {},
      examAttempts: {},
      certificates: []
    };

    const certId = progress.certificateId || `CERT-${new Date().getFullYear()}-${String(Math.abs(studentName.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0))).substring(0, 4).padStart(4, "0")}`;

    currentProgress[studentName] = {
      ...progress,
      certificateStatus: "Approved",
      certificateId: certId,
      completedDate: progress.completedDate || new Date().toISOString().split("T")[0]
    };

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProgress: currentProgress
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully approved and certified ${studentName}!`);
        setActiveGroup(prev => prev ? { ...prev, studentProgress: currentProgress } : null);
        onRefresh();
      } else {
        onToast(data.message || "Failed to approve certificate.");
      }
    } catch (err) {
      onToast("Error approving certificate.");
    }
  };

  const handleDownloadCertificateForGroup = (studentName: string, group: any) => {
    if (!group) return;

    // Programmatic verification: Must be Approved or Printed, or user must be the pastor/leader/admin
    const studentProgress = group?.studentProgress?.[studentName];
    const certStatus = studentProgress?.certificateStatus || "Pending";
    
    const isPastorOrAdmin = ["pastor", "admin"].includes(user.role);
    const allowDownload = group.allowMemberDownloads !== false;

    if (!isPastorOrAdmin && !allowDownload) {
      onToast(`Download blocked. Member certificate downloads for "${group.name}" are currently restricted by the Lead Pastor.`);
      return;
    }

    const isCertified = certStatus === "Approved" || certStatus === "Printed" || isPastorOrAdmin;
    
    if (!isCertified) {
      onToast(`Download blocked. Certificate for ${studentName} is awaiting Lead Pastor Certification.`);
      return;
    }

    const s1 = group.signatory1 || "Pastor Benson Nyirenda";
    const s1Title = group.signatory1Title || "Lead Pastor";
    const s2 = group.signatory2 || "Deaconess Winnie Nyirenda";
    const s2Title = group.signatory2Title || "Education Director";
    const courseTitle = group.name;
    const dateStr = studentProgress?.completedDate 
      ? new Date(studentProgress.completedDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    
    try {
      generateCertificatePdf({
        studentName,
        courseTitle,
        signatory1: s1,
        signatory1Title: s1Title,
        signatory2: s2,
        signatory2Title: s2Title,
        dateStr,
        themeName: group.certificateTheme || "gold"
      });
      onToast(`PDF Certificate for "${courseTitle}" downloaded successfully!`);
    } catch (err) {
      console.error(err);
      onToast("Error generating PDF Certificate.");
    }
  };

  const handleDownloadCertificate = (studentName: string) => {
    handleDownloadCertificateForGroup(studentName, activeGroup);
  };

  // Load progress from localStorage and merge with server progress from groups
  useEffect(() => {
    const saved = localStorage.getItem(`growth_progress_${user.name}`);
    let loaded = saved ? JSON.parse(saved) : {
      xp: 220,
      streak: 4,
      completedLessons: ["les_1"],
      notebookNotes: {} as Record<string, string>,
      badges: ["Faithful Learner", "Scripture Explorer"]
    };

    // Merge server progress from all groups
    const serverCompleted: string[] = [];
    if (state.groups) {
      state.groups.forEach((g: any) => {
        const prog = g.studentProgress?.[user.name];
        if (prog?.completedLessons) {
          prog.completedLessons.forEach((id: string) => {
            if (!serverCompleted.includes(id)) {
              serverCompleted.push(id);
            }
          });
        }
      });
    }

    // Merge them and eliminate duplicates
    const mergedCompleted = Array.from(new Set([...loaded.completedLessons, ...serverCompleted]));
    loaded.completedLessons = mergedCompleted;

    if (user.xp !== undefined) {
      loaded.xp = Number(user.xp);
    }
    setUserProgress(loaded);
  }, [user.name, user.xp, state.groups]);

  const saveProgress = (newProg: typeof userProgress) => {
    setUserProgress(newProg);
    localStorage.setItem(`growth_progress_${user.name}`, JSON.stringify(newProg));
  };

  // Roles checking
  const isLeadPastor = user.role === "pastor" && user.pastorType === "main";
  const isPastor = user.role === "pastor";
  const isLeader = user.role === "deacon" || user.role === "elder" || isPastor || user.role === "admin";
  const isStudent = user.role === "member";

  // Calculate current pathway stage
  const currentStage = React.useMemo(() => {
    if (user.spiritualGrowthLevel) {
      const found = PATHWAY_STAGES.find(s => 
        s.id === user.spiritualGrowthLevel || 
        s.label.toLowerCase() === user.spiritualGrowthLevel.toLowerCase()
      );
      if (found) {
        return found;
      }
      return {
        id: "custom",
        label: user.spiritualGrowthLevel,
        description: user.classEnrollment || "Enrolled in Foundation Classes",
        xpNeeded: user.xp !== undefined ? Number(user.xp) : 100
      };
    }
    const currentXp = user.xp !== undefined ? Number(user.xp) : userProgress.xp;
    return PATHWAY_STAGES.reduce((prev, curr) => {
      if (currentXp >= curr.xpNeeded) return curr;
      return prev;
    }, PATHWAY_STAGES[0]);
  }, [user.spiritualGrowthLevel, user.classEnrollment, user.xp, userProgress.xp]);

  const currentStageDescription = user.classEnrollment || currentStage.description;

  const nextStage = PATHWAY_STAGES[PATHWAY_STAGES.indexOf(currentStage) + 1] || null;
  const currentXpVal = user.xp !== undefined ? Number(user.xp) : userProgress.xp;
  const progressPercent = nextStage 
    ? Math.min(100, Math.max(0, ((currentXpVal - currentStage.xpNeeded) / (nextStage.xpNeeded - currentStage.xpNeeded)) * 100))
    : 100;

  // Handle Join group
  const handleJoinGroup = async (group: Group) => {
    try {
      const res = await fetch(`/api/groups/${group.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: user.name })
      });
      if (res.ok) {
        onToast(`Successfully joined the ${group.name} workspace!`);
        onRefresh();
      } else {
        onToast("Could not join group. Please try again.");
      }
    } catch (e) {
      onToast("Error joining group workspace.");
    }
  };

  // Create Group
  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createGroup.name,
          leader: createGroup.leader,
          day: createGroup.day,
          time: createGroup.time,
          location: createGroup.location,
          type: createGroup.type,
          certificateEnabled: createGroup.certificateEnabled
        })
      });
      if (res.ok) {
        onToast(`Group "${createGroup.name}" created successfully!`);
        setShowCreateModal(false);
        setCreateGroup({ name: "", leader: "", day: "Tuesday", time: "18:30", location: "Online", type: "class", certificateEnabled: true });
        onRefresh();
      }
    } catch (e) {
      onToast("Failed to create group.");
    }
  };

  // Submit request to add member
  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;
    if (!addPersonEmail && !addPersonPhone) {
      onToast("Please provide either an email address or a phone number so they can be reached.");
      return;
    }
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/add-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: addPersonName,
          email: addPersonEmail,
          phone: addPersonPhone,
          fromUser: user.name
        })
      });
      if (res.ok) {
        onToast(`Connection request for ${addPersonName} submitted! Email/SMS welcome sent.`);
        setShowAddPersonModal(false);
        setAddPersonName("");
        setAddPersonEmail("");
        setAddPersonPhone("");
        onRefresh();
      }
    } catch (e) {
      onToast("Error submitting connection request.");
    }
  };

  // Post bulletin board announcement
  const handlePostBulletin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !newBulletinText.trim()) return;
    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/bulletins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: user.name, content: newBulletinText })
      });
      if (res.ok) {
        onToast("Discipleship bulletin posted to board!");
        setNewBulletinText("");
        onRefresh();
      }
    } catch (e) {
      onToast("Failed to post bulletin.");
    }
  };

  // Custom Lesson & Quiz creation helpers
  const handleAddCustomQuestion = () => {
    setCustomQuestions([
      ...customQuestions,
      { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }
    ]);
  };

  const handleRemoveCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...customQuestions];
    updated[qIndex].options[optIndex] = value;
    setCustomQuestions(updated);
  };

  const handleUpdateSimpleField = (qIndex: number, field: string, value: any) => {
    const updated = [...customQuestions];
    updated[qIndex][field] = value;
    setCustomQuestions(updated);
  };

  const handleCreateLessonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup) return;

    const bodyPayload = {
      title: lessonTitle,
      introduction: lessonIntro,
      notes: lessonNotes,
      scriptures: lessonScriptures.split(",").map(s => s.trim()).filter(Boolean),
      discussionQuestions: lessonDiscussion.split("\n").map(q => q.trim()).filter(Boolean),
      quiz: customQuestions.map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: Number(q.correctAnswer),
        explanation: q.explanation
      }))
    };

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        onToast(`Custom lesson "${lessonTitle}" with interactive quiz successfully added to connection syllabus!`);
        setShowLessonBuilder(false);
        setLessonTitle("");
        setLessonIntro("");
        setLessonNotes("");
        setLessonScriptures("");
        setLessonDiscussion("");
        setCustomQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }]);
        onRefresh();
      } else {
        onToast("Could not save lesson. Please verify inputs.");
      }
    } catch (err) {
      onToast("Error saving connection group lesson.");
    }
  };

  // Send Chat message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !chatInput.trim()) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: user.name,
          groupId: activeGroup.id,
          preview: chatInput.slice(0, 40),
          content: `${activeChannel}: ${chatInput}`
        })
      });
      if (res.ok) {
        setChatInput("");
        onRefresh();
      }
    } catch (e) {
      onToast("Failed to send chat.");
    }
  };

  // Ask AI Assistant (Theological insights on scripture)
  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;
    setAssistantLoading(true);
    const q = assistantInput;
    setAssistantInput("");
    try {
      const res = await fetch("/api/ai/ask-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context: selectedLesson?.notes })
      });
      const data = await res.json();
      if (data.success) {
        setAssistantAnswers(prev => [...prev, { q, a: data.answer }]);
      } else {
        onToast("AI study assistant experienced an issue.");
      }
    } catch (e) {
      onToast("Error calling theological AI.");
    } finally {
      setAssistantLoading(false);
    }
  };

  // Generate Lesson using Gemini
  const handleGenerateLesson = async () => {
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch("/api/ai/generate-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic })
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedLesson(data.lesson);
        onToast("Sermon outline & discipleship lesson generated!");
      } else {
        onToast("AI Generation failed. Key may be missing.");
      }
    } catch (e) {
      onToast("Failed to generate AI study guide.");
    } finally {
      setAiGenerating(false);
    }
  };

  // Publish AI Generated Lesson to Course
  const handlePublishLesson = async () => {
    if (!generatedLesson || !activeGroup) return;
    
    const bodyPayload = {
      title: generatedLesson.title,
      introduction: generatedLesson.introduction,
      notes: generatedLesson.notes,
      scriptures: generatedLesson.scriptures || [],
      discussionQuestions: generatedLesson.discussionQuestions || [],
      quiz: generatedLesson.quiz || []
    };

    try {
      const res = await fetch(`/api/groups/${activeGroup.id}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload)
      });
      if (res.ok) {
        onToast(`Successfully published: "${generatedLesson.title}" to group syllabus!`);
        setGeneratedLesson(null);
        setAiTopic("");
        onRefresh();
      } else {
        onToast("Failed to save AI generated lesson.");
      }
    } catch (err) {
      onToast("Error saving AI lesson.");
    }
  };

  // Quiz submission & XP reward
  const handleQuizSubmit = () => {
    if (!selectedLesson) return;
    let correctCount = 0;
    selectedLesson.quiz.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const passed = correctCount >= selectedLesson.quiz.length * 0.8;
    setQuizPassed(passed);
    setQuizSubmitted(true);

    if (passed) {
      onToast("Congratulations! You passed the lesson quiz! +50 XP");
      const isNewCompletion = !userProgress.completedLessons.includes(selectedLesson.id);
      let updatedCompleted = [...userProgress.completedLessons];
      if (isNewCompletion) {
        updatedCompleted.push(selectedLesson.id);
      }
      
      const newXp = isNewCompletion ? userProgress.xp + 50 : userProgress.xp;
      const isPreloaded = activeGroup && (activeGroup.id === "1783420856423" || activeGroup.id === "1783422112044");
      const totalGroupLessons = (isPreloaded ? SEED_LESSONS.length : 0) + (activeGroup?.lessons || []).length;
      const isGraduate = totalGroupLessons > 0 && updatedCompleted.length >= totalGroupLessons;
      let badges = [...userProgress.badges];
      if (isGraduate && !badges.includes("Discipleship Graduate")) {
        badges.push("Discipleship Graduate");
        onToast("🎉 SCRIPTURE ACADEMY GRADUATE BADGE UNLOCKED!");
      }

      saveProgress({
        ...userProgress,
        xp: newXp,
        completedLessons: updatedCompleted,
        badges
      });

      // Synchronize with server if in activeGroup
      if (activeGroup) {
        fetch(`/api/groups/${activeGroup.id}/lessons/${selectedLesson.id}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userName: user.name })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            onRefresh();
          }
        })
        .catch(err => console.error("Error synchronizing progress to server:", err));
      }
    } else {
      onToast("Study notes carefully and try again to achieve 80%+!");
    }
  };

  // Saved Notebook editing
  const handleSaveNotebookNotes = () => {
    if (!selectedLesson) return;
    const notesCopy = { ...userProgress.notebookNotes };
    notesCopy[selectedLesson.id] = notebookInput;
    saveProgress({
      ...userProgress,
      notebookNotes: notesCopy
    });
    onToast("Lesson reflection notes saved in private notebook!");
  };

  // Download Notebook Notes as file
  const handleDownloadNotes = () => {
    if (!selectedLesson) return;
    const noteContent = notebookInput || "No notes written yet.";
    const blob = new Blob([`Kingly Anointed Church - Discipleship Academy\nLesson: ${selectedLesson.title}\nReflections Written By: ${user.name}\n\nNotes:\n${noteContent}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${selectedLesson.title.replace(/[^a-z0-9]/gi, "_")}_notes.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onToast("Downloaded notes as text file!");
  };

  // Submit prayer request
  const handleAddPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerRequestInput.trim()) return;
    const newPrayer = {
      id: "pr_" + Date.now(),
      member: user.name,
      category: prayerCategory,
      request: prayerRequestInput,
      date: "Today",
      prayingCount: 1,
      prayingUsers: [user.name],
      encouragements: [],
      answered: false
    };
    setGroupPrayers([newPrayer, ...groupPrayers]);
    setPrayerRequestInput("");
    onToast("Your prayer request has been raised in the circle!");
  };

  const handleIntercede = (pId: string) => {
    setGroupPrayers(prev => prev.map(p => {
      if (p.id === pId) {
        const hasVoted = p.prayingUsers.includes(user.name);
        return {
          ...p,
          prayingCount: hasVoted ? p.prayingCount - 1 : p.prayingCount + 1,
          prayingUsers: hasVoted ? p.prayingUsers.filter((u: string) => u !== user.name) : [...p.prayingUsers, user.name]
        };
      }
      return p;
    }));
  };

  const handlePostEncouragement = (pId: string) => {
    const text = encouragementInput[pId];
    if (!text || !text.trim()) return;
    setGroupPrayers(prev => prev.map(p => {
      if (p.id === pId) {
        return {
          ...p,
          encouragements: [...p.encouragements, { author: user.name, content: text, date: "Just now" }]
        };
      }
      return p;
    }));
    setEncouragementInput(prev => ({ ...prev, [pId]: "" }));
    onToast("Shared encouraging word inside the prayer circle.");
  };

  const handleAnswerPrayer = (pId: string) => {
    setGroupPrayers(prev => prev.map(p => {
      if (p.id === pId) {
        return { ...p, answered: true };
      }
      return p;
    }));
    onToast("Praise God! Marked request as Answered Prayer!");
  };

  // Poll Vote Simulation
  const handleVotePoll = (optIdx: number) => {
    if (userVoted) return;
    const newVotes = [...activePoll.votes];
    newVotes[optIdx] = newVotes[optIdx] + 1;
    setActivePoll(prev => ({ ...prev, votes: newVotes }));
    setUserVoted(true);
    onToast("Live class poll response registered!");
  };

  // Submit physical/online connection group attendance log (Shepherding/Leader task)
  const handleAttendanceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: attendanceForm.date,
          male: Number(attendanceForm.male),
          female: Number(attendanceForm.female),
          kids: Number(attendanceForm.kids),
          level: attendanceForm.level,
          notes: attendanceForm.notes || `Logged from Connection Group: ${activeGroup?.name}`,
          submittedBy: user.name,
          submittedRole: user.role,
          status: isPastor ? "approved" : "pending"
        })
      });
      if (res.ok) {
        onToast(isPastor ? "Attendance recorded & automatically signed off!" : "Attendance logged! Awaiting Elder/Pastor sign-off.");
        setAttendanceForm({ date: new Date().toISOString().split("T")[0], male: 0, female: 0, kids: 0, level: "Mixed", notes: "" });
        if (onRefresh) onRefresh();
      }
    } catch (e) {
      onToast("Failed to log attendance.");
    }
  };

  const renderMemberTranscripts = () => {
    const list = state.groups || [];
    // Filter to only "class" type groups (Academy Classes) that the user is a member of
    const enrolledClasses = list.filter(g => {
      const isCourse = g.type === "class" || g.leader?.toLowerCase().includes("teacher") || g.name?.toLowerCase().includes("class") || g.name?.toLowerCase().includes("training");
      const isMember = g.memberNames?.includes(user.name);
      return isCourse && isMember;
    });

    return (
      <div className="space-y-6">
        {/* Transcript Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-md border border-slate-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <span className="bg-indigo-500/30 text-indigo-300 font-bold text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider border border-indigo-500/20">
                Official Academy Record
              </span>
              <h2 className="text-xl font-black font-sans tracking-tight">Academic Transcripts & Certified Diplomas</h2>
              <p className="text-slate-300 text-xs max-w-xl">
                View your progress, exam scores, and printable graduation certificates across all discipleship courses you are enrolled in.
              </p>
            </div>
            
            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700 text-xs space-y-1.5 min-w-[200px]">
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Student:</span>
                <span className="text-white">{user.name}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Current Stage:</span>
                <span className="text-yellow-400">{currentStage.label}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-400">Total Progress:</span>
                <span className="text-indigo-400">{userProgress.xp} XP</span>
              </div>
            </div>
          </div>
        </div>

        {enrolledClasses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 border border-slate-100">
              <GraduationCap size={32} />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="font-bold text-slate-800 text-sm">No Active Enrollments Found</h3>
              <p className="text-slate-500 text-xs">
                You are not registered in any Academy Classes yet. Complete classes to earn certified diplomas and badges.
              </p>
            </div>
            <button
              onClick={() => setGroupCategory("class")}
              className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Browse Academy Classes</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {enrolledClasses.map((g) => {
              const isPreloaded = g.id === "1783420856423" || g.id === "1783422112044";
              const groupLessons = isPreloaded ? [...SEED_LESSONS, ...(g.lessons || [])] : (g.lessons || []);
              const totalLessons = groupLessons.length;
              
              // Count completed lessons for this specific group
              const completedCount = groupLessons.filter(les => 
                userProgress.completedLessons.includes(les.id) || 
                g.studentProgress?.[user.name]?.completedLessons?.includes(les.id)
              ).length;

              const percent = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
              const isGraduate = percent >= 100 && totalLessons > 0;
              
              const studentProgress = g.studentProgress?.[user.name];
              const certStatus = studentProgress?.certificateStatus || "Pending";
              const certId = studentProgress?.certificateId || `STU-${g.id.substring(g.id.length - 4)}-${user.name.substring(0, 3).toUpperCase()}`;
              const theme = g.certificateTheme || "gold";
              const allowDownload = g.allowMemberDownloads !== false || ["pastor", "admin"].includes(user.role);

              // Theme styles mapping for buttons & accents
              const themeColors: Record<string, { bg: string, text: string, border: string, btn: string }> = {
                gold: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200", btn: "bg-amber-600 hover:bg-amber-700 text-white" },
                blue: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
                burgundy: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200", btn: "bg-rose-700 hover:bg-rose-800 text-white" },
                emerald: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200", btn: "bg-emerald-600 hover:bg-emerald-700 text-white" },
                purple: { bg: "bg-purple-50", text: "text-purple-800", border: "border-purple-200", btn: "bg-purple-600 hover:bg-purple-700 text-white" }
              };
              const cStyle = themeColors[theme] || themeColors.gold;

              const isExpanded = !!expandedTranscripts[g.id];

              return (
                <div key={g.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Course & Progress Details */}
                    <div className="space-y-3.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-indigo-100">
                          {g.name}
                        </span>
                        <span className="text-slate-400 text-xs font-semibold">• Shepherd: {g.leader}</span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-slate-800 text-base">{g.name}</h3>
                        <p className="text-slate-400 text-xs mt-0.5 font-semibold">Every {g.day} at {g.time} • {g.location}</p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600">Syllabus Completion</span>
                          <span className="text-slate-900">{completedCount} of {totalLessons} lessons ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className={`h-full transition-all duration-500 ${isGraduate ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Graduation & Certificate Area */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[280px] flex flex-col justify-between space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Graduation Status</span>
                          {isGraduate ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-200">
                              <CheckCircle size={10} />
                              Graduate
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-amber-200">
                              ⏳ In Progress
                            </span>
                          )}
                        </div>

                        {isGraduate && (
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Certificate ID</span>
                            <span className="font-mono text-[10px] font-bold text-slate-700">{certId}</span>
                          </div>
                        )}
                      </div>

                      {isGraduate ? (
                        <div className="space-y-2 pt-1 border-t border-slate-200/60">
                          <div className="flex items-center justify-between text-[11px] font-semibold">
                            <span className="text-slate-500">Certificate Status:</span>
                            <span className={`font-bold capitalize ${
                              certStatus === "Approved" || certStatus === "Printed" 
                                ? "text-emerald-600" 
                                : "text-amber-600"
                            }`}>
                              {certStatus === "Approved" || certStatus === "Printed" ? "✅ Signed & Approved" : "⏳ Awaiting Pastor Signature"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              onClick={() => handleDownloadCertificateForGroup(user.name, g)}
                              disabled={!allowDownload}
                              className={`py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                allowDownload 
                                  ? cStyle.btn 
                                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
                              }`}
                              title={allowDownload ? "Download PDF Certificate" : "Downloads restricted by pastor"}
                            >
                              <Download size={11} />
                              <span>{allowDownload ? "Download PDF" : "Locked"}</span>
                            </button>
                            <button
                              onClick={() => {
                                // Temporarily switch activeGroup to print and call window.print
                                const currentActive = activeGroup;
                                setActiveGroup(g);
                                setTimeout(() => {
                                  window.print();
                                  setActiveGroup(currentActive);
                                }, 100);
                              }}
                              className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 py-1.5 rounded text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Printer size={11} />
                              <span>Print Web</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic border-t border-slate-200/60 pt-2">
                          Complete remaining lessons and pass the final lesson quiz to unlock your graduation certificate.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Toggle syllabus details */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex justify-between items-center text-xs">
                    <button
                      onClick={() => setExpandedTranscripts(prev => ({ ...prev, [g.id]: !prev[g.id] }))}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      <span>{isExpanded ? "Hide Course Syllabus & Grades" : "Show Course Syllabus & Grades"}</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveGroup(g);
                        setActiveTab("academy");
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                    >
                      Go to Classroom Study Workspace
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-white p-4 animate-in fade-in slide-in-from-top-1 duration-150">
                      <h4 className="text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">Course Syllabus Completion History</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {groupLessons.map((les, index) => {
                          const isCompleted = userProgress.completedLessons.includes(les.id) || 
                            g.studentProgress?.[user.name]?.completedLessons?.includes(les.id);
                          return (
                            <div key={les.id} className="p-2.5 rounded-lg border border-slate-100 flex items-center justify-between bg-slate-50/30">
                              <div className="flex items-center gap-2 min-w-0">
                                {isCompleted ? (
                                  <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>
                                )}
                                <span className="font-semibold text-slate-700 truncate">{index + 1}. {les.title}</span>
                              </div>
                              {isCompleted && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                  Passed 100%
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render direct list of groups (Main Dashboard)
  const renderGroupList = () => {
    const list = state.groups || [];
    const filtered = list.filter(g => {
      const isCourse = g.type === "class" || g.leader?.toLowerCase().includes("teacher") || g.name?.toLowerCase().includes("class") || g.name?.toLowerCase().includes("training");
      const isPastorOrAdmin = ["pastor", "admin"].includes(user.role);
      
      if (isCourse) {
        const status = (g.status || "published").toLowerCase();
        if (!isPastorOrAdmin && status !== "published") {
          return false;
        }
      }

      if (groupCategory === "all") return true;
      if (groupCategory === "class") return isCourse;
      return !isCourse;
    });

    return (
      <div className="space-y-6">
        {/* Pathway Header Banner */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Award size={150} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="bg-indigo-500/30 text-indigo-300 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full tracking-wider border border-indigo-500/20">
                Spiritual Growth Pathway Engine
              </span>
              <h2 className="text-lg font-bold">Discipleship Pathway Stage: <span className="text-yellow-400 font-extrabold">{currentStage.label}</span></h2>
              <p className="text-slate-300 text-xs max-w-lg">{currentStageDescription}</p>
            </div>
            
            <div className="w-full md:w-60 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 text-xs">
              <div className="flex justify-between font-semibold mb-1">
                <span>Pathway Progress</span>
                <span className="text-indigo-300">{userProgress.xp} XP</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-700">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-400 h-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
              </div>
              {nextStage && (
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>Next: {nextStage.label}</span>
                  <span>{nextStage.xpNeeded - userProgress.xp} XP needed</span>
                </div>
              )}
            </div>
          </div>

          {/* Staggered mini pathway badges to visually show current progress */}
          <div className="grid grid-cols-5 gap-1.5 mt-4 pt-4 border-t border-slate-800/50">
            {PATHWAY_STAGES.map((stg, i) => {
              const isCurrent = currentStage.id === stg.id;
              const isPassed = PATHWAY_STAGES.indexOf(currentStage) >= i;
              return (
                <div key={stg.id} className={`p-1.5 rounded-lg text-center flex flex-col items-center justify-center transition-all ${
                  isCurrent ? "bg-indigo-600/40 border border-indigo-400 text-white" : isPassed ? "bg-slate-800/60 text-slate-300 border border-slate-700/40" : "bg-slate-900/30 text-slate-500 border border-transparent"
                }`}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mb-1">
                    {isPassed ? <Check size={10} className="text-indigo-400" /> : <span className="text-[9px]">{i+1}</span>}
                  </div>
                  <span className="text-[9px] font-bold block truncate w-full">{stg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leadership Discipleship & Scripture Academy Qualification Pipeline */}
        {isLeader && (
          <div className="bg-white border border-indigo-100 rounded-2xl shadow-sm overflow-hidden" id="discipleship-qualification-pipeline">
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-blue-50 to-white border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Award size={18} className="text-indigo-600" />
                  Scripture Academy Discipleship Qualification Pipeline
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  As an ordained leader ({user.role}), you can nominate & verify members who successfully pass theological tests.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize">
                  Leader: {user.name} ({user.role})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5">
              {/* Left Column: Form to qualify a member */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                    <UserIcon size={14} className="text-slate-500" />
                    Qualify / Log Scripture Pass
                  </h4>

                  <form onSubmit={handleSubmitQualification} className="space-y-3.5 text-xs">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Select Church Member</label>
                      <select
                        value={selectedQualMemberId}
                        onChange={(e) => setSelectedQualMemberId(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Member --</option>
                        {(state.members || []).map((m: any) => (
                          <option key={m.id} value={m.id}>
                            {m.name} (Current: {m.spiritualGrowthLevel || "Visitor"})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Stage to Qualify</label>
                      <select
                        value={selectedQualStage}
                        onChange={(e) => setSelectedQualStage(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold cursor-pointer"
                        required
                      >
                        {PATHWAY_STAGES.filter(stg => stg.id !== "visitor").map((stg) => (
                          <option key={stg.id} value={stg.id}>
                            {stg.label} (Requires {stg.xpNeeded} XP)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmittingQual}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{isSubmittingQual ? "Submitting..." : ["pastor", "admin"].includes(user.role) ? "Approve & Submit Pass" : "Log Pass & Submit to Pastor"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Pipeline table */}
              <div className="lg:col-span-7 space-y-4">
                {/* Pastor bulk sign off action banner */}
                {["pastor", "admin"].includes(user.role) && qualifications.some(q => q.status === "pending_pastor") && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-amber-950 flex items-center gap-1">
                        👑 Pastor's Seal & Signature Awaiting
                      </h4>
                      <p className="text-[10px] text-amber-800 font-semibold">
                        There are {qualifications.filter(q => q.status === "pending_pastor").length} passed candidates submitted by deacons/elders awaiting your sign off.
                      </p>
                    </div>
                    <button
                      onClick={handleApproveAllQualifications}
                      disabled={isApprovingAllQual}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-3 py-2 rounded-lg shadow-sm shrink-0 transition-colors cursor-pointer"
                    >
                      {isApprovingAllQual ? "Signing..." : `Approve & Sign Off All (${qualifications.filter(q => q.status === "pending_pastor").length})`}
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">Candidate</th>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Submitted By</th>
                        <th className="px-3 py-2">Status</th>
                        {["pastor", "admin"].includes(user.role) && <th className="px-3 py-2 text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {qualifications.length === 0 ? (
                        <tr>
                          <td colSpan={["pastor", "admin"].includes(user.role) ? 5 : 4} className="px-3 py-6 text-center text-slate-400 italic font-semibold">
                            No discipleship qualifications logged yet in Scripture Academy.
                          </td>
                        </tr>
                      ) : (
                        [...qualifications].reverse().map((q) => {
                          const isPending = q.status === "pending_pastor";
                          return (
                            <tr key={q.id} className="hover:bg-slate-50">
                              <td className="px-3 py-2 font-bold text-slate-800">{q.memberName}</td>
                              <td className="px-3 py-2">
                                <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                                  {q.stageLabel}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-500 capitalize">{q.submittedBy} ({q.submittedRole})</td>
                              <td className="px-3 py-2">
                                {isPending ? (
                                  <span className="text-amber-600 font-black flex items-center gap-1">
                                    ⏳ Pending Pastor
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-black flex items-center gap-1" title={`Approved by ${q.approvedBy}`}>
                                    ✅ Signed Off
                                  </span>
                                )}
                              </td>
                              {["pastor", "admin"].includes(user.role) && (
                                <td className="px-3 py-2 text-right">
                                  {isPending && (
                                    <button
                                      onClick={() => handleApproveSingleQualification(q.id)}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer"
                                    >
                                      Sign Off
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories and create buttons */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-2">
          <div className="flex flex-wrap gap-2.5">
            {["all", "class", "fellowship", "my_transcripts"].map((cat) => (
              <button
                key={cat}
                onClick={() => setGroupCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize cursor-pointer transition-all ${
                  groupCategory === cat 
                    ? "bg-slate-900 text-white shadow-sm" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {cat === "all" 
                  ? "All Communities" 
                  : cat === "class" 
                  ? "Academy Classes" 
                  : cat === "fellowship" 
                  ? "Fellowship Groups" 
                  : "🎓 My Transcripts & Certificates"}
              </button>
            ))}
          </div>

          {isLeader && (
            <button
              onClick={() => {
                setCreateGroup((prev) => ({ ...prev, leader: user.name }));
                setShowCreateModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus size={14} />
              <span>Launch New Group</span>
            </button>
          )}
        </div>

        {/* Groups Grid or Transcripts list */}
        {groupCategory === "my_transcripts" ? (
          renderMemberTranscripts()
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((g) => {
              const isMember = g.memberNames?.includes(user.name) || false;
              const isAssignedLeader = g.leader === user.name;
              const hasAccess = isMember || isAssignedLeader || isLeader;

              return (
                <div 
                  key={g.id} 
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        g.name.toLowerCase().includes("class") || g.leader.toLowerCase().includes("teacher")
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}>
                        {g.name.toLowerCase().includes("class") || g.leader.toLowerCase().includes("teacher") ? "Academy Course" : "Connection Fellowship"}
                      </span>
                      <span className="text-slate-400 font-mono text-[10px] flex items-center gap-1">
                        <Users size={12} />
                        {g.members} members
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-800 text-sm hover:text-blue-600 cursor-pointer" onClick={() => hasAccess ? setActiveGroup(g) : null}>
                        {g.name}
                      </h3>
                      <p className="text-slate-400 text-[10px] mt-1 font-semibold flex items-center gap-1.5">
                        <Clock size={11} />
                        Every {g.day} at {g.time}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5 font-semibold flex items-center gap-1.5">
                        <MapPin size={11} />
                        {g.location}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                      <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        {initials(g.leader)}
                      </div>
                      <span>Shepherd: <strong className="text-slate-700 font-extrabold">{g.leader}</strong></span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-150 flex items-center gap-2">
                    {hasAccess ? (
                      <button
                        onClick={() => {
                          setActiveGroup(g);
                          setActiveTab("bulletins");
                        }}
                        className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-1.5 rounded-lg transition-colors cursor-pointer text-center"
                      >
                        Enter Study Workspace
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(g)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 rounded-lg transition-all cursor-pointer text-center"
                      >
                        Join Fellowship
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="col-span-full py-10 text-center text-slate-400 text-xs italic">
                No matching connection groups or discipleship modules active currently.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render comparative translations for active scripture
  const renderScripturePopup = () => {
    if (!activeScripture) return null;
    const translations = SCRIPTURES_DATABASE[activeScripture] || {
      NIV: "Scripture lookup simulated. Add GEMINI_API_KEY to search or pull real-time Comparative Bible Verses.",
      ESV: "Scripture comparative view offline.",
      KJV: "Comparative database offline.",
      AMP: "Amplified comparative translation offline."
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl overflow-hidden border border-slate-200">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-yellow-400" />
              <h3 className="font-extrabold text-sm">{activeScripture} Comparative Translations</h3>
            </div>
            <button onClick={() => setActiveScripture(null)} className="text-white hover:text-slate-200 font-bold text-xs">✕ Close</button>
          </div>
          <div className="p-5 space-y-4 max-h-[400px] overflow-y-auto">
            {Object.entries(translations).map(([translation, text]) => (
              <div key={translation} className="space-y-1 pb-3 border-b border-slate-100 last:border-b-0">
                <span className="bg-slate-100 text-slate-700 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {translation} (Comparative Translation)
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-semibold italic">"{text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Main Active Group Workspace View
  const renderGroupWorkspace = () => {
    if (!activeGroup) return null;

    const isAcademy = activeGroup && (activeGroup.type === "class" || activeGroup.name.toLowerCase().includes("class") || activeGroup.leader.toLowerCase().includes("teacher"));
    const certificatesEnabled = activeGroup?.certificateEnabled !== false;

    // Filter relevant messages (group channel)
    const messages = (state.messages || []).filter(m => m.groupId === activeGroup.id);

    const isMemberOfGroup = activeGroup.memberNames?.includes(user.name) || false;

    return (
      <div className="space-y-6">
        {/* Workspace Back Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveGroup(null);
                setSelectedLesson(null);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-800">{activeGroup.name}</h2>
                <span className="bg-indigo-100 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase">
                  Workspace Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Supervised by Shepard <strong>{activeGroup.leader}</strong> & Pastor Benson Nyirenda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddPersonModal(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UserPlus size={13} />
              <span>Connect Member</span>
            </button>
          </div>
        </div>

        {/* Join Group Fellowship Banner */}
        {!isMemberOfGroup && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-800 font-semibold shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🤝</span>
              <div>
                <p className="font-extrabold text-indigo-950">You are viewing this group workspace as {user.role === "pastor" ? "Pastor" : "Leader"}.</p>
                <p className="text-[11px] text-indigo-600 font-medium">Join this group to participate in discussions, appear on the connection roster, and take academy quizzes!</p>
              </div>
            </div>
            <button
              onClick={() => handleJoinGroup(activeGroup)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] shrink-0 self-start sm:self-auto shadow-sm cursor-pointer transition-colors"
            >
              Join Group Fellowship
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          {[
            { id: "academy", label: "Scripture Academy", icon: GraduationCap },
            { id: "live-session", label: "Live Classes", icon: Play },
            { id: "chat", label: "Discussion Rooms", icon: MessageSquare },
            { id: "bulletins", label: "Bulletin Board", icon: FileText },
            { id: "prayer-circle", label: "Prayer Circle", icon: Heart },
            ...(isLeader ? [{ id: "reports", label: "Shepherding & Log", icon: Clock }] : [])
          ].map(tb => {
            const Icon = tb.icon;
            const isSel = activeTab === tb.id;
            return (
              <button
                key={tb.id}
                onClick={() => setActiveTab(tb.id)}
                className={`py-2 px-3 border-b-2 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  isSel ? "border-slate-800 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={14} />
                <span>{tb.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Bulletin Board */}
        {activeTab === "bulletins" && (
          <div className="space-y-5">
            {isLeader && (
              <form onSubmit={handlePostBulletin} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-slate-800 text-xs">Pin Announcement to Bulletin Board</h4>
                <textarea
                  required
                  rows={2}
                  placeholder="Share a word, study assignment, or scheduling alert for this group..."
                  value={newBulletinText}
                  onChange={e => setNewBulletinText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-medium"
                ></textarea>
                <div className="flex justify-end">
                  <button type="submit" className="bg-slate-900 hover:bg-black text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
                    <Send size={12} />
                    <span>Post to Board</span>
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {(activeGroup.bulletins || []).length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs italic">
                  No bulletins posted on this connection group's notice board yet.
                </div>
              ) : (
                (activeGroup.bulletins || []).map(b => (
                  <div key={b.id} className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 shadow-sm relative space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-5 h-5 rounded-full bg-amber-200 flex items-center justify-center font-bold text-amber-800 text-[9px]">
                          {initials(b.author)}
                        </div>
                        <span className="font-extrabold text-slate-700">{b.author}</span>
                        <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-1.5 rounded">Leader Bulletin</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-slate-400 font-mono">{b.date}</span>
                        {(user.role === "pastor" || user.role === "admin") && (
                          <button
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this bulletin?")) return;
                              try {
                                const res = await fetch(`/api/groups/${activeGroup.id}/bulletins/${b.id}?role=${user.role}&userName=${encodeURIComponent(user.name)}`, {
                                  method: "DELETE"
                                });
                                const data = await res.json();
                                if (data.success) {
                                  if (data.pendingApproval) {
                                    onToast("Deletion request has been submitted to Lead Pastor for certification.");
                                  } else {
                                    onToast("Bulletin successfully deleted.");
                                  }
                                  onRefresh();
                                }
                              } catch (err) {
                                onToast("Error deleting bulletin.");
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 transition-colors rounded hover:bg-red-50"
                            title="Delete Bulletin"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold whitespace-pre-wrap">{b.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Community Chat */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5 h-[480px]">
            {/* Channels List */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-extrabold text-[10px] text-slate-500 uppercase tracking-wider">
                Study Channels
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {["#general", "#prayer-circle", "#bible-questions", "#leader-lounge"].map(ch => {
                  const isLeaderOnly = ch === "#leader-lounge";
                  if (isLeaderOnly && !isLeader) return null;
                  const isSel = activeChannel === ch;
                  return (
                    <div
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`p-3 text-xs font-bold flex justify-between items-center cursor-pointer transition-colors ${
                        isSel ? "bg-indigo-50/50 border-l-4 border-l-indigo-600 text-indigo-900" : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <span>{ch}</span>
                      {isLeaderOnly && <span className="text-[8px] bg-red-100 text-red-700 px-1 rounded">Private</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Logs */}
            <div className="md:col-span-3 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden justify-between">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">{activeChannel} Thread</span>
                <span className="text-[10px] text-slate-400 font-semibold">End-to-End Encrypted Group Chat</span>
              </div>

              {/* Message scroll container */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 flex flex-col-reverse">
                {messages
                  .filter(m => {
                    if (activeChannel === "#general") return !m.content?.includes(":");
                    return m.content?.startsWith(`${activeChannel}:`);
                  })
                  .map(msg => {
                    const isSelf = msg.from === user.name;
                    const cleanContent = msg.content?.includes(":") ? msg.content.substring(msg.content.indexOf(":") + 1).trim() : msg.content;
                    return (
                      <div key={msg.id} className={`flex gap-2 max-w-[80%] ${isSelf ? "self-end flex-row-reverse" : "self-start"}`}>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[9px] shrink-0" style={{ backgroundColor: avatarBg(msg.from) }}>
                          {initials(msg.from)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="font-extrabold text-slate-700">{msg.from}</span>
                            <span className="text-slate-400 font-mono">{msg.time}</span>
                          </div>
                          <div className={`p-2.5 rounded-xl text-xs font-semibold leading-relaxed ${
                            isSelf ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                          }`}>
                            {cleanContent}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {messages.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic space-y-2 py-10">
                    <MessageSquare size={32} />
                    <p className="text-[11px]">No fellowship chat logs recorded here yet.</p>
                  </div>
                )}
              </div>

              {/* Chat Send */}
              <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  required
                  placeholder={`Send msg to ${activeChannel}...`}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                  Send
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Scripture Academy & Discipleship Course */}
        {activeTab === "academy" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Course Index */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-900 text-white font-extrabold text-xs flex items-center justify-between">
                  <span>Academy Core Syllabus</span>
                  <BookOpen size={14} className="text-indigo-400" />
                </div>
                <div className="divide-y divide-slate-100">
                  {(() => {
                    const isPreloaded = activeGroup && (activeGroup.id === "1783420856423" || activeGroup.id === "1783422112044");
                    const groupLessons = isPreloaded ? [...SEED_LESSONS, ...(activeGroup.lessons || [])] : (activeGroup.lessons || []);
                    return groupLessons.map((les, index) => {
                      const isCompleted = userProgress.completedLessons.includes(les.id);
                      const isSelected = selectedLesson?.id === les.id;
                      const isLocked = index > 0 && !userProgress.completedLessons.includes(groupLessons[index - 1]?.id);

                      return (
                        <div
                          key={les.id}
                          onClick={() => {
                            if (!isLocked) {
                              setSelectedLesson(les);
                              setNotebookInput(userProgress.notebookNotes[les.id] || "");
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                            }
                          }}
                          className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-all ${
                            isLocked ? "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed" : isSelected ? "bg-indigo-50/40 text-indigo-900 font-bold border-l-4 border-l-indigo-600" : "hover:bg-slate-50 text-slate-700 font-semibold"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isLocked ? <Lock size={12} className="text-slate-400 shrink-0" /> : isCompleted ? <CheckCircle size={13} className="text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"></div>}
                            <span className="truncate">{les.title}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCompleted && <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded font-bold uppercase">Passed</span>}
                            {/* Delete custom lesson */}
                            {(user.role === "pastor" || user.role === "admin") && !SEED_LESSONS.some(sl => sl.id === les.id) && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation(); // prevent selecting the lesson when deleting
                                  if (!window.confirm("Are you sure you want to delete this custom lesson?")) return;
                                  try {
                                    const res = await fetch(`/api/groups/${activeGroup.id}/lessons/${les.id}?role=${user.role}&userName=${encodeURIComponent(user.name)}`, {
                                      method: "DELETE"
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      if (data.pendingApproval) {
                                        onToast("Deletion request has been submitted to Lead Pastor for certification.");
                                      } else {
                                        onToast("Custom lesson successfully deleted.");
                                        if (selectedLesson?.id === les.id) {
                                          setSelectedLesson(null);
                                        }
                                      }
                                      onRefresh();
                                    }
                                  } catch (err) {
                                    onToast("Error deleting lesson.");
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 transition-colors"
                                title="Delete Lesson"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Create Custom Lesson & Quiz Button */}
              {isLeader && (
                <button
                  onClick={() => setShowLessonBuilder(true)}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-slate-800 transition-colors"
                >
                  <PlusCircle size={14} className="text-indigo-400" />
                  <span>Create Lesson & Quiz</span>
                </button>
              )}

              {/* Teacher's AI Tools */}
              {isLeadPastor && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                    <span>AI Discipleship Lesson Generator</span>
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-relaxed font-semibold">
                    Input a study topic below to let Gemini instantly draft a study outline, memory verses, discussion questions, and an auto-graded quiz.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="e.g., Financial Stewardship, Forgiveness"
                      value={aiTopic}
                      onChange={e => setAiTopic(e.target.value)}
                      className="w-full bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 font-semibold"
                    />
                    <button
                      onClick={handleGenerateLesson}
                      disabled={aiGenerating || !aiTopic.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {aiGenerating ? <Clock size={12} className="animate-spin" /> : <Sparkles size={12} />}
                      <span>{aiGenerating ? "Generating..." : "Generate Lesson outline"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right side: Lesson details and interaction */}
            <div className="lg:col-span-8 space-y-6">
              {generatedLesson && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-900 text-xs flex items-center gap-1">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>Draft: {generatedLesson.title}</span>
                    </h4>
                    <div className="flex gap-2">
                      <button onClick={() => setGeneratedLesson(null)} className="text-xs text-slate-500 hover:text-slate-700 font-bold">Discard</button>
                      <button onClick={handlePublishLesson} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded">Publish Syllabus</button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-700 font-medium space-y-2 max-h-[150px] overflow-y-auto">
                    <p className="italic font-semibold">"{generatedLesson.introduction}"</p>
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 mt-1">{generatedLesson.notes}</pre>
                  </div>
                </div>
              )}

              {selectedLesson ? (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {/* Lesson Heading banner */}
                  <div className="bg-slate-900 p-4 text-white">
                    <span className="bg-indigo-500 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider">
                      Academy Lecture Series
                    </span>
                    <h3 className="text-sm font-bold mt-1.5">{selectedLesson.title}</h3>
                  </div>

                  {/* Simulated video lecture player */}
                  <div className="bg-slate-950 aspect-video relative flex items-center justify-center text-white overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10"></div>
                    <div className="z-20 text-center space-y-2">
                      <button onClick={() => setLivePlaying(!livePlaying)} className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center shadow-lg transition-transform cursor-pointer">
                        {livePlaying ? <Pause size={20} className="fill-white" /> : <Play size={20} className="fill-white ml-1" />}
                      </button>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        {livePlaying ? "Streaming Lecture Video" : "Click to Stream Discipleship Video Lesson"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {/* Notes Section */}
                    <div className="space-y-2.5">
                      <h4 className="font-extrabold text-slate-800 text-xs border-b pb-1">Study Guide & Sermon Notes</h4>
                      <p className="text-slate-600 text-xs leading-relaxed font-semibold italic">"{selectedLesson.introduction}"</p>
                      
                      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl leading-relaxed text-xs text-slate-800 space-y-3 font-semibold">
                        <pre className="whitespace-pre-wrap font-sans text-slate-700">{selectedLesson.notes}</pre>
                      </div>
                    </div>

                    {/* SMART BIBLE SCRIPTURE REFERENCES */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <BookOpen size={14} className="text-indigo-600" />
                        <span>Interactive Scripture Popups (NIV, ESV, KJV, AMP Comparison)</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedLesson.scriptures.map((scrip: string) => (
                          <button
                            key={scrip}
                            onClick={() => setActiveScripture(scrip)}
                            className="bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-xs cursor-pointer flex items-center gap-1 transition-all shadow-xs"
                          >
                            <Bookmark size={11} className="text-indigo-500" />
                            <span>{scrip} Comparative View</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Private notepad */}
                    <div className="space-y-2.5 bg-slate-50/50 border border-slate-200 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <FileText size={14} className="text-indigo-600" />
                          <span>My Private Reflection Notebook</span>
                        </h4>
                        <div className="flex gap-2">
                          <button onClick={handleSaveNotebookNotes} className="bg-slate-900 text-white font-bold text-[9px] px-2 py-1 rounded">Save Notes</button>
                          <button onClick={handleDownloadNotes} className="bg-slate-100 text-slate-700 font-bold text-[9px] px-2 py-1 rounded border border-slate-200 flex items-center gap-0.5">
                            <span>Download notes</span>
                          </button>
                        </div>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Write down personal theological questions, spiritual lessons, or reflections on God's word here..."
                        value={notebookInput}
                        onChange={e => setNotebookInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-semibold"
                      ></textarea>
                    </div>

                    {/* Lesson Quiz Panel */}
                    <div className="border border-indigo-150 rounded-2xl p-4 bg-indigo-50/30 space-y-4">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={16} className="text-indigo-600" />
                        <h4 className="font-extrabold text-indigo-900 text-xs">Self-Assessment Academy Quiz</h4>
                      </div>

                      <div className="space-y-4">
                        {selectedLesson.quiz.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="space-y-2 text-xs">
                            <p className="font-extrabold text-slate-800">{qIdx + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {q.options.map((opt: string, optIdx: number) => {
                                const isSelected = quizAnswers[qIdx] === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }))}
                                    className={`text-left p-2.5 rounded-lg border font-semibold transition-all ${
                                      isSelected ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {quizSubmitted && (
                              <div className={`p-2 rounded-lg text-[11px] leading-relaxed font-semibold ${
                                quizAnswers[qIdx] === q.correctIndex ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                              }`}>
                                {quizAnswers[qIdx] === q.correctIndex ? "Correct answer! " : "Incorrect. "} {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {!quizSubmitted ? (
                        <button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < selectedLesson.quiz.length}
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer"
                        >
                          Submit Test Answers
                        </button>
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={() => {
                              setQuizSubmitted(false);
                              setQuizAnswers({});
                            }}
                            className="bg-slate-100 hover:bg-slate-250 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2 rounded-lg"
                          >
                            Retake Quiz
                          </button>
                        </div>
                      )}
                    </div>

                    {/* AI STUDY ASSISTANT (Grace-AI inside the workspace!) */}
                    {isLeadPastor && (
                      <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                          <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                          <h4 className="font-extrabold text-xs">Ask Grace-AI (Theological Assistant)</h4>
                        </div>

                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {assistantAnswers.map((item, idx) => (
                            <div key={idx} className="space-y-1 text-xs">
                              <p className="font-bold text-yellow-400">Q: {item.q}</p>
                              <p className="text-slate-300 leading-relaxed font-semibold bg-slate-800/50 p-2.5 rounded-lg border border-slate-800 whitespace-pre-wrap">{item.a}</p>
                            </div>
                          ))}
                          {assistantAnswers.length === 0 && (
                            <p className="text-slate-400 text-[10px] italic">
                              Have questions about this chapter's Greek origins or theological implications? Type below to consult Grace-AI!
                            </p>
                          )}
                          {assistantLoading && (
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                              <Clock size={12} className="animate-spin" />
                              <span>Grace-AI is diving into scriptures...</span>
                            </div>
                          )}
                        </div>

                        <form onSubmit={handleAskAssistant} className="flex gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Ask Grace-AI (e.g. Explain Romans 8:1 greek word)"
                            value={assistantInput}
                            onChange={e => setAssistantInput(e.target.value)}
                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-semibold"
                          />
                          <button type="submit" disabled={assistantLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg">
                            Ask AI
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl py-14 text-center text-slate-400 italic text-xs space-y-2">
                  <GraduationCap size={40} className="mx-auto text-slate-300" />
                  <p>Select a lesson from the Academy Core Syllabus on the left to begin learning.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Prayer Circle */}
        {activeTab === "prayer-circle" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Submit prayer request */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-fit space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Heart size={14} className="text-red-500 fill-red-500" />
                <span>Submit Group Prayer Request</span>
              </div>
              <form onSubmit={handleAddPrayer} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Category</label>
                  <select
                    value={prayerCategory}
                    onChange={e => setPrayerCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 outline-none cursor-pointer text-xs font-bold"
                  >
                    <option value="Health">Physical Health</option>
                    <option value="Family">Family Unity</option>
                    <option value="Guidance">Guidance & Wisdom</option>
                    <option value="Finances">Financial Restoration</option>
                    <option value="Faith">Spiritual Renewal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Your Request</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your request..."
                    value={prayerRequestInput}
                    onChange={e => setPrayerRequestInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 font-semibold"
                  ></textarea>
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-1.5 rounded-lg transition-colors cursor-pointer">
                  Raise in Prayer Circle
                </button>
              </form>
            </div>

            {/* Prayer Feed */}
            <div className="lg:col-span-8 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Active Prayer Circle Feed</h4>
              <div className="space-y-4">
                {groupPrayers.map(p => {
                  const hasJoined = p.prayingUsers.includes(user.name);
                  return (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden">
                      {p.answered && (
                        <span className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-extrabold uppercase px-3 py-1 rounded-bl-lg">
                          Answered Prayer!
                        </span>
                      )}

                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2 py-0.5 rounded-full font-bold">
                          {p.category} Request
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.date}</span>
                      </div>

                      <p className="text-xs text-slate-800 font-semibold leading-relaxed">"{p.request}"</p>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 justify-between">
                        <button
                          onClick={() => handleIntercede(p.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                            hasJoined ? "bg-red-50 text-red-600 border border-red-150" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                          }`}
                        >
                          <Heart size={11} className={hasJoined ? "fill-red-500 text-red-500" : ""} />
                          <span>{hasJoined ? "Interceding" : "Agree in Prayer"} ({p.prayingCount})</span>
                        </button>

                        {!p.answered && p.member === user.name && (
                          <button
                            onClick={() => handleAnswerPrayer(p.id)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 font-bold text-[10px] px-2 py-1 rounded-lg"
                          >
                            Mark Answered
                          </button>
                        )}
                      </div>

                      {/* Encouragements section */}
                      <div className="bg-slate-50 rounded-lg p-2.5 space-y-2 mt-2">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Words of Encouragement</div>
                        <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                          {p.encouragements.map((enc: any, eIdx: number) => (
                            <p key={eIdx} className="text-[11px] text-slate-700 font-semibold italic">
                              <strong>{enc.author}</strong>: "{enc.content}"
                            </p>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="Type encouraging scripture..."
                            value={encouragementInput[p.id] || ""}
                            onChange={e => setEncouragementInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-[10px] font-semibold outline-none"
                          />
                          <button onClick={() => handlePostEncouragement(p.id)} className="bg-slate-900 text-white font-bold text-[9px] px-2 py-1 rounded">
                            Send
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Live classes */}
        {activeTab === "live-session" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-slate-950 aspect-video rounded-xl relative overflow-hidden border border-slate-800 flex flex-col items-center justify-center text-white shadow-xl">
                <div className="absolute top-0 left-0 p-4 bg-red-600 font-extrabold text-[9px] uppercase tracking-widest rounded-br-lg animate-pulse z-10 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <span>🔴 LIVE STREAM</span>
                </div>

                {activeGroup?.liveStreamLink && (activeGroup.liveStreamLink.includes("youtube.com") || activeGroup.liveStreamLink.includes("youtu.be")) ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      activeGroup.liveStreamLink.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)?.[2] || ""
                    }`}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="text-center space-y-3 p-6 z-10">
                    <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/30 animate-pulse">
                      <GraduationCap size={36} className="text-indigo-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm">Active Interactive Live Stream Session</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {activeGroup?.name || "Discipleship Academy"} class stream link is configured below
                      </p>
                    </div>
                    {activeGroup?.liveStreamLink ? (
                      <div className="pt-2">
                        <a
                          href={activeGroup.liveStreamLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full transition-colors cursor-pointer shadow-lg shadow-indigo-500/20"
                        >
                          Join Interactive Video Feed <ExternalLink size={12} />
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic max-w-md mx-auto">
                        No custom live stream link set yet. Leaders can configure a YouTube live stream or virtual meeting link below.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Floating control buttons under player */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
                <div className="space-y-1">
                  <h5 className="font-extrabold text-xs text-indigo-400 uppercase tracking-wider">Multi-tasking & Background Play</h5>
                  <p className="text-[11px] text-slate-400">
                    Minimize this live session stream into a floating Picture-in-Picture window so you can navigate the rest of the application while watching!
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (onFloatVideo) {
                      onFloatVideo(
                        activeGroup?.liveStreamLink || "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                        `${activeGroup?.name || "Academy"} Live Class`
                      );
                      onToast("📺 Live stream popped out into floating window! Feel free to browse around.");
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 shrink-0 self-start md:self-auto"
                >
                  <Tv size={14} />
                  <span>📺 Picture-in-Picture (Float Player)</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-5">
              {/* Virtual Hand Raiser */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Virtual Classroom Roster</h4>
                <button
                  onClick={() => {
                    if (handsRaised.includes(user.name)) {
                      setHandsRaised(prev => prev.filter(n => n !== user.name));
                    } else {
                      setHandsRaised(prev => [...prev, user.name]);
                    }
                  }}
                  className={`w-full font-bold text-xs py-1.5 rounded-lg border transition-all cursor-pointer text-center ${
                    handsRaised.includes(user.name) ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                  }`}
                >
                  {handsRaised.includes(user.name) ? "🤚 Lower Virtual Hand" : "🤚 Raise Hand for Q&A"}
                </button>
                <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  Raised hands: <strong className="text-slate-700 font-extrabold">{handsRaised.length > 0 ? handsRaised.join(", ") : "None"}</strong>
                </div>
              </div>

              {/* Push live poll */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 shadow-sm space-y-3">
                <h4 className="font-extrabold text-indigo-950 text-xs uppercase tracking-wider">Live Classroom Poll</h4>
                <p className="text-xs font-bold text-slate-800">{activePoll.question}</p>
                <div className="space-y-2">
                  {activePoll.options.map((opt, idx) => {
                    const totalVotes = activePoll.votes.reduce((a, b) => a + b, 0);
                    const percent = totalVotes > 0 ? Math.round((activePoll.votes[idx] / totalVotes) * 100) : 0;
                    return (
                      <button
                        key={opt}
                        disabled={userVoted}
                        onClick={() => handleVotePoll(idx)}
                        className="w-full text-left p-2 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-semibold relative overflow-hidden transition-all flex justify-between items-center"
                      >
                        <div className="absolute top-0 left-0 bg-indigo-100/60 h-full transition-all duration-500" style={{ width: `${percent}%`, zIndex: 1 }}></div>
                        <span className="relative z-10 text-slate-800 font-bold">{opt}</span>
                        <span className="relative z-10 text-slate-500 font-mono text-[10px]">{percent}% ({activePoll.votes[idx]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Leader Livestream Link Configurator (Visible to leaders/pastors only) */}
              {isLeader && activeGroup && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white space-y-3 shadow-lg">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-indigo-400 text-xs uppercase tracking-wider">⚙️ Group Live Join Link</h4>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      Provide a live YouTube video link or virtual meeting join URL (Zoom, Google Meet, MS Teams, etc.) for group members.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="https://youtube.com/live/your-id or https://meet.google.com/..."
                      value={tempLiveLink}
                      onChange={(e) => setTempLiveLink(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={async () => {
                        if (!activeGroup) return;
                        setIsUpdatingLink(true);
                        try {
                          const res = await fetch(`/api/groups/${activeGroup.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ liveStreamLink: tempLiveLink })
                          });
                          const data = await res.json();
                          if (data.success) {
                            onToast("Group Livestream Join Link updated!");
                            setActiveGroup(prev => prev ? { ...prev, liveStreamLink: tempLiveLink } : null);
                            onRefresh();
                          } else {
                            onToast(data.message || "Failed to update stream link.");
                          }
                        } catch (err) {
                          onToast("Error saving livestream link.");
                        } finally {
                          setIsUpdatingLink(false);
                        }
                      }}
                      disabled={isUpdatingLink}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center block"
                    >
                      {isUpdatingLink ? "Saving..." : "Save & Update Live Link"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Shepherding log & Attendance logging (Visible to Leaders, Pastors, Admins only!) */}
        {activeTab === "reports" && isLeader && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Attendance Entry Form */}
            <form onSubmit={handleAttendanceFormSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 border-b pb-1">
                <Calendar size={14} className="text-indigo-600" />
                <span>Quick Log Meeting Attendance</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Meeting Date</label>
                  <input
                    type="date"
                    required
                    value={attendanceForm.date}
                    onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Category Level</label>
                  <select
                    value={attendanceForm.level}
                    onChange={e => setAttendanceForm({ ...attendanceForm, level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="Mixed">Mixed Congregation</option>
                    <option value="Youths">Youth Ministry</option>
                    <option value="Elders">Elders Council</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Male Attendance</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={attendanceForm.male}
                    onChange={e => setAttendanceForm({ ...attendanceForm, male: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Female Attendance</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={attendanceForm.female}
                    onChange={e => setAttendanceForm({ ...attendanceForm, female: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Kids Attendance</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={attendanceForm.kids}
                    onChange={e => setAttendanceForm({ ...attendanceForm, kids: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Shepherding Notes / Prayer Points Raised</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Study topic went very deep. Sister Winnie requested family healing prayer..."
                  value={attendanceForm.notes}
                  onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:border-indigo-500 font-semibold"
                ></textarea>
              </div>

              <button type="submit" className="w-full bg-slate-950 hover:bg-black text-white font-bold text-xs py-2 rounded-lg transition-colors cursor-pointer">
                Submit Attendance Log
              </button>
            </form>

            <div className="space-y-6">
              {isAcademy && certificatesEnabled ? (
                <>
                  {/* Student Progress Index (Graduation control) */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <GraduationCap size={15} className="text-emerald-600" />
                        <span>Scripture Academy - Students Index & Graduation Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {setCurrentView && ["pastor", "admin"].includes(user.role) && (
                          <button
                            onClick={() => setCurrentView("certificates")}
                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md border border-indigo-100/60 transition-colors cursor-pointer"
                          >
                            Central Registry →
                          </button>
                        )}
                        <div className="text-[10px] text-slate-400 font-semibold bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          Class Course Cohort
                        </div>
                      </div>
                    </div>

                    {/* Academy Stats Summary */}
                    {(() => {
                      const studentsList = (state.members || []).filter(mem => {
                        if (mem.role === "pastor" || mem.name === activeGroup?.leader) return false;
                        if (activeGroup?.memberNames && activeGroup.memberNames.length > 0) {
                          return activeGroup.memberNames.includes(mem.name);
                        }
                        return false; // Remove default fallback names
                      });

                      const getCompletedCount = (name: string) => {
                        if (name === user.name) {
                          return userProgress.completedLessons.length;
                        }
                        if (activeGroup?.studentProgress?.[name]?.completedLessons) {
                          return activeGroup.studentProgress[name].completedLessons.length;
                        }
                        return 0;
                      };

                      const isPreloaded = activeGroup && (activeGroup.id === "1783420856423" || activeGroup.id === "1783422112044");
                      const totalClassLessons = (isPreloaded ? SEED_LESSONS.length : 0) + (activeGroup?.lessons || []).length;
                      const graduates = totalClassLessons > 0 ? studentsList.filter(s => getCompletedCount(s.name) >= totalClassLessons) : [];
                      const studying = totalClassLessons > 0 ? studentsList.filter(s => getCompletedCount(s.name) < totalClassLessons) : studentsList;

                      const approvedGraduates = graduates.filter(g => {
                        const progress = activeGroup?.studentProgress?.[g.name];
                        return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                      });
                      const approvedGraduateNames = approvedGraduates.map(g => g.name);

                      const approvedSelectedCount = selectedGroupStudents.filter(name => {
                        const progress = activeGroup?.studentProgress?.[name];
                        return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                      }).length;

                      const handleToggleSelectAll = () => {
                        const allSelected = approvedGraduateNames.length > 0 && approvedGraduateNames.every(name => selectedGroupStudents.includes(name));
                        if (allSelected) {
                          setSelectedGroupStudents(prev => prev.filter(name => !approvedGraduateNames.includes(name)));
                        } else {
                          const toAdd = approvedGraduateNames.filter(name => !selectedGroupStudents.includes(name));
                          setSelectedGroupStudents(prev => [...prev, ...toAdd]);
                        }
                      };

                      const handleBatchDownload = () => {
                        if (selectedGroupStudents.length === 0) {
                          onToast("Please select at least one student first.");
                          return;
                        }
                        const approvedTargets = selectedGroupStudents.filter(name => {
                          const progress = activeGroup?.studentProgress?.[name];
                          return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                        });
                        if (approvedTargets.length === 0) {
                          onToast("None of the selected students have approved/certified certificates.");
                          return;
                        }
                        onToast(`Generating ${approvedTargets.length} approved PDF Certificate(s)...`);
                        approvedTargets.forEach((studentName, i) => {
                          setTimeout(() => {
                            handleDownloadCertificate(studentName);
                          }, i * 600); // Stagger downloads slightly to prevent browser blocking
                        });
                      };

                      const handleBatchPrint = () => {
                        if (selectedGroupStudents.length === 0) {
                          onToast("Please select at least one student first.");
                          return;
                        }
                        const approvedTargets = selectedGroupStudents.filter(name => {
                          const progress = activeGroup?.studentProgress?.[name];
                          return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                        });
                        if (approvedTargets.length === 0) {
                          onToast("None of the selected students have approved/certified certificates.");
                          return;
                        }
                        onToast(`Preparing ${approvedTargets.length} certified diplomas for printing... Launching system spooler.`);
                        window.print();
                      };

                      const isAllGraduatesSelected = approvedGraduateNames.length > 0 && approvedGraduateNames.every(name => selectedGroupStudents.includes(name));

                      return (
                        <div className="space-y-4">
                          {/* Pastor Summary Stats */}
                          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-center p-1.5">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Class</p>
                              <p className="text-base font-extrabold text-slate-800 mt-0.5">{studentsList.length}</p>
                            </div>
                            <div className="text-center p-1.5 border-x border-slate-150">
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Passed (Grads)</p>
                              <p className="text-base font-extrabold text-emerald-600 mt-0.5">{graduates.length}</p>
                            </div>
                            <div className="text-center p-1.5">
                              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Studying</p>
                              <p className="text-base font-extrabold text-amber-600 mt-0.5">{studying.length}</p>
                            </div>
                          </div>

                          {/* Selection Checkbox Panel for Pastors */}
                          {user.role === "pastor" && approvedGraduates.length > 0 && (
                            <div className="flex items-center justify-between bg-indigo-50/40 border border-indigo-100/60 p-2.5 rounded-lg text-[11px] font-bold">
                              <label className="flex items-center gap-2 text-indigo-950 cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  checked={isAllGraduatesSelected}
                                  onChange={handleToggleSelectAll}
                                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span>Select All {approvedGraduates.length} Certified Graduates</span>
                              </label>

                              {selectedGroupStudents.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleBatchPrint}
                                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-extrabold px-2 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Printer size={10} />
                                    <span>Print ({approvedSelectedCount})</span>
                                  </button>
                                  <button
                                    onClick={handleBatchDownload}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold px-2 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                  >
                                    <Download size={10} />
                                    <span>Download PDF ({approvedSelectedCount})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* List of Students */}
                          <div className="space-y-2.5">
                            {studentsList.map(mem => {
                              const completedCount = getCompletedCount(mem.name);
                              const isGraduate = completedCount >= totalClassLessons;
                              const isSelected = selectedGroupStudents.includes(mem.name);

                              return (
                                <div key={mem.id} className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold border transition-all ${isSelected ? 'bg-indigo-50/20 border-indigo-100 shadow-xs' : 'bg-slate-50 border-transparent'}`}>
                                  <div className="flex items-center gap-2.5">
                                    {user.role === "pastor" && isGraduate ? (() => {
                                      const memProgress = activeGroup?.studentProgress?.[mem.name];
                                      const memCertStatus = memProgress?.certificateStatus || "Pending";
                                      const memIsCertified = memCertStatus === "Approved" || memCertStatus === "Printed";
                                      return (
                                        <input 
                                          type="checkbox" 
                                          disabled={!memIsCertified}
                                          checked={isSelected}
                                          onChange={() => {
                                            if (isSelected) {
                                              setSelectedGroupStudents(prev => prev.filter(name => name !== mem.name));
                                            } else {
                                              setSelectedGroupStudents(prev => [...prev, mem.name]);
                                            }
                                          }}
                                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                          title={memIsCertified ? "Select for batch action" : "Awaiting approval in Central Registry"}
                                        />
                                      );
                                    })() : user.role === "pastor" ? (
                                      <div className="w-3.5 h-3.5 border border-dashed border-slate-300 rounded" title="Not yet completed lessons" />
                                    ) : null}

                                    <div className="flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[9px] text-indigo-800">
                                        {initials(mem.name)}
                                      </div>
                                      <div>
                                        <p className="text-slate-800 font-extrabold">{mem.name}</p>
                                        <p className="text-[9px] text-slate-400">Class: Foundation Studies</p>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500">
                                      {completedCount}/{totalClassLessons} modules completed
                                    </span>
                                    {isGraduate ? (() => {
                                      const memProgress = activeGroup?.studentProgress?.[mem.name];
                                      const memCertStatus = memProgress?.certificateStatus || "Pending";
                                      const memIsCertified = memCertStatus === "Approved" || memCertStatus === "Printed";
                                      return (
                                        <div className="flex items-center gap-1.5">
                                          <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
                                            <Check size={9} />
                                            {memIsCertified ? "Certified" : "Graduate"}
                                          </span>
                                          {user.role === "pastor" && !memIsCertified && (
                                            <button
                                              onClick={() => handleApproveCertificate(mem.name)}
                                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                              title="Click to Approve & Certify this graduate"
                                            >
                                              <CheckCircle size={9} />
                                              <span>Approve</span>
                                            </button>
                                          )}
                                          <button
                                            onClick={() => {
                                              setShowCertificateStudentName(mem.name);
                                            }}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                            title="View & Download Certificate"
                                          >
                                            <Award size={9} />
                                            <span>Certificate</span>
                                          </button>
                                        </div>
                                      );
                                    })() : (
                                      <span className="bg-amber-100 text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded uppercase">
                                        Studying
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Certificate Sign-off Configurator (Pastors Only) */}
                  {user.role === "pastor" && (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 border border-indigo-100 rounded-xl p-4 space-y-3 pt-4 border-t">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <span>✍️</span>
                          <span>Certificate Sign-off Assignments</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          As a Pastor, you can assign who should sign off on certificates for this course.
                        </p>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Signatory 1 Name</label>
                            <input
                              type="text"
                              value={tempSig1}
                              onChange={e => setTempSig1(e.target.value)}
                              placeholder="Pastor Benson Nyirenda"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Signatory 1 Title</label>
                            <input
                              type="text"
                              value={tempSig1Title}
                              onChange={e => setTempSig1Title(e.target.value)}
                              placeholder="Lead Pastor"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Signatory 2 Name</label>
                            <input
                              type="text"
                              value={tempSig2}
                              onChange={e => setTempSig2(e.target.value)}
                              placeholder="Deaconess Winnie"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Signatory 2 Title</label>
                            <input
                              type="text"
                              value={tempSig2Title}
                              onChange={e => setTempSig2Title(e.target.value)}
                              placeholder="Education Director"
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Certificate Theme Color</label>
                          <select
                            value={tempCertTheme}
                            onChange={e => setTempCertTheme(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="gold">🏆 Premium Gold Theme</option>
                            <option value="blue">🎓 Academic Royal Blue Theme</option>
                            <option value="burgundy">🍷 Prestigious Burgundy Theme</option>
                            <option value="emerald">🌿 Theological Forest Green Theme</option>
                            <option value="purple">👑 Spiritual Anointing Purple Theme</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 py-1.5 bg-slate-50 px-2.5 rounded-lg border border-slate-100">
                          <input
                            type="checkbox"
                            id="allow-member-downloads"
                            checked={tempAllowDownload}
                            onChange={e => setTempAllowDownload(e.target.checked)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                          />
                          <label htmlFor="allow-member-downloads" className="text-[10px] font-bold text-slate-700 cursor-pointer select-none">
                            Allow course members to download their own Certificates
                          </label>
                        </div>

                        <button
                          onClick={handleUpdateSignatories}
                          className="w-full bg-slate-900 hover:bg-black text-white font-bold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer text-center block shadow-sm mt-1"
                        >
                          Save Sign-off & Color Theme Assignments
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Course Status & Publishing Controls (Pastors & Admins Only) */}
                  {isLeader && (
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                          <span>📢</span>
                          <span>Course Status & Publishing Controls</span>
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium leading-normal">
                          Control course visibility for members on dashboards, course pages, and search results.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs">
                        <div className="flex-1">
                          <label className="block text-[8px] font-bold text-slate-500 mb-0.5 uppercase">Visibility Status</label>
                          <select
                            value={tempGroupStatus}
                            onChange={(e) => handleUpdateCourseStatus(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold font-sans cursor-pointer"
                          >
                            <option value="draft">📁 Draft (Hidden)</option>
                            <option value="published">🟢 Published (Visible to members)</option>
                            <option value="unpublished">🔴 Unpublished (Hidden)</option>
                            <option value="archived">📦 Archived (Hidden)</option>
                          </select>
                        </div>
                        
                        <div className="flex items-end">
                          <span className={`text-[9px] font-bold px-2 py-1 rounded uppercase border ${
                            tempGroupStatus === "published"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : tempGroupStatus === "draft"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}>
                            Current: {tempGroupStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Render printable digital graduation certificate if user is a graduate */}
                  {(() => {
                    const isPreloaded = activeGroup && (activeGroup.id === "1783420856423" || activeGroup.id === "1783422112044");
                    const totalRequiredLessons = (isPreloaded ? SEED_LESSONS.length : 0) + (activeGroup.lessons || []).length;
                    return totalRequiredLessons > 0 && userProgress.completedLessons.length >= totalRequiredLessons;
                  })() && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-yellow-800 font-extrabold">
                        <Award size={15} className="text-yellow-600 animate-pulse" />
                        <span>Graduation Certificate Unlocked!</span>
                      </div>
                      <p className="text-[10px] text-yellow-700 font-medium">
                        You have successfully completed all core modules of the scripture course! Click below to view and print your Certificate of Graduation.
                      </p>
                      
                      {/* Digital Certificate design panel with theme support */}
                      {(() => {
                        const certTheme = activeGroup?.certificateTheme || "gold";
                        const themeStyles = {
                          gold: {
                            border: "border-yellow-500",
                            text: "text-yellow-700",
                            name: "text-indigo-950 border-indigo-100",
                            bg: "text-yellow-600",
                            cardBg: "bg-white"
                          },
                          blue: {
                            border: "border-blue-500",
                            text: "text-blue-700",
                            name: "text-blue-950 border-blue-100",
                            bg: "text-blue-600",
                            cardBg: "bg-blue-50/10"
                          },
                          burgundy: {
                            border: "border-red-700",
                            text: "text-red-800",
                            name: "text-red-950 border-red-150",
                            bg: "text-red-600",
                            cardBg: "bg-red-50/10"
                          },
                          emerald: {
                            border: "border-emerald-600",
                            text: "text-emerald-700",
                            name: "text-emerald-950 border-emerald-100",
                            bg: "text-emerald-600",
                            cardBg: "bg-emerald-50/10"
                          },
                          purple: {
                            border: "border-purple-600",
                            text: "text-purple-700",
                            name: "text-purple-950 border-purple-100",
                            bg: "text-purple-600",
                            cardBg: "bg-purple-50/10"
                          }
                        }[certTheme as "gold" | "blue" | "burgundy" | "emerald" | "purple"] || {
                          border: "border-yellow-500",
                          text: "text-yellow-700",
                          name: "text-indigo-950 border-indigo-100",
                          bg: "text-yellow-600",
                          cardBg: "bg-white"
                        };

                        return (
                          <div className={`border-4 border-double ${themeStyles.border} p-4 text-center ${themeStyles.cardBg} rounded-lg shadow-sm font-serif space-y-2 max-w-sm mx-auto relative overflow-hidden`}>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                              <GraduationCap size={200} className={themeStyles.bg} />
                            </div>
                            <p className={`text-[10px] uppercase tracking-widest ${themeStyles.text} font-sans font-bold`}>Church Kingly Anointed App</p>
                            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-sans mt-0.5">Scripture Academy Graduate</p>
                            <h5 className="text-[14px] text-slate-800 font-extrabold font-serif italic mt-1">Certificate of Completion</h5>
                            <p className="text-[8px] text-slate-500 font-sans">This is proudly awarded to</p>
                            <h6 className={`text-[13px] font-sans font-extrabold ${themeStyles.name} border-b pb-0.5 max-w-[200px] mx-auto uppercase`}>{user.name}</h6>
                            <p className="text-[8px] text-slate-500 font-sans">for completing the deep discipleship curriculum of {activeGroup?.name || "Foundations of Faith"} with distinction.</p>
                            
                            <div className="flex justify-between text-[7px] text-slate-500 pt-3 font-sans">
                              <div className="text-center w-1/2">
                                <div className="border-t border-slate-300 px-2 mt-2 inline-block font-sans font-bold">
                                  {activeGroup?.signatory1 || "Pastor Benson Nyirenda"}
                                </div>
                                <div className="opacity-50 text-[6px]">{activeGroup?.signatory1Title || "Lead Pastor"}</div>
                              </div>
                              <div className="text-center w-1/2">
                                <div className="border-t border-slate-300 px-2 mt-2 inline-block font-sans font-bold">
                                  {activeGroup?.signatory2 || "Deaconess Winnie Nyirenda"}
                                </div>
                                <div className="opacity-50 text-[6px]">{activeGroup?.signatory2Title || "Education Director"}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button onClick={() => { window.print(); onToast("Launching print spooler..."); }} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer">
                          <Printer size={11} />
                          <span>Print Certificate</span>
                        </button>
                        <button onClick={() => handleDownloadCertificate(user.name)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer">
                          <Download size={11} />
                          <span>Download (PDF)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-6 text-center flex flex-col justify-center items-center h-full min-h-[220px] space-y-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-700 text-xs">Certificates Disabled</h5>
                    <p className="text-[10px] text-slate-400 max-w-xs mx-auto leading-relaxed mt-0.5">
                      This group is classified as a Connection Fellowship. Graduation diplomas and certificate tracking are attached to Academy Courses only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <GraduationCap size={22} className="text-indigo-600" />
            <span>Connection Groups & Scripture Academy</span>
          </h1>
          <p className="text-xs text-slate-500">
            Deeper doctrine, real relationships, active service, and theological accountability.
          </p>
        </div>
      </div>

      {/* Main workspace or Directory rendering */}
      {activeGroup ? renderGroupWorkspace() : renderGroupList()}

      {/* Scripture comparative modal */}
      {renderScripturePopup()}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Launch Connection Group / Course</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleCreateGroupSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Group / Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baptism Foundation Class"
                  value={createGroup.name}
                  onChange={e => setCreateGroup({ ...createGroup, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Shepherd / Instructor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teacher Mary"
                  value={createGroup.leader}
                  onChange={e => setCreateGroup({ ...createGroup, leader: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Day</label>
                  <select
                    value={createGroup.day}
                    onChange={e => setCreateGroup({ ...createGroup, day: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 18:30"
                    value={createGroup.time}
                    onChange={e => setCreateGroup({ ...createGroup, time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Venue Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 10 / Main Sanctuary"
                  value={createGroup.location}
                  onChange={e => setCreateGroup({ ...createGroup, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Group / Course Type</label>
                  <select
                    value={createGroup.type}
                    onChange={e => setCreateGroup({ ...createGroup, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                  >
                    <option value="class">Academy Course</option>
                    <option value="fellowship">Connection Fellowship</option>
                  </select>
                </div>
                {createGroup.type === "class" && (
                  <div className="flex flex-col justify-end pb-2">
                    <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createGroup.certificateEnabled}
                        onChange={e => setCreateGroup({ ...createGroup, certificateEnabled: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer"
                      />
                      <span>Earns Certificate</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowCreateModal(false)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg">Launch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Member Modal */}
      {showAddPersonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Submit Connection Request</h3>
              <button onClick={() => setShowAddPersonModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">✕</button>
            </div>
            <form onSubmit={handleAddMemberSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg leading-relaxed font-semibold">
                Submit request to connect a person to the <strong>{activeGroup?.name}</strong> workspace. A supervising Pastor or Elder will sign off.
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name of Person</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Banda"
                  value={addPersonName}
                  onChange={e => setAddPersonName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address (Optional if Phone provided)</label>
                <input
                  type="email"
                  placeholder="e.g. mary.banda@example.com"
                  value={addPersonEmail}
                  onChange={e => setAddPersonEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone Number (Optional if Email provided)</label>
                <input
                  type="tel"
                  placeholder="e.g. +260 97 123456"
                  value={addPersonPhone}
                  onChange={e => setAddPersonPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddPersonModal(false)} className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg">Submit Connection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Lesson & Quiz Creator Modal */}
      {showLessonBuilder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <BookOpen size={16} className="text-indigo-600" />
                <span>Create Custom Discipleship Lesson & Quiz</span>
              </h3>
              <button onClick={() => setShowLessonBuilder(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateLessonSubmit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="bg-indigo-50 text-indigo-900 p-3 rounded-lg leading-relaxed font-semibold">
                Define study notes, memory verses, discussion triggers, and interactive auto-graded quizzes for your Connection Group disciples.
              </div>

              {/* Title & Introduction */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lesson Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lesson 4: Spirit of Generosity"
                    value={lessonTitle}
                    onChange={e => setLessonTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Scripture Passages (Comma Separated)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 Corinthians 9:6-7, Malachi 3:10"
                    value={lessonScriptures}
                    onChange={e => setLessonScriptures(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Introduction (Short Summary)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Summarize the core theological focus of this lesson..."
                  value={lessonIntro}
                  onChange={e => setLessonIntro(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-semibold focus:border-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Study Notes (Markdown or Text Study Guide)</label>
                <textarea
                  required
                  rows={5}
                  placeholder="### Core Pillars... Use bullets or text."
                  value={lessonNotes}
                  onChange={e => setLessonNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-mono focus:border-indigo-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Syllabus Discussion Questions (One per line)</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. How does giving with a joyful heart affect our faith?"
                  value={lessonDiscussion}
                  onChange={e => setLessonDiscussion(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none font-semibold focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Dynamic Interactive Quiz Builder Section */}
              <div className="border-t border-slate-200 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <GraduationCap size={15} className="text-indigo-600" />
                    <span>Interactive Practice Quiz Questions ({customQuestions.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomQuestion}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 font-bold px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus size={10} />
                    <span>Add Question Card</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {customQuestions.map((q, qIdx) => (
                    <div key={qIdx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative space-y-3">
                      {customQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomQuestion(qIdx)}
                          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 font-bold text-xs cursor-pointer transition-colors"
                        >
                          ✕ Remove Card
                        </button>
                      )}
                      
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Question {qIdx + 1} Text</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. What is the standard tithe ratio mentioned in scripture?"
                          value={q.question}
                          onChange={e => handleUpdateSimpleField(qIdx, "question", e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {q.options.map((opt: string, optIdx: number) => {
                          const optionLabel = ["Option A", "Option B", "Option C", "Option D"][optIdx];
                          return (
                            <div key={optIdx}>
                              <label className="block text-slate-500 font-bold mb-0.5">{optionLabel}</label>
                              <input
                                type="text"
                                required
                                placeholder={`Enter option text`}
                                value={opt}
                                onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:border-indigo-500"
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Correct Choice</label>
                          <select
                            value={q.correctAnswer}
                            onChange={e => handleUpdateSimpleField(qIdx, "correctAnswer", Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-bold cursor-pointer"
                          >
                            <option value={0}>Option A</option>
                            <option value={1}>Option B</option>
                            <option value={2}>Option C</option>
                            <option value={3}>Option D</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Theological Explanation</label>
                          <input
                            type="text"
                            required
                            placeholder="Provide details on why this answer is correct..."
                            value={q.explanation}
                            onChange={e => handleUpdateSimpleField(qIdx, "explanation", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none font-semibold focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowLessonBuilder(false)} className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm">Publish Custom Lesson</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {showCertificateStudentName && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Graduation Certificate View</h3>
              </div>
              <button 
                onClick={() => setShowCertificateStudentName(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {(() => {
              const studentProgress = showCertificateStudentName ? activeGroup?.studentProgress?.[showCertificateStudentName] : null;
              const certStatus = studentProgress?.certificateStatus || "Pending";
              const isCertified = certStatus === "Approved" || certStatus === "Printed" || user.role === "pastor";
              
              const certTheme = activeGroup?.certificateTheme || "gold";
              const themeStyles = {
                gold: {
                  border: "border-yellow-500",
                  text: "text-yellow-700",
                  name: "text-indigo-950 border-indigo-100",
                  bg: "text-yellow-600",
                  cardBg: "bg-white"
                },
                blue: {
                  border: "border-blue-500",
                  text: "text-blue-700",
                  name: "text-blue-950 border-blue-100",
                  bg: "text-blue-600",
                  cardBg: "bg-blue-50/10"
                },
                burgundy: {
                  border: "border-red-700",
                  text: "text-red-800",
                  name: "text-red-950 border-red-150",
                  bg: "text-red-600",
                  cardBg: "bg-red-50/10"
                },
                emerald: {
                  border: "border-emerald-600",
                  text: "text-emerald-700",
                  name: "text-emerald-950 border-emerald-100",
                  bg: "text-emerald-600",
                  cardBg: "bg-emerald-50/10"
                },
                purple: {
                  border: "border-purple-600",
                  text: "text-purple-700",
                  name: "text-purple-950 border-purple-100",
                  bg: "text-purple-600",
                  cardBg: "bg-purple-50/10"
                }
              }[certTheme as "gold" | "blue" | "burgundy" | "emerald" | "purple"] || {
                border: "border-yellow-500",
                text: "text-yellow-700",
                name: "text-indigo-950 border-indigo-100",
                bg: "text-yellow-600",
                cardBg: "bg-white"
              };

              return (
                <>
                  <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    {/* Golden Double Border Certificate Preview with Theme Support */}
                    <div className={`border-4 border-double ${themeStyles.border} p-6 text-center ${themeStyles.cardBg} rounded-xl shadow-inner font-serif space-y-4 relative overflow-hidden`}>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                        <GraduationCap size={320} className={themeStyles.bg} />
                      </div>
                      <p className={`text-xs uppercase tracking-widest ${themeStyles.text} font-sans font-extrabold`}>
                        Church Kingly Anointed App
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-sans mt-0.5">
                        Scripture Academy Graduate
                      </p>
                      
                      <h4 className="text-xl text-slate-800 font-extrabold italic mt-2 font-serif">
                        Certificate of Completion
                      </h4>
                      
                      <p className="text-xs text-slate-500 font-sans">This is proudly awarded to</p>
                      
                      <h5 className={`text-lg font-sans font-extrabold ${themeStyles.name} border-b-2 pb-1 max-w-[280px] mx-auto uppercase tracking-wide`}>
                        {showCertificateStudentName}
                      </h5>
                      
                      <p className="text-xs text-slate-600 font-sans max-w-sm mx-auto leading-relaxed">
                        for successfully completing the deep discipleship curriculum of <strong className="text-slate-800 font-bold">{activeGroup?.name || "Foundations of Faith"}</strong> with distinction, honor, and theological accountability.
                      </p>
                      
                      <p className="text-[11px] text-slate-400 font-sans italic">
                        Awarded on {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
 
                      <div className="flex justify-between text-[10px] text-slate-500 pt-6 font-sans">
                        <div className="text-center w-1/2">
                          <p className="font-bold text-slate-800 border-t border-slate-300 pt-1.5 px-2 inline-block">
                            {activeGroup?.signatory1 || "Pastor Benson Nyirenda"}
                          </p>
                          <p className="text-[9px] opacity-75">{activeGroup?.signatory1Title || "Lead Pastor"}</p>
                        </div>
                        <div className="text-center w-1/2">
                          <p className="font-bold text-slate-800 border-t border-slate-300 pt-1.5 px-2 inline-block">
                            {activeGroup?.signatory2 || "Deaconess Winnie Nyirenda"}
                          </p>
                          <p className="text-[9px] opacity-75">{activeGroup?.signatory2Title || "Education Director"}</p>
                        </div>
                      </div>
 
                      {!(certStatus === "Approved" || certStatus === "Printed") && (
                        <div className="p-2 bg-amber-50 border border-amber-100/60 rounded-xl text-xs text-amber-800 font-bold flex items-center justify-center gap-1.5 mt-4 font-sans">
                          <Lock size={13} />
                          <span>Awaiting Lead Pastor Certification to unlock downloads.</span>
                        </div>
                      )}
                    </div>
                  </div>
 
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      {user.role === "pastor" && (certStatus !== "Approved" && certStatus !== "Printed") && (
                        <button
                          onClick={async () => {
                            if (showCertificateStudentName) {
                              await handleApproveCertificate(showCertificateStudentName);
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          <span>Approve & Certify Graduate</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2.5 ml-auto">
                      <button 
                        disabled={!isCertified}
                        onClick={() => { window.print(); onToast("Spooling print request..."); }} 
                        className={`text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                          isCertified
                            ? "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                            : "bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed opacity-75"
                        }`}
                      >
                        <Printer size={13} />
                        <span>Print Diploma</span>
                      </button>
                      <button 
                        disabled={!isCertified}
                        onClick={() => handleDownloadCertificate(showCertificateStudentName)}
                        className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
                          isCertified
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
                            : "bg-slate-150 border border-slate-250 text-slate-400 cursor-not-allowed opacity-75"
                        }`}
                      >
                        {isCertified ? <Download size={13} /> : <Lock size={13} />}
                        <span>{isCertified ? "Download (PDF)" : "Locked"}</span>
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
