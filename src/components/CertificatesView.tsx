import React, { useState } from "react";
import { 
  Award, Search, Filter, Download, Printer, CheckCircle, 
  Clock, RefreshCw, FileSpreadsheet, Eye, ChevronDown, Check, ShieldAlert, Lock
} from "lucide-react";
import { generateCertificatePdf } from "../lib/pdfHelper";
import { SEED_LESSONS } from "./GroupsView";

interface CertificatesViewProps {
  user: any;
  state: any;
  onToast: (msg: string) => void;
  onRefresh: () => void;
}

export default function CertificatesView({ user, state, onToast, onRefresh }: CertificatesViewProps) {
  // Access gate
  const isAuthorized = ["pastor", "admin"].includes(user?.role);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Access Denied</h3>
        <p className="text-slate-500 text-xs max-w-md font-medium leading-relaxed">
          Only the Senior Pastor or System Administrators are authorized to access the Certificate Management Registry.
        </p>
      </div>
    );
  }

  // State definitions
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all"); // "all", "graduated", "studying"
  const [certStatusFilter, setCertStatusFilter] = useState<string>("all"); // "all", "Pending", "Approved", "Printed"
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null); // studentName-groupId

  // Heuristics for course/class groups
  const classGroups = (state.groups || []).filter((g: any) => 
    g.type === "class" || g.leader?.toLowerCase().includes("teacher") || g.name?.toLowerCase().includes("class") || g.name?.toLowerCase().includes("training")
  );

  // Flatten students list across filtered groups to build the table
  const allRows: any[] = [];

  classGroups.forEach((group: any) => {
    // Only process if group matches selectedGroup filter
    if (selectedGroup !== "all" && group.id !== selectedGroup) return;

    // Get all explicit members in the group, filtering out pastors and leaders
    const studentNames = (group.memberNames && group.memberNames.length > 0
      ? group.memberNames
      : []
    ).filter((name: string) => {
      const memObj = (state.members || []).find((m: any) => m.name === name);
      if (memObj?.role === "pastor" || name === group.leader) return false;
      return true;
    });

    studentNames.forEach((name: string) => {
      // Avoid duplicate display of same name in same group
      if (allRows.some(r => r.name === name && r.groupId === group.id)) return;

      const progress = group.studentProgress?.[name];
      const completedCount = progress?.completedLessons?.length || 0;
      const isPreloaded = group.id === "1783420856423" || group.id === "1783422112044";
      const groupLessonsCount = (isPreloaded ? SEED_LESSONS.length : 0) + (group.lessons || []).length;
      const isGraduate = completedCount >= groupLessonsCount && groupLessonsCount > 0;

      // Status of certificate (Approved, Pending, Printed)
      const certStatus = progress?.certificateStatus || "Pending";
      const certId = progress?.certificateId || `CERT-${new Date().getFullYear()}-${String(Math.abs(name.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0))).substring(0, 4).padStart(4, "0")}`;
      const completedDate = progress?.completedDate || (isGraduate ? "2026-06-25" : "—");

      allRows.push({
        id: `${group.id}-${name}`,
        name,
        groupName: group.name,
        groupId: group.id,
        completedCount,
        totalLessons: groupLessonsCount,
        isGraduate,
        certStatus,
        certId,
        completedDate,
        group
      });
    });
  });

  // Apply filters
  const filteredRows = allRows.filter(row => {
    // Search
    const matchesSearch = row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          row.groupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          row.certId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Graduation Filter
    let matchesGrad = true;
    if (statusFilter === "graduated") matchesGrad = row.isGraduate;
    if (statusFilter === "studying") matchesGrad = !row.isGraduate;

    // Certificate Status Filter
    let matchesCertStatus = true;
    if (certStatusFilter !== "all") matchesCertStatus = row.certStatus === certStatusFilter;

    return matchesSearch && matchesGrad && matchesCertStatus;
  });

  // Select handlers
  const handleToggleSelectAll = () => {
    const visibleIds = filteredRows.map(r => r.id);
    const allSelected = visibleIds.every(id => selectedStudents.includes(id));

    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const toAdd = visibleIds.filter(id => !selectedStudents.includes(id));
      setSelectedStudents(prev => [...prev, ...toAdd]);
    }
  };

  const handleToggleSelectRow = (rowId: string) => {
    setSelectedStudents(prev => 
      prev.includes(rowId) ? prev.filter(id => id !== rowId) : [...prev, rowId]
    );
  };

  // Bulk Approve Handler
  const handleBulkApprove = async () => {
    const targets = filteredRows.filter(r => selectedStudents.includes(r.id) && r.certStatus === "Pending");
    if (targets.length === 0) {
      onToast("No pending certificates selected for approval.");
      return;
    }

    setIsUpdatingStatus("bulk");
    onToast(`Approving ${targets.length} certificate(s)...`);

    const updatesByGroup: { [groupId: string]: { [studentName: string]: any } } = {};
    
    targets.forEach(row => {
      if (!updatesByGroup[row.groupId]) {
        updatesByGroup[row.groupId] = { ...(row.group.studentProgress || {}) };
      }
      
      const name = row.name;
      if (!updatesByGroup[row.groupId][name]) {
        updatesByGroup[row.groupId][name] = {
          userId: name,
          completedLessons: [],
          completedModules: [],
          completedCourses: [],
          quizAttempts: {},
          examAttempts: {},
          certificates: []
        };
      }
      
      updatesByGroup[row.groupId][name] = {
        ...updatesByGroup[row.groupId][name],
        certificateStatus: "Approved",
        certificateId: row.certId,
        completedDate: row.completedDate === "—" ? new Date().toISOString().split("T")[0] : row.completedDate
      };
    });

    try {
      const groupIds = Object.keys(updatesByGroup);
      const promises = groupIds.map(async (groupId) => {
        const res = await fetch(`/api/groups/${groupId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentProgress: updatesByGroup[groupId]
          })
        });
        return res.json();
      });

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);
      if (failed.length === 0) {
        onToast(`Successfully approved ${targets.length} certificate(s)!`);
        setSelectedStudents([]);
        onRefresh();
      } else {
        onToast(`Failed to approve some certificates.`);
      }
    } catch (err) {
      onToast("Error bulk approving certificates.");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  // Certificate PDF download
  const downloadSingleCertificate = (row: any) => {
    const s1 = row.group?.signatory1 || "Pastor Benson Nyirenda";
    const s1Title = row.group?.signatory1Title || "Lead Pastor";
    const s2 = row.group?.signatory2 || "Deaconess Winnie Nyirenda";
    const s2Title = row.group?.signatory2Title || "Education Director";
    const courseTitle = row.group?.name || "Scripture Academy Discipleship Course";
    const dateStr = row.completedDate !== "—" ? new Date(row.completedDate).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    try {
      generateCertificatePdf({
        studentName: row.name,
        courseTitle,
        signatory1: s1,
        signatory1Title: s1Title,
        signatory2: s2,
        signatory2Title: s2Title,
        dateStr,
        themeName: row.group?.certificateTheme || "gold"
      });
      onToast(`Successfully generated PDF Certificate for ${row.name}!`);
    } catch (err) {
      console.error(err);
      onToast(`Error generating PDF Certificate for ${row.name}.`);
    }
  };

  // Batch actions
  const handleDownloadSelected = () => {
    const targets = filteredRows.filter(r => selectedStudents.includes(r.id) && (r.certStatus === "Approved" || r.certStatus === "Printed"));
    if (targets.length === 0) {
      onToast("No approved/certified certificates are selected. Please approve them first.");
      return;
    }
    onToast(`Generating ${targets.length} certified PDF Certificates sequentially...`);
    targets.forEach((row, idx) => {
      setTimeout(() => {
        downloadSingleCertificate(row);
      }, idx * 600);
    });
  };

  const handlePrintSelected = () => {
    const targets = filteredRows.filter(r => selectedStudents.includes(r.id) && (r.certStatus === "Approved" || r.certStatus === "Printed"));
    if (targets.length === 0) {
      onToast("No approved/certified certificates are selected. Please approve them first.");
      return;
    }
    onToast(`Preparing ${targets.length} certified certificate(s) for print spooler...`);
    window.print();
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Student Name", "Course / Cohort", "Modules Passed", "Completed Date", "Certificate ID", "Status"];
      const csvRows = [headers.join(",")];

      filteredRows.forEach(row => {
        const line = [
          `"${row.name}"`,
          `"${row.groupName}"`,
          `"${row.completedCount}/${row.totalLessons}"`,
          `"${row.completedDate}"`,
          `"${row.certId}"`,
          `"${row.certStatus}"`
        ];
        csvRows.push(line.join(","));
      });

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `church_certificate_report_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onToast("CSV Report exported successfully!");
    } catch (err) {
      onToast("Failed to export CSV report.");
    }
  };

  // Update certificate status persistence (PATCH)
  const handleUpdateStatus = async (row: any, newStatus: string) => {
    const progressKey = `studentProgress.${row.name}.certificateStatus`;
    const tempProgress = { ...(row.group.studentProgress || {}) };
    
    if (!tempProgress[row.name]) {
      tempProgress[row.name] = {
        userId: row.name,
        completedLessons: [],
        completedModules: [],
        completedCourses: [],
        quizAttempts: {},
        examAttempts: {},
        certificates: []
      };
    }

    tempProgress[row.name] = {
      ...tempProgress[row.name],
      certificateStatus: newStatus,
      certificateId: row.certId,
      completedDate: row.completedDate === "—" ? new Date().toISOString().split("T")[0] : row.completedDate
    };

    setIsUpdatingStatus(row.id);
    try {
      const res = await fetch(`/api/groups/${row.groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentProgress: tempProgress
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Certificate status for ${row.name} updated to "${newStatus}"!`);
        onRefresh();
      } else {
        onToast("Failed to update status.");
      }
    } catch (err) {
      onToast("Error saving certificate status.");
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const isAllSelected = filteredRows.length > 0 && filteredRows.every(r => selectedStudents.includes(r.id));

  return (
    <div className="space-y-6" id="certificate-management-panel">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/10">
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-20 opacity-[0.03] pointer-events-none">
          <Award size={360} className="text-amber-500" />
        </div>
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
            <span>🛡️</span>
            <span>Administrative Registry</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">Scripture Academy & Discipleship Certificate Registry</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Manage course certifications, review student passing milestones, download professional PDF diplomas, and track distribution statuses.
          </p>
        </div>
      </div>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Registry</p>
            <p className="text-lg font-black text-slate-800">{allRows.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Passed (Graduates)</p>
            <p className="text-lg font-black text-emerald-600">{allRows.filter(r => r.isGraduate).length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-amber-500 font-bold uppercase">Studying</p>
            <p className="text-lg font-black text-amber-600">{allRows.filter(r => !r.isGraduate).length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <Printer size={20} />
          </div>
          <div>
            <p className="text-[10px] text-indigo-500 font-bold uppercase">Printed & Issued</p>
            <p className="text-lg font-black text-indigo-600">{allRows.filter(r => r.certStatus === "Printed").length}</p>
          </div>
        </div>
      </div>

      {/* Filter and Action Controls Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Interactive Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Search name, course or cert ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Course/Cohort */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Filter size={14} />
              </span>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
              >
                <option value="all">All Cohorts / Courses</option>
                {classGroups.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            {/* Graduation Status */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Award size={14} />
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
              >
                <option value="all">All Graduation Statuses</option>
                <option value="graduated">Graduated (Passed)</option>
                <option value="studying">In-Progress (Studying)</option>
              </select>
            </div>

            {/* Certificate Print Status */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Printer size={14} />
              </span>
              <select
                value={certStatusFilter}
                onChange={(e) => setCertStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
              >
                <option value="all">All Issuance Statuses</option>
                <option value="Pending">Pending Approval</option>
                <option value="Approved">Approved for Print</option>
                <option value="Printed">Printed & Distributed</option>
              </select>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Export filtered index list to CSV"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {selectedStudents.length > 0 && (
              <>
                {/* Bulk Approve Button */}
                {filteredRows.some(r => selectedStudents.includes(r.id) && r.certStatus === "Pending") && (
                  <button
                    onClick={handleBulkApprove}
                    disabled={isUpdatingStatus === "bulk"}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-150"
                    title="Approve all selected pending certificates"
                  >
                    {isUpdatingStatus === "bulk" ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    <span>Bulk Approve ({filteredRows.filter(r => selectedStudents.includes(r.id) && r.certStatus === "Pending").length})</span>
                  </button>
                )}

                <button
                  onClick={handlePrintSelected}
                  className="px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Printer size={14} />
                  <span>Print Selected ({filteredRows.filter(r => selectedStudents.includes(r.id) && (r.certStatus === "Approved" || r.certStatus === "Printed")).length})</span>
                </button>
                <button
                  onClick={handleDownloadSelected}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-indigo-150"
                >
                  <Download size={14} />
                  <span>Download PDFs ({filteredRows.filter(r => selectedStudents.includes(r.id) && (r.certStatus === "Approved" || r.certStatus === "Printed")).length})</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto border border-slate-150 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-extrabold uppercase border-b border-slate-150 tracking-wider">
                <th className="p-3.5 text-center w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    disabled={filteredRows.length === 0}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                  />
                </th>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Course Cohort</th>
                <th className="p-3.5">Modules Passed</th>
                <th className="p-3.5">Completion Date</th>
                <th className="p-3.5">Certificate ID</th>
                <th className="p-3.5">Issuance Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => {
                  const isSelected = selectedStudents.includes(row.id);
                  return (
                    <tr 
                      key={row.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isSelected ? "bg-indigo-50/10" : ""
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(row.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-[10px] text-slate-600 shrink-0 border border-slate-150">
                            {row.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <span>{row.name}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500">{row.groupName}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.isGraduate 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}>
                            {row.completedCount} / {row.totalLessons} modules
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-500 font-medium">{row.completedDate}</td>
                      <td className="p-3.5 font-mono text-[10px] text-slate-400 font-bold">{row.certId}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <div className="relative inline-block">
                            {isUpdatingStatus === row.id ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <RefreshCw size={10} className="animate-spin" />
                                <span>Updating...</span>
                              </span>
                            ) : (
                              <select
                                value={row.certStatus}
                                disabled={!row.isGraduate && !isAuthorized}
                                onChange={(e) => handleUpdateStatus(row, e.target.value)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer focus:outline-none appearance-none pr-4 ${
                                  row.certStatus === "Printed"
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : row.certStatus === "Approved"
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                                    : "bg-amber-50 border-amber-200 text-amber-700"
                                } ${(!row.isGraduate && !isAuthorized) ? "opacity-50 cursor-not-allowed" : ""}`}
                              >
                                <option value="Pending">Pending Approval</option>
                                <option value="Approved">Approved for Print</option>
                                <option value="Printed">Printed & Distributed</option>
                              </select>
                            )}
                            {!(isUpdatingStatus === row.id) && (
                              <span className="absolute inset-y-0 right-1 flex items-center pointer-events-none text-slate-400">
                                <ChevronDown size={8} />
                              </span>
                            )}
                          </div>

                          {row.certStatus === "Pending" && isAuthorized && (
                            <button
                              onClick={() => handleUpdateStatus(row, "Approved")}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded border border-emerald-700 transition-colors shadow-sm cursor-pointer flex items-center gap-0.5 whitespace-nowrap shrink-0"
                              title="Approve for print"
                            >
                              <Check size={10} />
                              <span>Approve</span>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-right">
                        {(row.certStatus === "Approved" || row.certStatus === "Printed") ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => downloadSingleCertificate(row)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Download PDF Diploma"
                            >
                              <Download size={13} />
                            </button>
                            <button
                              onClick={() => {
                                window.print();
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-all cursor-pointer"
                              title="Direct Print Diploma"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
                        ) : row.isGraduate ? (
                          <span className="text-[10px] text-amber-600 font-bold flex items-center justify-end gap-1" title="Graduate needs pastor certification/approval before downloading.">
                            <Lock size={11} />
                            Awaiting Certification
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">In progress</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic font-medium">
                    No student certificate registry match found. Adjust filters to broaden query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
