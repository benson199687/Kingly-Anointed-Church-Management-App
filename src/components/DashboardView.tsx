import React, { useState, useEffect } from "react";
import { 
  Video, Calendar, Users, Heart, Clipboard, BarChart3, DollarSign, Edit3, Save, 
  Image as ImageIcon, AlertCircle, HelpCircle, Award, CheckCircle, Download, 
  GraduationCap, Printer, Lock, ChevronRight 
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { User, DatabaseState } from "../types";
import { roleBg } from "./Sidebar";
import { SEED_LESSONS } from "./GroupsView";
import { generateCertificatePdf } from "../lib/pdfHelper";

interface DashboardViewProps {
  user: User;
  state: DatabaseState;
  setCurrentView: (view: string) => void;
  onToast: (msg: string) => void;
  onRefreshData?: () => void;
}

const PRESET_CHURCH_PHOTOS = [
  { name: "Holy Bible", url: "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=600&auto=format&fit=crop&q=60" },
  { name: "Worship Praise", url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60" },
  { name: "Fellowship Group", url: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&auto=format&fit=crop&q=60" },
  { name: "Sunrise Cross", url: "https://images.unsplash.com/photo-1438263308737-6e5a7a1a157e?w=600&auto=format&fit=crop&q=60" },
  { name: "Sanctuary Church", url: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=60" },
  { name: "Church Steeple", url: "https://images.unsplash.com/photo-1477704300053-90292fe36177?w=600&auto=format&fit=crop&q=60" }
];

export function DashboardView({ user, state, setCurrentView, onToast, onRefreshData }: DashboardViewProps) {
  const role = user.role;
  const bg = roleBg(role);
  const isPastorOrAdmin = ["pastor", "admin"].includes(role);
  const isLeader = ["pastor", "admin", "elder", "deacon"].includes(role);

  // Fallback default stats with beautiful church photos
  const fallbackStats = [
    { 
      id: "sermons_watched", 
      label: "Sermons Watched", 
      val: "12", 
      imageUrl: "https://images.unsplash.com/photo-1526976734720-0e03a2258d8e?w=600&auto=format&fit=crop&q=60" 
    },
    { 
      id: "services_attended", 
      label: "Services Attended", 
      val: "8", 
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=60" 
    },
    { 
      id: "groups_joined", 
      label: "Groups Joined", 
      val: "3", 
      imageUrl: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=60" 
    },
    { 
      id: "prayer_requests", 
      label: "Prayer Requests", 
      val: "2", 
      imageUrl: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&auto=format&fit=crop&q=60" 
    }
  ];

  const currentStats = state.dashboardStats || fallbackStats;

  // Load progress from localStorage
  const [userProgress, setUserProgress] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`growth_progress_${user.name}`);
    const loaded = saved ? JSON.parse(saved) : {
      xp: user.xp || 220,
      streak: 4,
      completedLessons: ["les_1"],
      notebookNotes: {},
      badges: ["Faithful Learner", "Scripture Explorer"]
    };
    if (user.xp !== undefined) {
      loaded.xp = Number(user.xp);
    }
    setUserProgress(loaded);
  }, [user.name, user.xp]);

  const totalLessons = SEED_LESSONS.length;
  const completedCount = userProgress?.completedLessons?.filter((id: string) => 
    SEED_LESSONS.some(l => l.id === id)
  ).length || 0;
  
  const isGraduate = completedCount >= totalLessons;
  const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

  const handleDownloadCertificate = (studentName: string) => {
    const activeGroup = state.groups?.find((g: any) => 
      g.name.toLowerCase().includes("class") || g.leader.toLowerCase().includes("teacher")
    );
    
    // Programmatic verification: Must be Approved or Printed, or user must be the pastor/leader
    const studentProgress = activeGroup?.studentProgress?.[studentName];
    const certStatus = studentProgress?.certificateStatus || "Pending";
    const isCertified = certStatus === "Approved" || certStatus === "Printed" || user.role === "pastor";
    
    if (!isCertified) {
      onToast(`Download blocked. Certificate for ${studentName} is awaiting Lead Pastor Certification.`);
      return;
    }

    const s1 = activeGroup?.signatory1 || "Pastor Benson Nyirenda";
    const s1Title = activeGroup?.signatory1Title || "Lead Pastor";
    const s2 = activeGroup?.signatory2 || "Deaconess Winnie Nyirenda";
    const s2Title = activeGroup?.signatory2Title || "Education Director";
    const courseTitle = activeGroup?.name || "Scripture Academy Discipleship Course";
    const dateStr = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });
    
    try {
      generateCertificatePdf({
        studentName,
        courseTitle,
        signatory1: s1,
        signatory1Title: s1Title,
        signatory2: s2,
        signatory2Title: s2Title,
        dateStr
      });
      onToast("PDF Certificate downloaded successfully!");
    } catch (err) {
      console.error(err);
      onToast("Error generating PDF Certificate.");
    }
  };

  // Edit states
  const [editingStat, setEditingStat] = useState<any | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editVal, setEditVal] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const getStatIcon = (id: string) => {
    switch (id) {
      case "sermons_watched":
        return <Video size={16} className="text-white" />;
      case "services_attended":
        return <Calendar size={16} className="text-white" />;
      case "groups_joined":
        return <Users size={16} className="text-white" />;
      case "prayer_requests":
        return <Heart size={16} className="text-white" />;
      default:
        return <Video size={16} className="text-white" />;
    }
  };

  const getStatColor = (id: string) => {
    switch (id) {
      case "sermons_watched":
        return "bg-blue-600";
      case "services_attended":
        return "bg-emerald-600";
      case "groups_joined":
        return "bg-purple-600";
      case "prayer_requests":
        return "bg-rose-600";
      default:
        return "bg-slate-600";
    }
  };

  const getRoleStats = () => {
    const statsByRole = {
      member: [], // Members just see the beautiful church engagement stats as their primary dashboard grid!
      deacon: [
        { label: "Pending Tasks", val: String(state.tasks?.filter(t => t.status === "pending").length || 0), icon: <Clipboard size={20} className="text-emerald-600" />, bg: "bg-emerald-50" },
        { label: "Visitations Done", val: "7", icon: <Users size={20} className="text-blue-600" />, bg: "bg-blue-50" },
        { label: "Members Served", val: "23", icon: <Heart size={20} className="text-purple-600" />, bg: "bg-purple-50" },
        { label: "Reports Submitted", val: "3", icon: <BarChart3 size={20} className="text-amber-600" />, bg: "bg-amber-50" },
      ],
      elder: [
        { label: "Members Under Care", val: "45", icon: <Heart size={20} className="text-purple-600" />, bg: "bg-purple-50" },
        { label: "Active Tasks", val: String(state.tasks?.filter(t => t.status === "in-progress").length || 0), icon: <Clipboard size={20} className="text-emerald-600" />, bg: "bg-emerald-50" },
        { label: "Small Groups", val: String(state.groups?.length || 0), icon: <Users size={20} className="text-blue-600" />, bg: "bg-blue-50" },
        { label: "Monthly Reports", val: "4", icon: <BarChart3 size={20} className="text-amber-600" />, bg: "bg-amber-50" },
      ],
      pastor: [
        { label: "Total Members", val: "320", icon: <Users size={20} className="text-amber-600" />, bg: "bg-amber-50" },
        { label: "Sermons (YTD)", val: String(state.sermons?.length || 0), icon: <Video size={20} className="text-blue-600" />, bg: "bg-blue-50" },
        { label: "Monthly Income", val: "K62,000", icon: <DollarSign size={20} className="text-emerald-600" />, bg: "bg-emerald-50" },
        { label: "Attendance Rate", val: "87%", icon: <BarChart3 size={20} className="text-purple-600" />, bg: "bg-purple-50" },
      ],
      admin: [
        { label: "Total Members", val: "320", icon: <Users size={20} className="text-red-600" />, bg: "bg-red-50" },
        { label: "Monthly Income", val: "K62,000", icon: <DollarSign size={20} className="text-emerald-600" />, bg: "bg-emerald-50" },
        { label: "Avg Attendance", val: "253", icon: <Calendar size={20} className="text-blue-600" />, bg: "bg-blue-50" },
        { label: "Active Groups", val: String(state.groups?.length || 0), icon: <Users size={20} className="text-purple-600" />, bg: "bg-purple-50" },
      ],
    };

    return statsByRole[role] || [];
  };

  const roleStats = getRoleStats();
  const upcomingEvents = state.events?.slice(0, 3) || [];
  const recentSermons = state.sermons?.slice(0, 2) || [];
  const spotlightRequest = state.prayerRequests?.find(p => !p.private) || state.prayerRequests?.[0];

  const handleEditClick = (stat: any) => {
    setEditingStat(stat);
    setEditLabel(stat.label);
    setEditVal(stat.val);
    setEditImageUrl(stat.imageUrl || "");
  };

  const handleStatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStat) return;
    setIsSaving(true);

    const updatedStats = currentStats.map(s => {
      if (s.id === editingStat.id) {
        return { ...s, label: editLabel, val: editVal, imageUrl: editImageUrl };
      }
      return s;
    });

    try {
      const res = await fetch("/api/dashboard-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stats: updatedStats })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully updated ${editLabel}!`);
        setEditingStat(null);
        if (onRefreshData) {
          onRefreshData();
        }
      } else {
        onToast("Failed to save dashboard metrics.");
      }
    } catch (err) {
      onToast("Error connecting to server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Welcome Banner */}
      <div 
        className="rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-md"
        style={{ background: bg }}
      >
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight">Welcome back, {user.name.split(" ")[0]}! 👋</h2>
          <p className="text-white/80 text-sm mt-1.5 font-medium">
            {role.charAt(0).toUpperCase() + role.slice(1)} Portal · Church Kingly Anointed App
          </p>
        </div>
        <div className="absolute right-[-40px] top-[-40px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Church Life & Discipleship Engagement Grid with Photos */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <span>⛪</span>
            <span>Church Life & Discipleship Engagement</span>
          </h3>
          {isPastorOrAdmin && (
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md self-start sm:self-auto">
              Pastor/Admin: Click ✏️ to customize card data & photos
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="church-life-grid">
          {currentStats.map((stat) => (
            <div key={stat.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group">
              {/* Church-themed cover photo */}
              <div className="h-28 w-full overflow-hidden relative bg-slate-100">
                <img 
                  src={stat.imageUrl} 
                  alt={stat.label} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/30 to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${getStatColor(stat.id)} flex items-center justify-center text-white shadow-sm`}>
                    {getStatIcon(stat.id)}
                  </div>
                  <span className="text-[11px] font-extrabold text-white uppercase tracking-wider drop-shadow-sm truncate max-w-[150px]">
                    {stat.label}
                  </span>
                </div>
              </div>
              
              <div className="p-4 flex items-center justify-between bg-white">
                <div>
                  <div className="text-2xl font-extrabold text-slate-850 leading-none font-mono">
                    {stat.val}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-1.5">
                    Grace Fellowship Records
                  </div>
                </div>
                
                {isPastorOrAdmin && (
                  <button
                    onClick={() => handleEditClick(stat)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 cursor-pointer"
                    title={`Edit ${stat.label}`}
                  >
                    <Edit3 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Role-specific Operational Metrics */}
      {roleStats.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
            <span>📊</span>
            <span>{role.charAt(0).toUpperCase() + role.slice(1)} Controls & Operational Metrics</span>
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="role-metrics-grid">
            {roleStats.map((stat, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                <div className={`w-11 h-11 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
                <div className="mt-4">
                  <div className="text-2xl font-bold text-slate-800 leading-none">{stat.val}</div>
                  <div className="text-xs font-medium text-slate-500 mt-1.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications & Discipleship Academy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="certifications-dashboard-section">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
            <Award size={18} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm md:text-base">Certifications & Course Progress</h3>
            <p className="text-slate-400 text-[10px] md:text-xs font-medium">Visualize and manage your theological and spiritual growth milestones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {user.role === "pastor" ? (
            <>
              {/* Pastor View: Cohort Registry & Print Controller */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <GraduationCap size={15} className="text-emerald-600" />
                      <span>Academy Students Index & Graduation Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentView("certificates")}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-md border border-indigo-100/60 transition-colors cursor-pointer"
                        title="Open comprehensive certificate administrative registry"
                      >
                        Central Registry →
                      </button>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        Pastor Controls
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const activeGroup = state.groups?.find((g: any) => 
                      g.name.toLowerCase().includes("class") || g.leader.toLowerCase().includes("teacher") || g.type === "class"
                    );

                    const studentsList = (state.members || []).filter(mem => {
                      if (mem.role === "pastor" || mem.name === activeGroup?.leader) return false;
                      if (activeGroup?.memberNames && activeGroup.memberNames.length > 0) {
                        return activeGroup.memberNames.includes(mem.name);
                      }
                      return false; // Remove default fallback names
                    });

                    const getCompletedCount = (name: string) => {
                      if (name === user.name) {
                        return userProgress?.completedLessons?.length || 0;
                      }
                      if (activeGroup?.studentProgress?.[name]?.completedLessons) {
                        return activeGroup.studentProgress[name].completedLessons.length;
                      }
                      return 0;
                    };

                    const totalClassLessons = SEED_LESSONS.length + (activeGroup?.lessons || []).length;
                    const graduates = studentsList.filter(s => getCompletedCount(s.name) >= totalClassLessons);
                    const studying = studentsList.filter(s => getCompletedCount(s.name) < totalClassLessons);

                    const approvedGraduates = graduates.filter(g => {
                      const progress = activeGroup?.studentProgress?.[g.name];
                      return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                    });
                    const approvedGraduateNames = approvedGraduates.map(g => g.name);

                    const approvedSelectedCount = selectedStudents.filter(name => {
                      const progress = activeGroup?.studentProgress?.[name];
                      return progress?.certificateStatus === "Approved" || progress?.certificateStatus === "Printed";
                    }).length;

                    const handleToggleSelectAll = () => {
                      const allSelected = approvedGraduateNames.length > 0 && approvedGraduateNames.every(name => selectedStudents.includes(name));
                      if (allSelected) {
                        setSelectedStudents(prev => prev.filter(name => !approvedGraduateNames.includes(name)));
                      } else {
                        const toAdd = approvedGraduateNames.filter(name => !selectedStudents.includes(name));
                        setSelectedStudents(prev => [...prev, ...toAdd]);
                      }
                    };

                    const handleBatchDownload = () => {
                      if (selectedStudents.length === 0) {
                        onToast("Please select at least one student first.");
                        return;
                      }
                      const approvedTargets = selectedStudents.filter(name => {
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
                        }, i * 600);
                      });
                    };

                    const handleBatchPrint = () => {
                      if (selectedStudents.length === 0) {
                        onToast("Please select at least one student first.");
                        return;
                      }
                      const approvedTargets = selectedStudents.filter(name => {
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

                    const isAllGraduatesSelected = approvedGraduateNames.length > 0 && approvedGraduateNames.every(name => selectedStudents.includes(name));

                    return (
                      <div className="space-y-4">
                        {/* Summary metrics for pastor */}
                        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="text-center p-1.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Cohort</p>
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

                        {/* Bulk Print Selection Bar */}
                        {approvedGraduates.length > 0 && (
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

                            {selectedStudents.length > 0 && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleBatchPrint}
                                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-extrabold px-2.5 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Printer size={10} />
                                  <span>Print ({approvedSelectedCount})</span>
                                </button>
                                <button
                                  onClick={handleBatchDownload}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-extrabold px-2.5 py-1 rounded shadow-xs flex items-center gap-1 cursor-pointer transition-all"
                                >
                                  <Download size={10} />
                                  <span>Download PDF ({approvedSelectedCount})</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* List of Student Rows with Checkboxes */}
                        <div className="space-y-2">
                          {studentsList.map(mem => {
                            const completedCount = getCompletedCount(mem.name);
                            const isGraduate = completedCount >= totalClassLessons;
                            const isSelected = selectedStudents.includes(mem.name);

                            const memCertStatus = activeGroup?.studentProgress?.[mem.name]?.certificateStatus || "Pending";
                            const memIsCertified = memCertStatus === "Approved" || memCertStatus === "Printed";

                            return (
                              <div key={mem.id} className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold border transition-all ${isSelected ? 'bg-indigo-50/20 border-indigo-100 shadow-xs' : 'bg-slate-50 border-transparent'}`}>
                                <div className="flex items-center gap-2.5">
                                  {isGraduate ? (
                                    <input 
                                      type="checkbox" 
                                      disabled={!memIsCertified}
                                      checked={isSelected}
                                      onChange={() => {
                                        if (isSelected) {
                                          setSelectedStudents(prev => prev.filter(name => name !== mem.name));
                                        } else {
                                          setSelectedStudents(prev => [...prev, mem.name]);
                                        }
                                      }}
                                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={memIsCertified ? "Select for batch action" : "Awaiting approval in Central Registry"}
                                    />
                                  ) : (
                                    <div className="w-3.5 h-3.5 border border-dashed border-slate-300 rounded" title="Still studying" />
                                  )}

                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-[9px] text-indigo-800">
                                      {mem.name.split(" ").map((n: string) => n[0]).join("")}
                                    </div>
                                    <div>
                                      <p className="text-slate-800 font-extrabold">{mem.name}</p>
                                      <p className="text-[9px] text-slate-400">Class: Foundation Studies</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">
                                    {completedCount}/{totalClassLessons} modules passed
                                  </span>
                                  {isGraduate ? (
                                    <div className="flex items-center gap-1.5">
                                      <span className="bg-emerald-100 text-emerald-800 text-[8px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-0.5">
                                        <CheckCircle size={9} />
                                        Graduate
                                      </span>
                                      <button
                                        disabled={!memIsCertified}
                                        onClick={() => handleDownloadCertificate(mem.name)}
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                                          memIsCertified
                                            ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            : "bg-slate-150 text-slate-400 cursor-not-allowed border border-slate-200"
                                        }`}
                                        title={memIsCertified ? "Download Certificate" : "Awaiting Lead Pastor Certification"}
                                      >
                                        {memIsCertified ? <Award size={9} /> : <Lock size={9} />}
                                        <span>{memIsCertified ? "Download PDF" : "Locked"}</span>
                                      </button>
                                    </div>
                                  ) : (
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
              </div>

              {/* Pastor View: Right Column (Digital Preview & Customizer) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Beautiful Golden Digital Diploma Preview */}
                  <div className="border-4 border-double border-amber-500 p-5 rounded-xl text-center bg-amber-50/20 shadow-inner font-serif space-y-3 relative overflow-hidden select-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                      <GraduationCap size={160} className="text-amber-600" />
                    </div>

                    <p className="text-[9px] uppercase tracking-widest text-amber-700 font-sans font-extrabold">
                      Church Kingly Anointed App
                    </p>
                    <p className="text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                      Scripture Academy Graduate
                    </p>
                    
                    <h5 className="text-[13px] text-slate-800 font-extrabold italic font-serif">
                      Certificate of Completion
                    </h5>
                    
                    <p className="text-[8px] text-slate-500 font-sans">This is proudly awarded to</p>
                    
                    <p className="text-sm font-sans font-extrabold text-indigo-955 border-b border-indigo-100 pb-0.5 max-w-[200px] mx-auto uppercase tracking-wide">
                      [STUDENT NAME]
                    </p>
                    
                    <p className="text-[8px] text-slate-500 font-sans leading-relaxed max-w-[240px] mx-auto">
                      for completing the deep discipleship curriculum of <strong className="text-slate-800 font-bold">Scripture Academy Discipleship Core</strong> with distinction.
                    </p>
                    
                    <p className="text-[8px] text-slate-400 font-sans italic">
                      Issued: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold text-slate-600 space-y-1.5">
                    <p className="text-slate-800 font-bold uppercase text-[9px] tracking-wide text-indigo-600">Certificate Signatories Info</p>
                    <p>✍️ Signatory 1: Pastor Benson Nyirenda (Lead Pastor)</p>
                    <p>✍️ Signatory 2: Deaconess Winnie Nyirenda (Education Director)</p>
                    <p className="text-[10px] text-slate-400 italic">Adjust signatory details or authorize custom titles in the Connection Groups Scripture Academy settings panel.</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Member View: Regular Single-Student Progress Checklist */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs md:text-sm">Scripture Academy & Discipleship Core</h4>
                      <p className="text-slate-400 text-[10px] md:text-xs mt-0.5 font-medium">Deep dive study into Faith, Grace, and Doctrine</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      {progressPercent}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                      <span>{completedCount} / {totalLessons} Modules Passed</span>
                      <span>{progressPercent === 100 ? "Ready for Graduation!" : "Course in Progress"}</span>
                    </div>
                  </div>
                </div>

                {/* Modules Checkboxes */}
                <div className="space-y-2.5">
                  <h5 className="font-bold text-slate-700 text-xs">Curriculum Modules Status</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SEED_LESSONS.map((les) => {
                      const isCompleted = userProgress?.completedLessons?.includes(les.id);
                      return (
                        <div 
                          key={les.id}
                          className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                            isCompleted 
                              ? "bg-emerald-50/40 border-emerald-100 text-slate-800" 
                              : "bg-white border-slate-200 text-slate-500"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            isCompleted ? "bg-emerald-500 text-white" : "border border-slate-300"
                          }`}>
                            {isCompleted ? <CheckCircle size={12} /> : <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-[11px] font-bold truncate ${isCompleted ? "text-emerald-950" : "text-slate-700"}`}>
                              {les.title}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-medium">
                              {isCompleted ? "Passed & Documented" : "Next Module"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Certificate Column */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                {isGraduate ? (() => {
                  const certStatus = userProgress?.certificateStatus || "Pending";
                  const isCertified = certStatus === "Approved" || certStatus === "Printed";

                  return (
                    <div className="space-y-4">
                      {/* Beautiful Golden Digital Diploma Preview */}
                      <div className="border-4 border-double border-amber-500 p-5 rounded-xl text-center bg-amber-50/20 shadow-inner font-serif space-y-3 relative overflow-hidden select-none">
                        {/* Subtle watermarked vector graduation cap icon in absolute center */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
                          <GraduationCap size={160} className="text-amber-600" />
                        </div>

                        <p className="text-[9px] uppercase tracking-widest text-amber-700 font-sans font-extrabold">
                          Church Kingly Anointed App
                        </p>
                        <p className="text-[8px] uppercase tracking-wider text-slate-400 font-sans">
                          Scripture Academy Graduate
                        </p>
                        
                        <h5 className="text-[13px] text-slate-800 font-extrabold italic font-serif">
                          Certificate of Completion
                        </h5>
                        
                        <p className="text-[8px] text-slate-500 font-sans">This is proudly awarded to</p>
                        
                        <p className="text-sm font-sans font-extrabold text-indigo-955 border-b border-indigo-100 pb-0.5 max-w-[200px] mx-auto uppercase tracking-wide">
                          {user.name}
                        </p>
                        
                        <p className="text-[8px] text-slate-500 font-sans leading-relaxed max-w-[240px] mx-auto">
                          for completing the deep discipleship curriculum of <strong className="text-slate-800 font-bold">Scripture Academy Discipleship Core</strong> with distinction.
                        </p>
                        
                        <p className="text-[8px] text-slate-400 font-sans italic">
                          Issued: {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                        {!isCertified && (
                          <div className="mt-1.5 p-1 bg-amber-100/60 border border-amber-200/50 rounded text-[9px] text-amber-800 font-bold flex items-center justify-center gap-1">
                            <Lock size={10} />
                            <span>Awaiting Lead Pastor Certification to unlock downloads.</span>
                          </div>
                        )}
                      </div>

                      {/* Printable Action Buttons */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button 
                          disabled={!isCertified}
                          onClick={() => { window.print(); onToast("Launching print spooler..."); }} 
                          className={`font-bold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
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
                          onClick={() => handleDownloadCertificate(user.name)} 
                          className={`font-bold text-[11px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm ${
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
                  );
                })() : (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-5 text-center flex flex-col justify-center items-center h-full space-y-4 min-h-[180px]">
                    <div className="w-12 h-12 rounded-full bg-slate-150 flex items-center justify-center text-slate-400">
                      <Lock size={20} />
                    </div>
                    <div className="space-y-1 max-w-xs">
                      <h5 className="font-extrabold text-slate-700 text-xs md:text-sm">Academy Diploma Locked</h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        Complete all {totalLessons} course modules and pass the study tests in the Scripture Academy course to unlock your printable Certificate.
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentView("groups")}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Go to Scripture Academy</span>
                      <ChevronRight size={12} />
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {isLeader ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2" id="leader-dashboard-main">
          {/* Left Column: Attendance Trend & Recent Sermons */}
          <div className="space-y-6">
            {/* Attendance Trend Chart with Entrance Motion */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Attendance Trend</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Sunday morning service count overview</p>
                </div>
                <div className="bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Average: 268
                </div>
              </div>
              <div className="w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={[
                    { name: "Week 1", Attendance: 210 },
                    { name: "Week 2", Attendance: 280 },
                    { name: "Week 3", Attendance: 253 },
                    { name: "Week 4", Attendance: 290 },
                  ]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 320]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                      formatter={(value: any) => [`${value} worshipers`, ""]}
                    />
                    <Area type="monotone" dataKey="Attendance" stroke="#f97316" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttendance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Sermons with Views */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Recent Sermons</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Media distribution & content stats</p>
                </div>
                <button
                  onClick={() => setCurrentView("sermons")}
                  className="text-xs font-bold text-blue-600 hover:text-blue-850 cursor-pointer"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentSermons.length > 0 ? (
                  recentSermons.slice(0, 2).map((s) => (
                    <div key={s.id} className="flex items-center gap-3.5 group">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0 border border-slate-150 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <Video size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 text-xs truncate">{s.title}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {s.speaker} · {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold">
                          Published
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">{s.views || 0} views</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-3.5 group">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0 border border-slate-150">
                        <Video size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 text-xs truncate">Walking in Faith</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">Pastor Thomas · Nov 20, 2025</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold">
                          Published
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">234 views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3.5 group">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0 border border-slate-150">
                        <Video size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-800 text-xs truncate">The Power of Prayer</div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">Pastor Thomas · Nov 13, 2025</div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-700 text-[9px] font-bold">
                          Published
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">189 views</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Urgent Matters, Upcoming Events, AI Insight */}
          <div className="space-y-6">
            {/* Urgent Matters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>Urgent Care Matters</span>
              </h3>
              <div className="space-y-2.5">
                <div className="p-3 bg-red-50/60 border-l-4 border-l-red-500 rounded-r-xl flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Member Health Crisis</div>
                    <p className="text-slate-500 text-[10px] mt-0.5">Mrs. Johnson is hospitalized after surgery. Visitation required.</p>
                  </div>
                </div>
                <div className="p-3 bg-amber-50/60 border-l-4 border-l-amber-500 rounded-r-xl flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-1.5 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Counseling Request</div>
                    <p className="text-slate-500 text-[10px] mt-0.5">2 pending spiritual guidance appointments booked this week.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-800 text-sm">Upcoming Events</h3>
                <button onClick={() => setCurrentView("events")} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                  View All
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Youth Fellowship Service</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Today, 6:00 PM · Church Hall</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">Today</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Midweek Bible Study</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Wednesday, 7:00 PM · Main Sanctuary</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Wed</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">Elder's Prayer Assembly</div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Friday, 6:00 AM · Prayer Room</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">Fri</span>
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-650 to-purple-600 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between relative overflow-hidden group">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">✨</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/90">Eldership AI Insights</span>
                </div>
                <HelpCircle size={14} className="text-white/40" />
              </div>
              <p className="text-[11px] font-semibold text-white/95 leading-relaxed mt-3.5 italic">
                "Attendance has increased by 8% this month. Consider expanding Sunday morning sanctuary service capacity or launching a second service track."
              </p>
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/5 rounded-full blur-lg pointer-events-none" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Upcoming Events */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Upcoming Services & Events</h3>
              <button
                onClick={() => setCurrentView("events")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {upcomingEvents.map((e) => {
                const rsvpPercent = Math.round((e.attendees / e.capacity) * 100);
                return (
                  <div key={e.id} className="flex items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm truncate">{e.title}</div>
                      <div className="text-xs text-slate-500 mt-1 truncate">
                        {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {e.time} · {e.location}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="inline-block px-2.5 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 rounded-full">
                        {rsvpPercent}% Booked
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Sermons */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="font-bold text-slate-800 text-sm md:text-base">Recent Sermon Materials</h3>
              <button
                onClick={() => setCurrentView("sermons")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {recentSermons.map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Video size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 text-sm truncate">{s.title}</div>
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {s.speaker} · {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {s.duration}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 shrink-0">
                    {s.views} views
                  </div>
                </div>
              ))}

              {/* Prayer Spotlight */}
              {spotlightRequest && (
                <div className="mt-5 p-4 bg-slate-50 border border-slate-200/60 rounded-xl shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prayer Spotlight</span>
                    <span className="text-[10px] font-bold text-blue-600">{spotlightRequest.prayers} praying with us</span>
                  </div>
                  <p className="text-xs text-slate-600 italic line-clamp-2">
                    "{spotlightRequest.request}"
                  </p>
                  <div className="mt-2 text-[10px] font-semibold text-slate-400 text-right">
                    — {spotlightRequest.member}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Stat Modal */}
      {editingStat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" id="edit-stat-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Edit Discipleship Card: {editingStat.label}</h3>
              <button
                disabled={isSaving}
                onClick={() => setEditingStat(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleStatSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Card Title / Label *</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Statistical Value *</label>
                <input
                  type="text"
                  required
                  disabled={isSaving}
                  value={editVal}
                  onChange={(e) => setEditVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Church Photo (Unsplash Cover URL) *</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {PRESET_CHURCH_PHOTOS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setEditImageUrl(p.url)}
                      className={`h-12 rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer ${
                        editImageUrl === p.url ? "border-blue-600 ring-2 ring-blue-500/10" : "border-transparent hover:border-slate-300"
                      }`}
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-white font-bold">{p.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <input
                  type="url"
                  required
                  disabled={isSaving}
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono text-[10px] focus:border-blue-500"
                  placeholder="Or paste a custom church image URL..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setEditingStat(null)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-950 hover:bg-slate-850 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Save size={12} />
                  <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
