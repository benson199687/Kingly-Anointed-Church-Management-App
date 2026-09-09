import React, { useState, useEffect } from "react";
import { Church, Sparkles, Shield, Heart, Calendar, Video, Users, CheckCircle, Mail, Lock, LogIn, Key, Eye, EyeOff, Home, Tv, BookOpen, DollarSign, Menu, Maximize2, Minimize2, X, Radio, ExternalLink } from "lucide-react";
import { User, DatabaseState, Member, Sermon, Event, Announcement, PrayerRequest, Transaction } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { DashboardView } from "./components/DashboardView";
import { MembersView } from "./components/MembersView";
import { SermonsView } from "./components/SermonsView";
import { EventsView } from "./components/EventsView";
import { AnnouncementsView } from "./components/AnnouncementsView";
import { PrayerRequestsView } from "./components/PrayerRequestsView";
import { QuizView } from "./components/QuizView";
import {
  FinancesView,
  AttendanceView,
  GivingView,
  TasksView,
  MessagesView,
  ReportsView,
  UsersView,
  SettingsView,
  ProfileView
} from "./components/SecondaryViews";
import { GroupsView } from "./components/GroupsView";
import { LiveStreamView } from "./components/LiveStreamView";
import CertificatesView from "./components/CertificatesView";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [currentView, setCurrentView] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeSermonId, setActiveSermonId] = useState<string | null>(null);
  const [floatingVideo, setFloatingVideo] = useState<{ url: string; title: string; isMinimized: boolean } | null>(null);

  // Auto-dismiss toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage((m) => (m === msg ? null : m)), 4500);
  };

  // Fetch all db state from server
  const loadData = async () => {
    try {
      const roleQuery = currentUser ? `?role=${currentUser.role}` : "";
      const res = await fetch(`/api/state${roleQuery}`);
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
      }
    } catch (err) {
      console.error("Failed to load backend state", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.role]);

  // Keep currentUser in sync with dbState updates
  useEffect(() => {
    if (dbState && currentUser) {
      const foundUser = (dbState.members || []).find((u: any) => u.email === currentUser.email);
      if (foundUser) {
        if (
          foundUser.role !== currentUser.role ||
          foundUser.assignedAttendanceDuty !== currentUser.assignedAttendanceDuty ||
          foundUser.name !== currentUser.name
        ) {
          setCurrentUser((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              role: foundUser.role,
              assignedAttendanceDuty: foundUser.assignedAttendanceDuty,
              name: foundUser.name,
            };
          });
        }
      }
    }
  }, [dbState, currentUser]);

  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Advanced Authentication States
  const [authMode, setAuthMode] = useState<"login" | "forgot" | "reset" | "mfa">("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPasswordVal, setNewPasswordVal] = useState("");
  const [mfaEmail, setMfaEmail] = useState("");
  const [mfaCodeVal, setMfaCodeVal] = useState("");
  const [tempCodeShown, setTempCodeShown] = useState<string | null>(null);

  // Sync login
  const handleLogin = async (emailStr?: string, passwordStr?: string) => {
    setAuthError(null);
    const targetEmail = emailStr || emailInput;
    const targetPassword = passwordStr || passwordInput;

    if (!targetEmail || !targetPassword) {
      setAuthError("Please enter both email and password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, password: targetPassword })
      });
      const data = await res.json();
      if (data.success) {
        if (data.mfaRequired) {
          setMfaEmail(data.email);
          setAuthMode("mfa");
          if (data.tempCode) {
            triggerToast(`🔒 Security Code Issued: ${data.tempCode}`);
            setTempCodeShown(data.tempCode);
          }
          return;
        }
        setCurrentUser(data.user);
        setCurrentView("dashboard");
        setEmailInput("");
        setPasswordInput("");
        setAuthMode("login");
        triggerToast(`Signed in successfully as ${data.user.name} (${data.user.role})`);
      } else {
        setAuthError(data.message || "Authentication failed");
      }
    } catch (err) {
      setAuthError("Network error: Server is unreachable.");
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!resetEmail) {
      setAuthError("Please provide your registered email address.");
      return;
    }

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Reset code generated: ${data.tempCode}`);
        setResetCode("");
        setAuthMode("reset");
        if (data.tempCode) {
          setTempCodeShown(data.tempCode);
        }
      } else {
        setAuthError(data.message || "Email lookup failed.");
      }
    } catch (err) {
      setAuthError("Failed to initiate password reset.");
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!resetEmail || !resetCode || !newPasswordVal) {
      setAuthError("All fields are required to reset password.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code: resetCode, newPassword: newPasswordVal })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast("Password reset successful! You can now log in.");
        setEmailInput(resetEmail);
        setPasswordInput(newPasswordVal);
        setAuthMode("login");
        setResetEmail("");
        setResetCode("");
        setNewPasswordVal("");
      } else {
        setAuthError(data.message || "Invalid or incorrect reset code.");
      }
    } catch (err) {
      setAuthError("Failed to complete password reset.");
    }
  };

  const handleMfaVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!mfaEmail || !mfaCodeVal) {
      setAuthError("Verification code is required.");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mfaEmail, code: mfaCodeVal })
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setCurrentView("dashboard");
        setMfaEmail("");
        setMfaCodeVal("");
        setAuthMode("login");
        triggerToast(`Welcome back, ${data.user.name}! 2FA Verified Successfully.`);
      } else {
        setAuthError(data.message || "MFA Verification failed.");
      }
    } catch (err) {
      setAuthError("Verification error: Unable to contact server.");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode("login");
    triggerToast("Signed out of your workspace portal.");
  };

  // Mutators making API requests to the back end
  const handleAddMember = async (member: Partial<Member>) => {
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast(`Successfully added member: ${data.member.name}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error: Failed to register new member.");
    }
  };

  const handleAddSermon = async (sermon: Partial<Sermon>) => {
    try {
      const res = await fetch("/api/sermons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sermon)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast(`Successfully uploaded sermon outline: ${data.sermon.title}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error: Failed to save sermon outline.");
    }
  };

  const handleAddEvent = async (event: Partial<Event>) => {
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast(`Scheduled new church event: ${data.event.title}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error: Failed to schedule church event.");
    }
  };

  const handleRsvpEvent = async (id: string) => {
    try {
      const res = await fetch(`/api/events/${id}/rsvp`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("RSVP Confirmed! You've been added to the attendees list.");
      } else {
        triggerToast(data.message || "RSVP Failed");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error sending RSVP.");
    }
  };

  const handleAddAnnouncement = async (announcement: Partial<Announcement>) => {
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcement)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast(`Successfully published announcement: ${data.announcement.title}`);
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error: Failed to post bulletin.");
    }
  };

  const handleAddPrayerRequest = async (req: Partial<PrayerRequest>) => {
    try {
      const res = await fetch("/api/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("Prayer request posted! The prayer chain has been notified.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error submitting request.");
    }
  };

  const handleIncrementPrayers = async (id: string) => {
    try {
      const res = await fetch(`/api/prayer-requests/${id}/pray`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: currentUser.name })
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("Lifted in prayer! Your spiritual agreement has been registered.");
      } else {
        triggerToast(data.message || "Could not record your prayer support.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Failed to connect to the prayer network.");
    }
  };

  const handleMarkAnswered = async (id: string) => {
    try {
      const res = await fetch(`/api/prayer-requests/${id}/answer`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("Glory to God! Prayer request marked as answered testimony.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTransaction = async (tx: Partial<Transaction>) => {
    try {
      const res = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tx)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("Transaction ledger updated successfully!");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Error updating ledger.");
    }
  };

  const handleUpdateTask = async (id: string, updates: any) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
        triggerToast("Task status updated!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAttendance = async (record: any) => {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record)
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuizSubmit = async (quizId: string, score: number) => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score })
      });
      const data = await res.json();
      if (data.success) {
        setDbState(data.state);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render correct child view
  const renderView = () => {
    if (!dbState || !currentUser) return null;

    switch (currentView) {
      case "dashboard":
        return <DashboardView user={currentUser} state={dbState} setCurrentView={setCurrentView} onToast={triggerToast} onRefreshData={loadData} />;
      case "members":
        return <MembersView user={currentUser} state={dbState} onAddMember={handleAddMember} onToast={triggerToast} onRefresh={loadData} />;
      case "sermons":
        return (
          <SermonsView 
            user={currentUser} 
            state={dbState} 
            onAddSermon={handleAddSermon} 
            onToast={triggerToast} 
            onRefreshData={loadData} 
            activeSermonId={activeSermonId}
            setActiveSermonId={setActiveSermonId}
          />
        );
      case "events":
        return <EventsView user={currentUser} state={dbState} onAddEvent={handleAddEvent} onRsvpEvent={handleRsvpEvent} onToast={triggerToast} />;
      case "announcements":
        return <AnnouncementsView user={currentUser} state={dbState} onAddAnnouncement={handleAddAnnouncement} onToast={triggerToast} onRefresh={loadData} />;
      case "prayer":
        return (
          <PrayerRequestsView
            user={currentUser}
            state={dbState}
            onAddPrayerRequest={handleAddPrayerRequest}
            onIncrementPrayers={handleIncrementPrayers}
            onMarkAnswered={handleMarkAnswered}
            onToast={triggerToast}
          />
        );
      case "quiz":
        return <QuizView user={currentUser} state={dbState} onSubmitScore={handleQuizSubmit} onToast={triggerToast} onRefresh={loadData} onUpdateState={(state: any) => setDbState(state)} />;
      case "finances":
        return <FinancesView user={currentUser} state={dbState} onAddTransaction={handleAddTransaction} onToast={triggerToast} onRefresh={loadData} />;
      case "attendance":
        return <AttendanceView user={currentUser} state={dbState} onAddAttendance={handleAddAttendance} onToast={triggerToast} onRefresh={loadData} />;
      case "groups":
        return <GroupsView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} onViewSermon={(id) => { setActiveSermonId(id); setCurrentView("sermons"); }} onFloatVideo={(url, title) => setFloatingVideo({ url, title, isMinimized: false })} />;
      case "certificates":
        return <CertificatesView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} />;
      case "giving":
        return <GivingView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} onUpdateState={(state: any) => setDbState(state)} />;
      case "tasks":
        return <TasksView user={currentUser} state={dbState} onUpdateTask={handleUpdateTask} onToast={triggerToast} onUpdateState={(state: any) => setDbState(state)} />;
      case "messages":
        return <MessagesView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} onViewSermon={(id) => { setActiveSermonId(id); setCurrentView("sermons"); }} />;
      case "reports":
        return <ReportsView user={currentUser} state={dbState} />;
      case "live":
        return <LiveStreamView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} />;
      case "users":
        return <UsersView user={currentUser} state={dbState} onToast={triggerToast} onRefresh={loadData} />;
      case "settings":
        return <SettingsView user={currentUser} state={dbState} onUpdateUser={(updatedUser) => setCurrentUser(updatedUser)} onToast={triggerToast} onRefresh={loadData} />;
      case "profile":
        return <ProfileView user={currentUser} />;
      default:
        return <DashboardView user={currentUser} state={dbState} setCurrentView={setCurrentView} onToast={triggerToast} onRefreshData={loadData} />;
    }
  };

  // If loading seed files
  if (!dbState) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 animate-bounce shadow-lg shadow-blue-100">
          <Church size={24} />
        </div>
        <p className="text-slate-500 text-xs font-semibold animate-pulse">Establishing full-stack church database session...</p>
      </div>
    );
  }

  // Auth gate
  if (!currentUser) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleLogin(emailInput, passwordInput);
    };

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 md:p-8" id="portal-login-gate">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                <Church size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight animate-fade-in">Ecclesiastical Portal</h2>
                <p className="text-slate-500 text-xs font-semibold">
                  Church Kingly Anointed App Management
                </p>
              </div>
            </div>

            {authMode === "login" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="mt-0.5">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Email Address or Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. pastor@church.org or +260 977 111111"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-600 block">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(emailInput);
                        setAuthError(null);
                        setAuthMode("forgot");
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Enter account password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <LogIn size={14} />
                  <span>Sign In to Portal</span>
                </button>
              </form>
            )}

            {authMode === "forgot" && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">Reset Password Request</h3>
                  <p className="text-slate-500 text-[10px] leading-normal font-semibold">
                    Enter your account email below, and we'll issue a security verification reset code.
                  </p>
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="mt-0.5">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Registered Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="e.g. pastor@church.org"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Key size={14} />
                    <span>Send Reset Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}

            {authMode === "reset" && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">Enter Reset Verification</h3>
                  <p className="text-slate-500 text-[10px] leading-normal font-semibold">
                    Please check the floating toast message for your 6-digit reset code.
                  </p>
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="mt-0.5">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-center tracking-widest font-mono text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block">Choose New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="At least 4 characters"
                    value={newPasswordVal}
                    onChange={(e) => setNewPasswordVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={14} />
                    <span>Update Password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("forgot");
                      setAuthError(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    Back to Code Request
                  </button>
                </div>
              </form>
            )}

            {authMode === "mfa" && (
              <form onSubmit={handleMfaVerifySubmit} className="space-y-4">
                <div className="space-y-1 text-center">
                  <div className="mx-auto w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2 animate-pulse">
                    <Shield size={20} />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">Two-Factor Security Code</h3>
                  <p className="text-slate-500 text-[10px] leading-normal font-semibold">
                    Your account is protected by 2FA. Enter the security verification code.
                  </p>
                  {tempCodeShown && (
                    <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2 text-blue-700 text-[9px] font-mono select-all">
                      ℹ️ Sandbox Assist Code: <strong className="text-xs">{tempCodeShown}</strong>
                    </div>
                  )}
                </div>

                {authError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
                    <span className="mt-0.5">⚠️</span>
                    <span>{authError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 block text-center">6-Digit Verification Code</label>
                  <input
                    type="text"
                    required
                    placeholder="000000"
                    value={mfaCodeVal}
                    onChange={(e) => setMfaCodeVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-center tracking-widest font-mono text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Shield size={14} />
                    <span>Verify & Access Portal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setAuthError(null);
                      setMfaEmail("");
                      setMfaCodeVal("");
                      setTempCodeShown(null);
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                  >
                    Cancel & Return
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-semibold">
            <span className="text-slate-600 block mb-1">⛪ Welcome to the Ecclesiastical Portal</span>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Welcome back! Please enter your credentials to access the church administration and leadership system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex pb-16 md:pb-0" id="portal-app-wrapper">
      {/* Sidebar Navigation */}
      <Sidebar
        user={currentUser}
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Panel Content Area */}
      <div className="flex-1 md:pl-60 min-w-0 flex flex-col min-h-screen pb-6 md:pb-0">
        <Topbar
          user={currentUser}
          currentView={currentView}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          churchName={dbState?.churches?.[0]?.name || "Church Kingly Anointed App"}
          onToast={triggerToast}
          state={dbState}
          onRefresh={loadData}
        />

        <main className="p-5 flex-1 max-w-7xl w-full mx-auto" id="portal-main-viewpane">
          {renderView()}
        </main>
      </div>

      {/* Mobile / Tablet Bottom Navigation Bar (Fixed, Icons Only) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 z-50 flex items-center justify-around py-2 px-3 shadow-2xl"
        id="mobile-bottom-nav"
      >
        <button
          onClick={() => setCurrentView("dashboard")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentView === "dashboard" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-dashboard"
          title="Dashboard"
        >
          <Home size={22} />
        </button>

        <button
          onClick={() => setCurrentView("live")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all relative cursor-pointer ${
            currentView === "live" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-live"
          title="Watch Live"
        >
          <Tv size={22} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
        </button>

        <button
          onClick={() => setCurrentView("sermons")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentView === "sermons" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-sermons"
          title="Sermons"
        >
          <BookOpen size={22} />
        </button>

        <button
          onClick={() => setCurrentView("events")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentView === "events" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-events"
          title="Events"
        >
          <Calendar size={22} />
        </button>

        <button
          onClick={() => setCurrentView("prayer")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentView === "prayer" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-prayer"
          title="Prayer Requests"
        >
          <Heart size={22} />
        </button>

        <button
          onClick={() => setCurrentView("giving")}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            currentView === "giving" ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-giving"
          title="My Giving"
        >
          <DollarSign size={22} />
        </button>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${
            mobileOpen ? "text-blue-400 bg-white/10 font-bold" : "text-slate-400 hover:text-white"
          }`}
          id="mobile-nav-menu"
          title="Menu"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Persistent Global Floating Video / Livestream Player (Picture-in-Picture) */}
      {floatingVideo && (
        <div 
          className={`fixed z-[9999] transition-all duration-300 shadow-2xl bg-slate-900 border border-slate-700 overflow-hidden flex flex-col ${
            floatingVideo.isMinimized 
              ? "bottom-20 right-4 w-72 h-14 rounded-full" 
              : "bottom-20 right-4 w-80 md:w-96 aspect-video rounded-2xl"
          }`}
          style={{ boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.5), 0 8px 10px -6px rgb(0 0 0 / 0.5)" }}
        >
          {floatingVideo.isMinimized ? (
            // Minimized Background/Audio Pill
            <div className="flex items-center justify-between w-full h-full px-4 text-white">
              <div className="flex items-center gap-2 truncate flex-1 pr-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-[11px] font-bold truncate">Listening: {floatingVideo.title}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => setFloatingVideo(prev => prev ? { ...prev, isMinimized: false } : null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Expand Video"
                >
                  <Maximize2 size={14} />
                </button>
                <button
                  onClick={() => setFloatingVideo(null)}
                  className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Stream"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            // Full Video Frame
            <div className="relative w-full h-full flex flex-col">
              {/* Header Bar */}
              <div className="bg-slate-950/80 backdrop-blur-sm px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 text-white select-none absolute top-0 left-0 w-full z-10">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
                  <p className="text-[10px] font-extrabold tracking-tight truncate">{floatingVideo.title}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => setFloatingVideo(prev => prev ? { ...prev, isMinimized: true } : null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Minimize to Background"
                  >
                    <Minimize2 size={12} />
                  </button>
                  <button
                    onClick={() => setFloatingVideo(null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>

              {/* Video Content */}
              <div className="flex-1 w-full h-full pt-8">
                {floatingVideo.url.includes("youtube.com") || floatingVideo.url.includes("youtu.be") ? (
                  <iframe
                    src={getYouTubeEmbedUrl(floatingVideo.url)}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-white p-4 text-center space-y-2">
                    <div className="relative">
                      <div className="animate-ping absolute inset-0 rounded-full bg-blue-500/30"></div>
                      <Radio className="text-blue-400 relative z-10 animate-pulse" size={32} />
                    </div>
                    <div className="px-2">
                      <p className="text-[11px] font-bold text-slate-200 truncate max-w-xs">{floatingVideo.title}</p>
                      <a 
                        href={floatingVideo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-[10px] bg-blue-600 hover:bg-blue-700 font-extrabold text-white px-4 py-1.5 rounded-full transition-colors cursor-pointer shadow-lg shadow-blue-500/20"
                      >
                        Join Interactive Meet <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Auto-dismiss toast */}
      {toastMessage && (
        <div
          className="fixed bottom-20 right-5 bg-slate-900 border border-slate-800 text-white text-xs px-4 py-3 rounded-xl shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 max-w-xs md:max-w-sm flex items-center gap-2.5 font-semibold"
          id="system-toast-alert"
        >
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-[10px]">
            ⚡
          </div>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  let videoId = "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    videoId = match[2];
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
}
