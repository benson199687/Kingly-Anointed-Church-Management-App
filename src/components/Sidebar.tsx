import React from "react";
import { 
  Church, Home, Video, Calendar, Users, DollarSign, 
  MessageSquare, Settings, LogOut, Heart, Clipboard, 
  BarChart3, Brain, User as UserIcon, Megaphone, UserCheck, Sparkles, Tv, Award
} from "lucide-react";
import { User, UserRole } from "../types";

interface SidebarProps {
  user: User;
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function roleColor(role: UserRole) {
  return {
    member: "#3b82f6",
    deacon: "#10b981",
    elder: "#8b5cf6",
    pastor: "#f59e0b",
    admin: "#ef4444"
  }[role] || "#3b82f6";
}

export function roleBg(role: UserRole) {
  return {
    member: "linear-gradient(135deg, #3b82f6, #6366f1)",
    deacon: "linear-gradient(135deg, #10b981, #059669)",
    elder: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    pastor: "linear-gradient(135deg, #f59e0b, #d97706)",
    admin: "linear-gradient(135deg, #ef4444, #dc2626)"
  }[role] || "linear-gradient(135deg, #3b82f6, #6366f1)";
}

export function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
}

export function avatarBg(name: string) {
  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];
  return colors[name.charCodeAt(0) % colors.length];
}

export function Sidebar({ user, currentView, setCurrentView, onLogout, mobileOpen, setMobileOpen }: SidebarProps) {
  const color = roleColor(user.role);

  const getNavItems = (role: UserRole) => {
    const base = [{ id: "dashboard", label: "Dashboard", icon: <Home size={16} /> }];
    const roleItems = {
      member: [
        { id: "live", label: "Watch Live", icon: <Tv size={16} className="text-red-500 animate-pulse" /> },
        { id: "members", label: "Church Directory", icon: <Users size={16} /> },
        { id: "sermons", label: "Sermons", icon: <Video size={16} /> },
        { id: "events", label: "Events", icon: <Calendar size={16} /> },
        { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
        { id: "groups", label: "Small Groups", icon: <Users size={16} /> },
        { id: "prayer", label: "Prayer Requests", icon: <Heart size={16} /> },
        { id: "quiz", label: "Weekly Quiz", icon: <Brain size={16} /> },
        { id: "giving", label: "My Giving", icon: <DollarSign size={16} /> },
        { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
      ],
      deacon: [
        { id: "live", label: "Watch Live", icon: <Tv size={16} className="text-red-500 animate-pulse" /> },
        { id: "sermons", label: "Sermons", icon: <Video size={16} /> },
        { id: "groups", label: "Small Groups", icon: <Users size={16} /> },
        { id: "tasks", label: "My Tasks", icon: <Clipboard size={16} /> },
        { id: "members", label: "Members", icon: <Users size={16} /> },
        { id: "finances", label: "Finances", icon: <DollarSign size={16} /> },
        { id: "giving", label: "My Giving", icon: <DollarSign size={16} /> },
        { id: "events", label: "Events", icon: <Calendar size={16} /> },
        { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
        { id: "prayer", label: "Prayer Requests", icon: <Heart size={16} /> },
        { id: "quiz", label: "Weekly Quiz", icon: <Brain size={16} /> },
        { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
      ],
      elder: [
        { id: "live", label: "Watch Live", icon: <Tv size={16} className="text-red-500 animate-pulse" /> },
        { id: "sermons", label: "Sermons", icon: <Video size={16} /> },
        { id: "members", label: "Member Care", icon: <Heart size={16} /> },
        { id: "groups", label: "Small Groups", icon: <Users size={16} /> },
        { id: "tasks", label: "Task Management", icon: <Clipboard size={16} /> },
        { id: "finances", label: "Finances", icon: <DollarSign size={16} /> },
        { id: "giving", label: "My Giving", icon: <DollarSign size={16} /> },
        { id: "events", label: "Events", icon: <Calendar size={16} /> },
        { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
        { id: "quiz", label: "Weekly Quiz", icon: <Brain size={16} /> },
        { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
        { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
      ],
      pastor: [
        { id: "live", label: "Watch Live", icon: <Tv size={16} className="text-red-500 animate-pulse" /> },
        { id: "sermons", label: "Sermons & AI", icon: <Sparkles size={16} className="text-amber-400" /> },
        { id: "members", label: "Members", icon: <Users size={16} /> },
        { id: "groups", label: "Small Groups", icon: <Users size={16} /> },
        { id: "certificates", label: "Certificates", icon: <Award size={16} /> },
        { id: "prayer", label: "Prayer Requests", icon: <Heart size={16} /> },
        { id: "finances", label: "Finances", icon: <DollarSign size={16} /> },
        { id: "giving", label: "My Giving", icon: <DollarSign size={16} /> },
        { id: "events", label: "Events", icon: <Calendar size={16} /> },
        { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
        { id: "quiz", label: "Weekly Quiz", icon: <Brain size={16} /> },
        { id: "tasks", label: "Ministry Tasks", icon: <Clipboard size={16} /> },
        { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
        { id: "messages", label: "Communications", icon: <MessageSquare size={16} /> },
      ],
      admin: [
        { id: "live", label: "Watch Live", icon: <Tv size={16} className="text-red-500 animate-pulse" /> },
        { id: "sermons", label: "Sermons & AI", icon: <Sparkles size={16} className="text-amber-400" /> },
        { id: "members", label: "Members", icon: <Users size={16} /> },
        { id: "groups", label: "Small Groups", icon: <Users size={16} /> },
        { id: "certificates", label: "Certificates", icon: <Award size={16} /> },
        { id: "prayer", label: "Prayer Requests", icon: <Heart size={16} /> },
        { id: "tasks", label: "Task Management", icon: <Clipboard size={16} /> },
        { id: "finances", label: "Finances", icon: <DollarSign size={16} /> },
        { id: "giving", label: "My Giving", icon: <DollarSign size={16} /> },
        { id: "attendance", label: "Attendance", icon: <Clipboard size={16} /> },
        { id: "events", label: "Events", icon: <Calendar size={16} /> },
        { id: "announcements", label: "Announcements", icon: <Megaphone size={16} /> },
        { id: "quiz", label: "Weekly Quiz", icon: <Brain size={16} /> },
        { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
        { id: "messages", label: "Communications", icon: <MessageSquare size={16} /> },
        { id: "users", label: "User Management", icon: <UserCheck size={16} /> },
        { id: "settings", label: "Settings", icon: <Settings size={16} /> },
      ],
    };
    const items = [...base, ...(roleItems[role] || [])];
    const isLeadership = ["pastor", "elder", "deacon", "admin"].includes(user.role);
    const hasAttendancePermission = isLeadership || user.assignedAttendanceDuty === true;
    if (hasAttendancePermission && !items.some(item => item.id === "attendance")) {
      // Insert attendance before weekly quiz or append
      const quizIndex = items.findIndex(item => item.id === "quiz");
      if (quizIndex !== -1) {
        items.splice(quizIndex, 0, { id: "attendance", label: "Attendance", icon: <Clipboard size={16} /> });
      } else {
        items.push({ id: "attendance", label: "Attendance", icon: <Clipboard size={16} /> });
      }
    }
    const hasFinancePermission = ["pastor", "admin"].includes(user.role) || user.assignedFinanceDuty === true;
    let filtered = items;
    if (!hasFinancePermission) {
      filtered = filtered.filter(item => item.id !== "finances");
    }
    // Filter out members tab for regular member unless they are assignedMembersLog
    filtered = filtered.filter(item => {
      if (item.id === "members" && user.role === "member") {
        return !!user.assignedMembersLog;
      }
      return true;
    });
    return filtered;
  };

  const navItems = getNavItems(user.role);

  return (
    <>
      <div
        className={`fixed left-0 top-0 bottom-0 w-60 bg-slate-900 overflow-y-auto z-50 transition-transform duration-300 md:translate-x-0 flex flex-col ${
          mobileOpen ? "translate-x-0" : "-translate-x-60"
        }`}
        id="app-sidebar"
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg"
              style={{ background: roleBg(user.role) }}
            >
              <Church size={20} />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm leading-tight">Church Portal</h2>
              <p className="text-white/50 text-xs mt-0.5 capitalize">{user.role} workspace</p>
            </div>
          </div>
        </div>

        <div className="p-3 flex-1">
          <div className="px-3 py-1.5 text-[10px] font-bold text-white/35 uppercase tracking-wider">Navigation</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left ${
                    active
                      ? "bg-white/15 text-white font-semibold"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-1.5 mt-4 text-[10px] font-bold text-white/35 uppercase tracking-wider">Account</div>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentView("profile");
                setMobileOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left ${
                currentView === "profile"
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <UserIcon size={16} />
              <span>My Profile</span>
            </button>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 text-left text-red-400 hover:bg-red-500/10"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 mt-auto bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
              style={{ backgroundColor: color }}
            >
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{user.name}</div>
              <div className="text-xs text-white/50 truncate">{user.email}</div>
            </div>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}
    </>
  );
}
