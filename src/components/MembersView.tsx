import React, { useState, useEffect } from "react";
import { Users, CheckCircle, Calendar, Shield, Search, Plus, UserPlus, MessageSquare, Upload, History, Send } from "lucide-react";
import { User, DatabaseState, Member, UserRole } from "../types";
import { avatarBg, initials } from "./Sidebar";

interface MembersViewProps {
  user: User;
  state: DatabaseState;
  onAddMember: (member: Partial<Member>) => void;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
}

export function MembersView({ user, state, onAddMember, onToast, onRefresh }: MembersViewProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);
  const [isTogglingFinance, setIsTogglingFinance] = useState<string | null>(null);

  // Bulk Import States
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  // SMS Broadcast States
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [smsHistory, setSmsHistory] = useState<any[]>([]);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const loadSmsBroadcasts = async () => {
    try {
      const res = await fetch("/api/sms/broadcasts");
      const data = await res.json();
      if (data.success) {
        setSmsHistory(data.broadcasts || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showSmsModal) {
      loadSmsBroadcasts();
    }
  }, [showSmsModal]);

  const handleSendSmsBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsMessage.trim()) {
      onToast("SMS message content cannot be empty.");
      return;
    }
    setIsSendingSms(true);
    try {
      const res = await fetch("/api/sms/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: smsMessage, senderName: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`SMS broadcast successfully sent to ${data.broadcast.recipientCount} subscribers!`);
        setSmsMessage("");
        setSmsHistory(data.state.smsBroadcasts || []);
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to broadcast SMS.");
      }
    } catch (err) {
      onToast("Error broadcasting SMS.");
    } finally {
      setIsSendingSms(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      onToast("Please paste some contact records first.");
      return;
    }
    setIsBulkUploading(true);
    try {
      const lines = bulkText.split("\n");
      const parsedMembers = lines
        .map((line) => {
          const parts = line.split(",").map((p) => p.trim());
          if (parts.length === 0 || !parts[0]) return null;
          return {
            name: parts[0],
            email: parts[1] || `${parts[0].toLowerCase().replace(/\s+/g, "")}@church.org`,
            phone: parts[2] || "",
            role: (parts[3]?.toLowerCase() as UserRole) || "member",
          };
        })
        .filter(Boolean);

      if (parsedMembers.length === 0) {
        onToast("No valid contact rows detected.");
        setIsBulkUploading(false);
        return;
      }

      const res = await fetch("/api/members/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: parsedMembers }),
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully imported ${parsedMembers.length} contacts!`);
        setBulkText("");
        setShowBulkModal(false);
        if (onRefresh) onRefresh();
      } else {
        onToast("Bulk upload failed.");
      }
    } catch (err) {
      onToast("Error processing bulk contacts.");
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleToggleDuty = async (memberId: string, name: string) => {
    setIsToggling(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/toggle-duty`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Attendance Duty toggled for ${name}!`);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        onToast("Failed to change assignment.");
      }
    } catch (err) {
      onToast("Network Error: Could not assign duty.");
    } finally {
      setIsToggling(null);
    }
  };

  const handleToggleFinance = async (memberId: string, name: string) => {
    setIsTogglingFinance(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}/toggle-finance-duty`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Finance visibility assignment toggled for ${name}!`);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        onToast("Failed to change finance access assignment.");
      }
    } catch (err) {
      onToast("Network Error: Could not assign finance level.");
    } finally {
      setIsTogglingFinance(null);
    }
  };

  // Form states
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [newPastorType, setNewPastorType] = useState<'main' | 'associate'>("associate");

  // Edit / Delete states
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("member");
  const [editStatus, setEditStatus] = useState<string>("active");
  const [editPassword, setEditPassword] = useState("");
  const [editSpiritualGrowthLevel, setEditSpiritualGrowthLevel] = useState("");
  const [editPastorType, setEditPastorType] = useState<'main' | 'associate'>("associate");
  const [editClassEnrollment, setEditClassEnrollment] = useState("");
  const [editXp, setEditXp] = useState<number | string>("");
  const [editIsMinistryVolunteer, setEditIsMinistryVolunteer] = useState<boolean>(false);
  const [editAssignedMembersLog, setEditAssignedMembersLog] = useState<boolean>(false);
  const [editAssignedAttendanceDuty, setEditAssignedAttendanceDuty] = useState<boolean>(false);
  const [editAssignedFinanceDuty, setEditAssignedFinanceDuty] = useState<boolean>(false);
  const [editSpiritualGrowthNote, setEditSpiritualGrowthNote] = useState<string>("");
  const [deletingMember, setDeletingMember] = useState<any | null>(null);

  // Pastor, Elder, Deacon, Admin can edit/upload/broadcast (Deacon added as requested)
  const canEdit = ["pastor", "admin", "elder", "deacon"].includes(user.role);
  const isPastor = user.role === "pastor";

  const mergedMembers = React.useMemo(() => {
    const membersList = [...(state.members || [])];
    if (state.users) {
      state.users.forEach((u) => {
        const exists = membersList.some(
          (m) =>
            (m.id && m.id === u.id) ||
            (m.email && u.email && m.email.toLowerCase() === u.email.toLowerCase()) ||
            (m.name && u.name && m.name.toLowerCase() === u.name.toLowerCase())
        );
        if (!exists) {
          membersList.push({
            id: u.id,
            name: u.name,
            email: u.email || "",
            phone: u.phone || "",
            role: u.role,
            memberSince: u.memberSince || "2020-01-01",
            status: "active",
            attendance: 95,
            groups: [],
            assignedAttendanceDuty: u.assignedAttendanceDuty || false,
            assignedFinanceDuty: u.assignedFinanceDuty || false,
            assignedMembersLog: u.assignedMembersLog || false,
            spiritualGrowthLevel: u.spiritualGrowthLevel || "",
            classEnrollment: u.classEnrollment || "",
            xp: u.xp || 0,
            isMinistryVolunteer: u.isMinistryVolunteer || false,
            spiritualGrowthNote: u.spiritualGrowthNote || "",
          });
        }
      });
    }
    return membersList.map(m => {
      const matchedUser = state.users?.find(
        (u) =>
          u.id === m.id ||
          (u.email && m.email && u.email.toLowerCase() === m.email.toLowerCase()) ||
          (u.name && m.name && u.name.toLowerCase() === m.name.toLowerCase())
      );
      return {
        ...m,
        assignedAttendanceDuty: matchedUser?.assignedAttendanceDuty ?? m.assignedAttendanceDuty ?? false,
        assignedFinanceDuty: matchedUser?.assignedFinanceDuty ?? m.assignedFinanceDuty ?? false,
        assignedMembersLog: matchedUser?.assignedMembersLog ?? m.assignedMembersLog ?? false,
        spiritualGrowthLevel: matchedUser?.spiritualGrowthLevel ?? m.spiritualGrowthLevel ?? "",
        classEnrollment: matchedUser?.classEnrollment ?? m.classEnrollment ?? "",
        xp: matchedUser?.xp ?? m.xp ?? 0,
        isMinistryVolunteer: matchedUser?.isMinistryVolunteer ?? m.isMinistryVolunteer ?? false,
        spiritualGrowthNote: matchedUser?.spiritualGrowthNote ?? m.spiritualGrowthNote ?? "",
      };
    });
  }, [state.members, state.users]);

  const filteredMembers = mergedMembers.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleEditMemberClick = (m: any) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditEmail(m.email || "");
    setEditPhone(m.phone || "");
    setEditRole(m.role);
    setEditStatus(m.status || "active");
    setEditPassword("");
    setEditSpiritualGrowthLevel(m.spiritualGrowthLevel || "");
    setEditPastorType(m.pastorType || "associate");
    setEditClassEnrollment(m.classEnrollment || "");
    setEditXp(m.xp !== undefined ? Number(m.xp) : 0);
    setEditIsMinistryVolunteer(!!m.isMinistryVolunteer);
    setEditAssignedMembersLog(!!m.assignedMembersLog);
    setEditAssignedAttendanceDuty(!!m.assignedAttendanceDuty);
    setEditAssignedFinanceDuty(!!m.assignedFinanceDuty);
    setEditSpiritualGrowthNote(m.spiritualGrowthNote || "");
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    try {
      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          status: editStatus,
          password: editPassword,
          spiritualGrowthLevel: editSpiritualGrowthLevel,
          classEnrollment: editClassEnrollment,
          xp: editXp !== "" ? Number(editXp) : 0,
          isMinistryVolunteer: editIsMinistryVolunteer,
          assignedMembersLog: editAssignedMembersLog,
          assignedAttendanceDuty: editAssignedAttendanceDuty,
          assignedFinanceDuty: editAssignedFinanceDuty,
          pastorType: editRole === "pastor" ? editPastorType : undefined,
          spiritualGrowthNote: editSpiritualGrowthNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully updated record for ${editName}!`);
        setEditingMember(null);
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to update member.");
      }
    } catch (err) {
      onToast("Error updating member profile.");
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    try {
      const res = await fetch(`/api/members/${deletingMember.id}?role=${user.role}&userName=${encodeURIComponent(user.name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          onToast("Deletion request has been submitted to Lead Pastor for certification.");
        } else {
          onToast(`Successfully removed ${deletingMember.name} from the directory.`);
        }
        setDeletingMember(null);
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to delete member.");
      }
    } catch (err) {
      onToast("Error deleting member.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      onToast("Name and Email are required");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    onAddMember({
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      memberSince: today,
      pastorType: newRole === "pastor" ? newPastorType : undefined,
      spiritualGrowthLevel: newRole === "pastor" && newPastorType === "main" ? "Spiritual Father / Pastor" : (newRole === "pastor" ? "Ministry Volunteer" : "Visitor"),
    });
    // Reset
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("member");
    setNewPastorType("associate");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6" id="members-directory-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Member & leadership directory</h2>
          <p className="text-slate-500 text-xs mt-1">Monitor and update the spiritual assembly records</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSmsModal(true)}
              className="inline-flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              id="sms-broadcast-trigger"
            >
              <MessageSquare size={14} />
              <span>SMS Broadcast</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-905 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              id="bulk-upload-trigger"
            >
              <Upload size={14} />
              <span>Upload Contacts</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              id="add-member-trigger"
            >
              <UserPlus size={14} />
              <span>Add Contact</span>
            </button>
          </div>
        )}
      </div>

      {/* Directory Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Registered</div>
          <div className="text-xl font-bold text-slate-800 mt-1">{state.members?.length || 0}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Active Assembly</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">
            {state.members?.filter((m) => m.status === "active").length || 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Deacons & Elders</div>
          <div className="text-xl font-bold text-purple-600 mt-1">
            {state.members?.filter((m) => ["deacon", "elder"].includes(m.role)).length || 0}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Avg Attendance</div>
          <div className="text-xl font-bold text-blue-600 mt-1">84%</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            id="members-search-input"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
            id="members-role-filter"
          >
            <option value="all">All Roles</option>
            <option value="member">Members</option>
            <option value="deacon">Deacons</option>
            <option value="elder">Elders</option>
            <option value="pastor">Pastors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="members-directory-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] uppercase font-bold tracking-wider">
                <th className="p-4">Member Name</th>
                <th className="p-4">Church Role</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Member Since</th>
                <th className="p-4">Attendance</th>
                <th className="p-4">Logging Duty</th>
                <th className="p-4">Finance Level</th>
                <th className="p-4">Status</th>
                {canEdit && <th className="p-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs select-none shrink-0"
                        style={{ backgroundColor: avatarBg(m.name) }}
                      >
                        {initials(m.name)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{m.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      m.role === "pastor" ? "bg-amber-50 text-amber-700" :
                      m.role === "admin" ? "bg-red-50 text-red-700" :
                      m.role === "elder" ? "bg-purple-50 text-purple-700" :
                      m.role === "deacon" ? "bg-emerald-50 text-emerald-700" :
                      "bg-blue-50 text-blue-700"
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-550 font-medium">{m.phone || "—"}</td>
                  <td className="p-4 text-slate-400 font-medium">
                    {new Date(m.memberSince).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${m.attendance > 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${m.attendance}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700 text-[11px]">{m.attendance}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {canEdit ? (
                      <button
                        onClick={() => handleToggleDuty(m.id, m.name)}
                        disabled={isToggling !== null}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          m.assignedAttendanceDuty
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250"
                        }`}
                      >
                        {m.assignedAttendanceDuty ? "✓ Assigned" : "Assign"}
                      </button>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase ${
                        m.assignedAttendanceDuty ? "text-emerald-600 font-extrabold" : "text-slate-400"
                      }`}>
                        {m.assignedAttendanceDuty ? "Active Duty" : "None"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    {user.role === "pastor" ? (
                      <button
                        onClick={() => handleToggleFinance(m.id, m.name)}
                        disabled={isTogglingFinance !== null}
                        className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          m.assignedFinanceDuty
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250"
                        }`}
                      >
                        {m.assignedFinanceDuty ? "✓ Allowed" : "Assign"}
                      </button>
                    ) : (
                      <span className={`text-[10px] font-bold uppercase ${
                        m.assignedFinanceDuty ? "text-amber-600 font-extrabold" : "text-slate-400"
                      }`}>
                        {m.assignedFinanceDuty ? "Allowed" : "Restricted"}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      m.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      <CheckCircle size={10} className={m.status === "active" ? "text-emerald-600" : "text-slate-400"} />
                      <span className="capitalize">{m.status}</span>
                    </span>
                  </td>
                  {canEdit && (
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleEditMemberClick(m)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold px-2 py-1 rounded-md text-[10px] uppercase cursor-pointer transition-all border border-slate-250"
                        >
                          Edit
                        </button>
                        {isPastor && (
                          <button
                            onClick={() => setDeletingMember(m)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold px-2.5 py-1 rounded-md text-[10px] uppercase cursor-pointer transition-all border border-rose-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-slate-450 italic font-medium">
                    No matching members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="add-member-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Add New Registered Member</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="member@church.org"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Phone Number</label>
                <input
                  type="text"
                  placeholder="+260 977 123 456"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Spiritual Office / Role</label>
                <select
                  disabled={!isPastor}
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="member">Member</option>
                  <option value="deacon">Deacon</option>
                  <option value="elder">Elder</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {newRole === "pastor" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-indigo-950 font-extrabold text-[11px] uppercase tracking-wider">Pastor Assignment Type *</label>
                  <select
                    disabled={!isPastor}
                    value={newPastorType}
                    onChange={(e) => {
                      const val = e.target.value as 'main' | 'associate';
                      setNewPastorType(val);
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none font-bold text-indigo-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="associate">Associate Pastor</option>
                    <option value="main">Main / Senior Pastor</option>
                  </select>
                  <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                    {newPastorType === "main" 
                      ? "💡 Senior Pastors default to the 'Spiritual Father / Pastor' Discipleship Pathway Stage." 
                      : "💡 Associate Pastors default to the 'Ministry Volunteer' stage."}
                  </p>
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                 >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" id="bulk-upload-modal">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                <Upload size={16} className="text-blue-600" />
                <span>Bulk Import Contacts</span>
              </h3>
              <button onClick={() => setShowBulkModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleBulkSubmit} className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3.5 rounded-lg leading-relaxed font-semibold">
                Paste contact lists here. Each row must use commas to separate details in the order:<br />
                <strong>Full Name, Email (optional), Phone (optional), Role (optional)</strong>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Contact List (One entry per line)</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Mary Banda, mary.b@gmail.com, +260977112233, member&#10;Deacon Winnie, winnie@church.org, +260955443322, deacon&#10;Elder James, james@church.org, +260966778899, elder"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-mono focus:border-blue-500 whitespace-pre"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBulkUploading}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {isBulkUploading ? "Importing..." : "Import Contacts List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SMS Broadcast Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" id="sms-broadcast-modal">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden text-xs flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-850 text-sm flex items-center gap-1.5">
                <MessageSquare size={16} className="text-rose-600 animate-pulse" />
                <span>SMS Broadcast Center</span>
              </h3>
              <button onClick={() => setShowSmsModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="bg-rose-50 text-rose-800 p-3.5 rounded-lg leading-relaxed font-semibold">
                We detected <strong>{state.members?.filter(m => m.phone && m.phone.trim().length > 0).length || 0}</strong> active contacts with registered phone numbers in the database who will receive this broadcast alert.
              </div>
              
              <form onSubmit={handleSendSmsBroadcast} className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">SMS Text Content</label>
                  <textarea
                    rows={4}
                    required
                    maxLength={160}
                    placeholder="Type urgent church announcement, service cancellation alert, or outreach broadcast..."
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-sans focus:border-rose-500"
                  />
                  <div className="text-right text-[10px] text-slate-400 font-semibold mt-1">
                    {smsMessage.length}/160 characters (1 SMS credit unit)
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSmsModal(false)}
                    className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSms}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1"
                  >
                    <Send size={12} />
                    <span>{isSendingSms ? "Broadcasting..." : "Send SMS Broadcast"}</span>
                  </button>
                </div>
              </form>

              {/* Broadcast Log */}
              <div className="pt-4 border-t border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-700 flex items-center gap-1">
                  <History size={14} className="text-slate-400" />
                  <span>SMS Broadcast History Log</span>
                </h4>
                
                {smsHistory.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 font-medium italic">No previous SMS broadcasts found.</p>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {smsHistory.map((h: any) => (
                      <div key={h.id} className="bg-slate-50 border border-slate-150 rounded-lg p-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500">
                          <span>By: <strong>{h.sender}</strong></span>
                          <span>{new Date(h.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-sans">{h.message}</p>
                        <div className="text-[9px] text-emerald-600 font-extrabold">
                          ✓ Sent to {h.recipientCount} subscribers
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member/Login Account Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150" id="edit-member-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
                <span>Edit Profile & Credentials</span>
              </h3>
              <button
                onClick={() => setEditingMember(null)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            
            {/* Elegant banner explaining permissions if the current user is not a pastor */}
            {!isPastor && (
              <div className="bg-amber-50 border-b border-amber-100 p-3 text-[10px] text-amber-800 font-bold flex gap-1.5 leading-relaxed">
                <span>⚠️</span>
                <span>As a {user.role}, you are authorized to update the Spiritual Growth Notes, while profile configuration and role assignments are restricted to Pastors.</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  disabled={!isPastor}
                  placeholder="Enter full name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  disabled={!isPastor}
                  placeholder="email@church.org"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Phone Number</label>
                <input
                  type="text"
                  disabled={!isPastor}
                  placeholder="e.g. +260 977 123 456"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Church Office / Role</label>
                <select
                  disabled={!isPastor}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="member">Member</option>
                  <option value="deacon">Deacon</option>
                  <option value="elder">Elder</option>
                  <option value="pastor">Pastor</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {editRole === "pastor" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-indigo-950 font-extrabold text-[11px] uppercase tracking-wider">Pastor Assignment Type *</label>
                  <select
                    disabled={!isPastor}
                    value={editPastorType}
                    onChange={(e) => {
                      const val = e.target.value as 'main' | 'associate';
                      setEditPastorType(val);
                      if (val === "main") {
                        setEditSpiritualGrowthLevel("Spiritual Father / Pastor");
                      } else {
                        setEditSpiritualGrowthLevel("Ministry Volunteer");
                      }
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none font-bold text-indigo-900 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="associate">Associate Pastor</option>
                    <option value="main">Main / Senior Pastor</option>
                  </select>
                  <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                    {editPastorType === "main" 
                      ? "💡 Senior Pastors default to the 'Spiritual Father / Pastor' Discipleship Pathway Stage." 
                      : "💡 Associate Pastors default to the 'Ministry Volunteer' stage."}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Roster Status</label>
                <select
                  disabled={!isPastor}
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="bg-blue-50/50 p-3.5 rounded-lg border border-blue-100 space-y-3">
                <p className="font-extrabold text-blue-800 text-[11px] uppercase tracking-wider">Spiritual Growth & Leadership</p>
                
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Discipleship Stage / Spiritual Level</label>
                  <select
                    disabled={!isPastor}
                    value={editSpiritualGrowthLevel}
                    onChange={(e) => setEditSpiritualGrowthLevel(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none font-bold cursor-pointer text-xs disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">(None)</option>
                    <option value="Visitor">Visitor</option>
                    <option value="New Believer">New Believer</option>
                    <option value="Water Baptized">Water Baptized</option>
                    <option value="Ministry Volunteer">Ministry Volunteer</option>
                    <option value="Group Shepherd">Group Shepherd</option>
                    <option value="Disciple Maker">Disciple Maker</option>
                    <option value="Spiritual Father / Pastor">Spiritual Father / Pastor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Discipleship Stage Detail / Class Enrollment</label>
                  <input
                    type="text"
                    disabled={!isPastor}
                    placeholder="e.g. Enrolled in Foundation Classes"
                    value={editClassEnrollment}
                    onChange={(e) => setEditClassEnrollment(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">Experience Points (XP)</label>
                  <input
                    type="number"
                    disabled={!isPastor}
                    placeholder="e.g. 150"
                    value={editXp}
                    onChange={(e) => setEditXp(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 text-xs font-semibold font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="editIsMinistryVolunteer"
                    disabled={!isPastor}
                    checked={editIsMinistryVolunteer}
                    onChange={(e) => setEditIsMinistryVolunteer(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="editIsMinistryVolunteer" className="text-[11px] font-bold text-slate-700 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    Ministry Volunteer (Assign to Ministry Teams)
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    type="checkbox"
                    id="editAssignedMembersLog"
                    disabled={!isPastor}
                    checked={editAssignedMembersLog}
                    onChange={(e) => setEditAssignedMembersLog(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="editAssignedMembersLog" className="text-[11px] font-bold text-slate-700 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                    Assigned to Members Log Duty (Access Members/Directory Tabs)
                  </label>
                </div>

                {/* New: Spiritual Growth Notes Textarea */}
                <div className="pt-2 border-t border-blue-100">
                  <label className="block text-blue-850 font-extrabold mb-1 text-[11px] uppercase tracking-wide">
                    Spiritual Growth Notes
                  </label>
                  <textarea
                    placeholder="Write observations about their discipleship pathway progress, leadership development, or service notes..."
                    value={editSpiritualGrowthNote}
                    onChange={(e) => setEditSpiritualGrowthNote(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 text-xs font-semibold leading-relaxed shadow-inner"
                  />
                </div>
              </div>
              
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <p className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider">Login Credentials (Optional)</p>
                <p className="text-slate-500 text-[10px]">Provide a new password to update or set up their portal access credentials. Leave blank to preserve their existing password.</p>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-[11px]">New Password</label>
                  <input
                    type="password"
                    disabled={!isPastor}
                    placeholder="Enter new login password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 font-mono disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden p-6 space-y-4 text-xs animate-in zoom-in duration-150">
            <h3 className="font-extrabold text-slate-900 text-sm">Remove from Directory?</h3>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong>{deletingMember.name}</strong> from the assembly directory and revoke any associated login portal credentials? This action is permanent and cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingMember(null)}
                className="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
