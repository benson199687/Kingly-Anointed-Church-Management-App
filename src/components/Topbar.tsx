import React, { useState } from "react";
import { Menu, Bell, Check, X, UserPlus, Info, CheckCircle, Heart, DollarSign, Smartphone, Trash2 } from "lucide-react";
import { User, DatabaseState } from "../types";
import { roleColor, initials } from "./Sidebar";

interface TopbarProps {
  user: User;
  currentView: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  churchName: string;
  onToast: (msg: string) => void;
  state: DatabaseState | null;
  onRefresh: () => void;
}

export function Topbar({ user, currentView, mobileOpen, setMobileOpen, churchName, onToast, state, onRefresh }: TopbarProps) {
  const color = roleColor(user.role);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isResolvingId, setIsResolvingId] = useState<string | null>(null);

  // Thank you states
  const [thankYouText, setThankYouText] = useState("");
  const [activeThankYouNotifId, setActiveThankYouNotifId] = useState<string | null>(null);
  const [isSendingThankYou, setIsSendingThankYou] = useState(false);

  // Filter notifications privately & appropriately
  const notifications = (state?.notifications || []).filter((n) => {
    if (n.type === "prayer_alert") {
      return n.personName === user.name;
    }
    if (n.type === "connection_request") {
      return ["admin", "pastor", "elder", "deacon"].includes(user.role);
    }
    if (n.type === "mobile_money_pending") {
      return user.role === "pastor" || user.assignedFinanceDuty === true;
    }
    if (n.type === "deletion_request") {
      return user.role === "pastor" || user.role === "admin";
    }
    return true;
  });

  const pendingCount = notifications.filter((n) => n.status === "pending").length;

  const getTitle = (viewId: string) => {
    const titles: { [key: string]: string } = {
      dashboard: "Dashboard Overview",
      sermons: "Sermon Library & AI Assistant",
      members: "Member Directory",
      events: "Church Events & Schedules",
      announcements: "Announcements & Bulletins",
      prayer: "Prayer Chain Request Board",
      quiz: "Weekly Bible study quiz",
      giving: "My Financial Contributions",
      messages: "Communications Inbox",
      finances: "Church Financial Management",
      attendance: "Attendance Tracker",
      groups: "Small Groups Connection",
      tasks: "Ministry Tasks & Assignments",
      reports: "Ministry Analytics & Reports",
      users: "User Account Manager",
      settings: "Church Platform Settings",
      profile: "Personal Member Profile"
    };
    return titles[viewId] || "Portal";
  };

  const handleResolveNotif = async (id: string, action: "approve" | "dismiss") => {
    setIsResolvingId(id);
    try {
      const res = await fetch(`/api/notifications/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (data.success) {
        onToast(
          action === "approve"
            ? "Approved and resolved successfully!"
            : "Request has been dismissed."
        );
        onRefresh();
      } else {
        onToast("Could not complete request resolution.");
      }
    } catch (err) {
      onToast("Error connecting to server.");
    } finally {
      setIsResolvingId(null);
    }
  };

  const handleSendThankYou = async (id: string, targetUser: string) => {
    if (!thankYouText.trim()) {
      onToast("Please write a thank-you message first.");
      return;
    }
    setIsSendingThankYou(true);
    try {
      const res = await fetch(`/api/notifications/${id}/thank-you`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUser: user.name,
          messageText: thankYouText
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Thank you message sent to ${targetUser}'s inbox!`);
        setThankYouText("");
        setActiveThankYouNotifId(null);
        onRefresh();
      } else {
        onToast("Could not send thank-you message.");
      }
    } catch (err) {
      onToast("Error connecting to server.");
    } finally {
      setIsSendingThankYou(false);
    }
  };

  const canResolve = ["admin", "pastor", "elder", "deacon"].includes(user.role);

  return (
    <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between z-45" id="app-topbar">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          id="mobile-menu-toggle"
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="font-bold text-slate-850 text-base md:text-lg leading-tight">{getTitle(currentView)}</h1>
          <p className="text-slate-500 text-xs mt-0.5 font-medium">{churchName}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        {/* Dynamic Notification Center button */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
              notifOpen 
                ? "bg-slate-100 border-slate-300 text-slate-900 shadow-sm" 
                : "border-slate-200 hover:bg-slate-55 text-slate-600"
            }`}
            id="notification-bell"
            title="Connection Notifications"
          >
            <Bell size={18} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-550 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown notifications list */}
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-xl z-40 overflow-hidden text-xs text-slate-700 animate-in fade-in duration-150">
                <div className="p-3 bg-slate-50 border-b border-slate-150 flex justify-between items-center">
                  <span className="font-bold text-slate-800">Connection Requests & Notifications</span>
                  {pendingCount > 0 && (
                    <span className="bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                      {pendingCount} Pending
                    </span>
                  )}
                </div>

                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
                  {notifications.map((notif) => {
                    const isPending = notif.status === "pending";
                    return (
                      <div 
                        key={notif.id} 
                        className={`p-3.5 transition-all space-y-2 hover:bg-slate-50/50 ${
                          isPending ? "bg-blue-50/10 font-medium" : "opacity-75"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex gap-2 items-start">
                            {notif.type === "connection_request" ? (
                              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <UserPlus size={13} />
                              </div>
                            ) : notif.type === "deletion_request" ? (
                              <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                                <Trash2 size={13} />
                              </div>
                            ) : notif.type === "prayer_alert" ? (
                              <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                                <Heart size={12} className="fill-red-600 text-red-600" />
                              </div>
                            ) : notif.type === "mobile_money_pending" ? (
                              <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                                <Smartphone size={13} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                <Info size={13} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-800 text-[12px]">{notif.title}</div>
                              <p className="text-slate-550 text-[11px] mt-0.5 leading-normal">{notif.message}</p>
                            </div>
                          </div>
                          
                          {/* Badge */}
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                            notif.status === "approved" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : notif.status === "dismissed" 
                              ? "bg-slate-100 text-slate-500" 
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {notif.status}
                          </span>
                        </div>

                        {/* Shepherding resolution buttons / Thank You Form */}
                        {isPending && (
                          <div className="pl-8 pt-1">
                            {notif.type === "prayer_alert" ? (
                              <div className="space-y-2 mt-1">
                                {activeThankYouNotifId === notif.id ? (
                                  <div className="space-y-1.5 bg-slate-50 p-2 rounded-lg border border-slate-150">
                                    <textarea
                                      placeholder={`Write thank-you message to ${notif.targetUser}...`}
                                      value={thankYouText}
                                      onChange={(e) => setThankYouText(e.target.value)}
                                      className="w-full border border-slate-200 rounded p-1.5 text-[11px] bg-white outline-none focus:border-red-500 font-medium leading-relaxed"
                                      rows={2}
                                    />
                                    <div className="flex gap-1.5 justify-end">
                                      <button
                                        onClick={() => setActiveThankYouNotifId(null)}
                                        className="border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded text-[9px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        onClick={() => handleSendThankYou(notif.id, notif.targetUser || "")}
                                        disabled={isSendingThankYou}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-0.5 rounded text-[9px] shadow-sm transition-all cursor-pointer"
                                      >
                                        {isSendingThankYou ? "Sending..." : "Send Inbox Message"}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setThankYouText(`Dear ${notif.targetUser}, thank you so much for praying with me and lifting up my request. May God bless you!`);
                                      setActiveThankYouNotifId(notif.id);
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all border border-red-100 shadow-xs"
                                  >
                                    <Heart size={10} className="fill-red-600 text-red-600" />
                                    <span>Write Thank You Message</span>
                                  </button>
                                )}
                              </div>
                            ) : notif.type === "mobile_money_pending" ? (
                              <div className="space-y-2 mt-1 bg-rose-50/50 p-2 rounded-lg border border-rose-150 text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-500 uppercase">Category:</span>
                                  <select
                                    id={`notif-assign-cat-${notif.id}`}
                                    defaultValue="Tithe"
                                    className="bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[10px] outline-none font-semibold cursor-pointer"
                                  >
                                    {(state?.finances?.offeringTypes || ["Tithe", "Offering", "Building Fund", "Missions Care", "Benevolence", "Thanksgiving"]).map((cat: string) => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={async () => {
                                      const selectEl = document.getElementById(`notif-assign-cat-${notif.id}`) as HTMLSelectElement;
                                      const selectedCategory = selectEl ? selectEl.value : "Tithe";
                                      try {
                                        const res = await fetch(`/api/finances/mobile-money/${notif.transactionId}/approve`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ category: selectedCategory, approvedBy: user.name })
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          onToast(`Approved & posted K${data.transaction?.amount || ""} as ${selectedCategory}!`);
                                          onRefresh();
                                        } else {
                                          onToast("Failed to approve transaction.");
                                        }
                                      } catch (err) {
                                        onToast("Network error approving transaction.");
                                      }
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded text-[9px] shadow-sm transition-all cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Check size={10} />
                                    <span>Approve & Post</span>
                                  </button>
                                </div>
                              </div>
                            ) : notif.type === "deletion_request" ? (
                              user.role === "pastor" ? (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleResolveNotif(notif.id, "dismiss")}
                                    disabled={isResolvingId === notif.id}
                                    className="border border-slate-200 hover:bg-slate-100 hover:text-slate-700 text-slate-500 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                  <button
                                    onClick={() => handleResolveNotif(notif.id, "approve")}
                                    disabled={isResolvingId === notif.id}
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center gap-0.5 shadow-sm transition-colors cursor-pointer"
                                  >
                                    <Check size={11} />
                                    <span>{isResolvingId === notif.id ? "Processing..." : "Approve Deletion"}</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                  Pending approval by Lead Pastor
                                </span>
                              )
                            ) : canResolve ? (
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleResolveNotif(notif.id, "dismiss")}
                                  disabled={isResolvingId === notif.id}
                                  className="border border-slate-200 hover:bg-slate-100 hover:text-slate-700 text-slate-500 font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={() => handleResolveNotif(notif.id, "approve")}
                                  disabled={isResolvingId === notif.id}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[10px] flex items-center gap-0.5 shadow-sm transition-colors cursor-pointer"
                                >
                                  <Check size={11} />
                                  <span>{isResolvingId === notif.id ? "Adding..." : "Approve & Add"}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                Pending review by Pastor, Elder, or Deacon
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="text-[9px] text-slate-400 pl-8 font-mono">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    );
                  })}

                  {notifications.length === 0 && (
                    <div className="p-8 text-center text-slate-400 italic">No notifications found.</div>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center text-[10px] text-slate-500 font-semibold">
                  Secured Ecclesiastical Connection Center
                </div>
              </div>
            </>
          )}
        </div>

        <div
          onClick={() => onToast("Your account settings can be modified in My Profile.")}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs cursor-pointer select-none shrink-0"
          style={{ backgroundColor: color }}
          id="topbar-avatar"
        >
          {initials(user.name)}
        </div>
      </div>
    </div>
  );
}
