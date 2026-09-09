import React, { useState, useEffect } from "react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, Users, 
  MapPin, Clock, MessageSquare, Clipboard, Star, 
  Eye, Download, BarChart3, User, Shield, Bell, Activity, Trash2, Plus, UserPlus,
  ArrowLeft, BookOpen, Heart, Edit3
} from "lucide-react";
import { User as UserType, DatabaseState, Transaction, Event, Task, Member, Group } from "../types";
import { initials, avatarBg } from "./Sidebar";

// ==========================================
// 1. FINANCES VIEW
// ==========================================
interface FinancesViewProps {
  user: UserType;
  state: DatabaseState;
  onAddTransaction: (tx: Partial<Transaction>) => void;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
}
export function FinancesView({ user, state, onAddTransaction, onToast, onRefresh }: FinancesViewProps) {
  const hasFinancePermission = user.role === "pastor" || user.assignedFinanceDuty === true;
  
  if (!hasFinancePermission) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-md mx-auto my-12 shadow-sm" id="restricted-finance-portal">
        <div className="text-red-500 font-extrabold text-lg mb-2">Access Restricted</div>
        <p className="text-slate-500 text-xs leading-relaxed">
          You do not have permission to view the financial portal. Financial levels are restricted and must be explicitly authorized by the Pastor in the Members Directory.
        </p>
      </div>
    );
  }

  const [showAdd, setShowAdd] = useState(false);
  const [type, setType] = useState<"income" | "expense">("income");
  
  const offeringTypes = state.finances?.offeringTypes || ["Tithe", "Offering", "Building Fund", "Missions Care", "Benevolence", "Thanksgiving"];
  
  const [category, setCategory] = useState(offeringTypes[0] || "Tithe");
  const [amount, setAmount] = useState(100);
  const [name, setName] = useState("");
  const [newOfferingType, setNewOfferingType] = useState("");
  const [isAddingOfferingType, setIsAddingOfferingType] = useState(false);

  // Sync default category when offeringTypes loads
  useEffect(() => {
    if (offeringTypes.length > 0 && !offeringTypes.includes(category)) {
      setCategory(offeringTypes[0]);
    }
  }, [state.finances?.offeringTypes]);

  const rawIncomeTx = state.finances?.income || [];
  const rawExpenseTx = state.finances?.expenses || [];
  
  // Filter only approved transactions for the ledger
  const incomeTx = rawIncomeTx.filter((t: any) => t.status !== "pending" && t.status !== "rejected" && t.status !== "pending_mobile_money");
  const expenseTx = rawExpenseTx.filter((t: any) => t.status !== "pending" && t.status !== "rejected");
  const allTx = [...incomeTx, ...expenseTx].sort((a, b) => b.date.localeCompare(a.date));

  // Filter pending transactions queue (visible to pastor or elder)
  const pendingTx = [...rawIncomeTx, ...rawExpenseTx]
    .filter((t: any) => t.status === "pending")
    .sort((a, b) => b.id.localeCompare(a.id));

  // Pending Airtel Money Queue
  const pendingMobileMoney = rawIncomeTx
    .filter((t: any) => t.status === "pending_mobile_money")
    .sort((a, b) => b.id.localeCompare(a.id));

  const totalInc = incomeTx.reduce((sum, t) => sum + t.amount, 0) + 53500; // Offset seed
  const totalExp = expenseTx.reduce((sum, t) => sum + t.amount, 0) + 38000;
  const balance = totalInc - totalExp;

  const canApprove = ["pastor", "elder", "admin"].includes(user.role);
  const isPastor = ["pastor", "admin"].includes(user.role);

  const handleApproveAirtel = async (id: string, assignedCategory: string) => {
    try {
      const res = await fetch(`/api/finances/mobile-money/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: assignedCategory, approvedBy: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Contribution approved and posted to ${assignedCategory} ledger!`);
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to approve mobile money contribution.");
      }
    } catch (err) {
      onToast("Network Error: Could not approve.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !amount || !name) {
      onToast("Category, Amount, and Name are required");
      return;
    }
    const isPending = user.role === "deacon" || user.role === "elder";
    onAddTransaction({
      type,
      category,
      amount: Number(amount),
      name,
      submittedBy: user.name,
      submittedRole: user.role,
      status: isPending ? "pending" : "approved"
    });
    setName("");
    setCategory(offeringTypes[0] || "Tithe");
    setAmount(100);
    setShowAdd(false);
    if (isPending) {
      onToast("Transaction logged! Awaiting pastor or elder approval to appear in ledger.");
    } else {
      onToast("Transaction ledger updated successfully!");
    }
    if (onRefresh) {
      setTimeout(() => onRefresh(), 500);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/finances/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast("Transaction approved and added to general ledger!");
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to approve transaction.");
      }
    } catch (err) {
      onToast("Network Error: Could not approve.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/finances/${id}/reject`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        onToast("Transaction declined and rejected.");
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to decline transaction.");
      }
    } catch (err) {
      onToast("Network Error: Could not reject.");
    }
  };

  const handleAddOfferingType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferingType.trim()) {
      onToast("Please enter a valid offering type name.");
      return;
    }
    setIsAddingOfferingType(true);
    try {
      const res = await fetch("/api/finances/offering-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOfferingType.trim() })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`New offering type "${newOfferingType}" added successfully!`);
        setNewOfferingType("");
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to add offering type.");
      }
    } catch (err) {
      onToast("Network Error: Unable to add offering type.");
    } finally {
      setIsAddingOfferingType(false);
    }
  };

  // Sum up total approved income by category
  const categorySums: { [key: string]: number } = {};
  incomeTx.forEach((tx: any) => {
    categorySums[tx.category] = (categorySums[tx.category] || 0) + tx.amount;
  });
  
  const allocations = offeringTypes.map((cat, idx) => {
    const val = categorySums[cat] || 0;
    const colors = ["bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500"];
    return {
      name: cat,
      val: val,
      color: colors[idx % colors.length]
    };
  }).filter(item => item.val > 0);

  const displayAllocations = allocations.length > 0 ? allocations : [
    { name: "Tithe", val: 35000, color: "bg-blue-500" },
    { name: "Offering", val: 15000, color: "bg-emerald-500" },
    { name: "Building Fund", val: 8000, color: "bg-amber-500" },
    { name: "Missions Care", val: 4000, color: "bg-purple-500" }
  ];

  // Recharts Dataset Preparations
  const monthlyData = [
    { name: "Jun", Income: 45000, Expenses: 32000 },
    { name: "Jul", Income: 52000, Expenses: 35000 },
    { name: "Aug", Income: 48000, Expenses: 34000 },
    { name: "Sep", Income: 55000, Expenses: 38000 },
    { name: "Oct", Income: 58000, Expenses: 39000 },
    { name: "Nov", Income: totalInc, Expenses: totalExp },
  ];

  const pieData = displayAllocations.map(item => ({
    name: item.name,
    value: item.val
  }));
  const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"];

  // Group real expenses by category
  const expenseCategorySums: { [key: string]: number } = {};
  expenseTx.forEach((tx: any) => {
    expenseCategorySums[tx.category] = (expenseCategorySums[tx.category] || 0) + tx.amount;
  });

  const rawExpenseCategories = ["Utilities", "Pastor Allowance", "Church Projects", "Sound & Media", "Welfare", "Others"];
  const barData = rawExpenseCategories.map((cat, idx) => {
    let val = expenseCategorySums[cat] || 0;
    if (val === 0) {
      const defaultVals = [12000, 10000, 8000, 5000, 3000, 1500];
      val = defaultVals[idx] || 1000;
    }
    return {
      name: cat,
      val: val
    };
  });
  const BAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#06b6d4", "#a855f7", "#64748b"];

  return (
    <div className="space-y-6" id="finances-ledger">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Financial General Ledger</h2>
          <p className="text-slate-500 text-xs mt-1">Audit incoming collections and ministry operational bills</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCategory(offeringTypes[0] || "Tithe");
              setShowAdd(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            Add Transaction
          </button>
          <button
            onClick={() => onToast("Report exported successfully to Excel format.")}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1 cursor-pointer"
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="finances-cards-container">
        {/* Total Income Card - Green */}
        <div className="bg-emerald-600 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              ↙
            </div>
            <TrendingUp className="text-white/20" size={18} />
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Total Income</div>
            <div className="text-2xl font-extrabold font-mono mt-1">K{totalInc.toLocaleString()}</div>
            <div className="text-[9px] font-semibold text-white/80 mt-1.5 bg-emerald-700/30 px-2 py-0.5 rounded-md inline-block">
              +12% from last month
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Expenses Card - Red */}
        <div className="bg-rose-600 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              ↗
            </div>
            <TrendingDown className="text-white/20" size={18} />
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Total Expenses</div>
            <div className="text-2xl font-extrabold font-mono mt-1">K{totalExp.toLocaleString()}</div>
            <div className="text-[9px] font-semibold text-white/80 mt-1.5 bg-rose-700/30 px-2 py-0.5 rounded-md inline-block">
              +5% from last month
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Net Balance Card - Blue */}
        <div className="bg-blue-600 text-white rounded-2xl p-5 shadow-md relative overflow-hidden flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
              $
            </div>
            <TrendingUp className="text-white/20" size={18} />
          </div>
          <div className="mt-4">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Net Balance</div>
            <div className="text-2xl font-extrabold font-mono mt-1">K{balance.toLocaleString()}</div>
            <div className="text-[9px] font-semibold text-white/80 mt-1.5 bg-blue-700/30 px-2 py-0.5 rounded-md inline-block">
              Available funds
            </div>
          </div>
          <div className="absolute right-[-20px] top-[-20px] w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* PENDING TRANSACTIONS APPROVAL QUEUE */}
      {canApprove && pendingTx.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-850 text-sm flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span>Pending Financial Approvals ({pendingTx.length})</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Transactions logged by deacons or elders requiring sign-off to appear in ledger</p>
            </div>
          </div>
          <div className="divide-y divide-amber-100 bg-white rounded-lg border border-amber-150 overflow-hidden">
            {pendingTx.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 text-xs hover:bg-amber-50/30">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                  }`}>
                    {t.type === "income" ? "↑" : "↓"}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">
                      {t.category} — <span className="font-semibold text-slate-500">K{t.amount.toLocaleString()}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Logged by: <span className="font-semibold text-slate-600">{t.submittedBy}</span> ({t.submittedRole}) · For: <span className="italic">{t.name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleApprove(t.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded transition-colors text-[10px]"
                    title="Approve and Post to Ledger"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReject(t.id)}
                    className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-bold px-2.5 py-1 rounded transition-colors text-[10px]"
                    title="Reject/Decline"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PENDING MOBILE MONEY QUEUE */}
      {canApprove && pendingMobileMoney.length > 0 && (
        <div className="bg-amber-50/20 border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span>Pending Mobile Money Contributions ({pendingMobileMoney.length})</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Airtel & MTN Money transfers requiring verification and giving category assignment before ledger posting</p>
            </div>
          </div>
          <div className="divide-y divide-slate-150 bg-white rounded-lg border border-slate-200 overflow-hidden">
            {pendingMobileMoney.map((t) => {
              const isMTN = t.category?.toLowerCase().includes("mtn") || t.name?.toLowerCase().includes("mtn");
              return (
                <div key={t.id} className="p-4 text-xs hover:bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isMTN ? "bg-amber-150 text-amber-800" : "bg-rose-50 text-rose-600"} select-none`}>
                        📲
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          K{t.amount.toLocaleString()} — <span className="font-semibold text-slate-500">{t.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Transferred via: <span className={`font-bold ${isMTN ? "text-amber-700" : "text-rose-600"}`}>{isMTN ? "MTN Money" : "Airtel Money"}</span> · Reference: <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{t.reference || "N/A"}</span> · Date: {t.date}
                        </div>
                      </div>
                    </div>
                    
                    {/* Category select and buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Assign Type:</span>
                        <select
                          id={`assign-cat-${t.id}`}
                          defaultValue={offeringTypes[0] || "Tithe"}
                          className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[11px] outline-none font-semibold cursor-pointer focus:border-rose-500"
                        >
                          {offeringTypes.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        onClick={() => {
                          const selectEl = document.getElementById(`assign-cat-${t.id}`) as HTMLSelectElement;
                          const selectedCategory = selectEl ? selectEl.value : (offeringTypes[0] || "Tithe");
                          handleApproveAirtel(t.id, selectedCategory);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded transition-colors text-[10px] cursor-pointer"
                      >
                        Approve & Post
                      </button>
                      <button 
                        onClick={() => handleReject(t.id)}
                        className="bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 font-bold px-2.5 py-1.5 rounded transition-colors text-[10px] cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PASTOR'S CUSTOM OFFERING TYPE ADDER */}
      {isPastor && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Plus size={16} className="text-blue-600" />
                <span>Pastor's Offering Types Console</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">Define new ecclesiastical giving tiers & collection categories dynamically</p>
            </div>
            <form onSubmit={handleAddOfferingType} className="flex gap-2 max-w-md w-full">
              <input 
                type="text" 
                placeholder="e.g. Thanksgiving Offering, Building Campaign" 
                value={newOfferingType} 
                onChange={(e) => setNewOfferingType(e.target.value)}
                className="bg-white border border-slate-250 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-500 flex-1 font-semibold"
                required
              />
              <button 
                type="submit"
                disabled={isAddingOfferingType}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
              >
                {isAddingOfferingType ? "Adding..." : "Add Type"}
              </button>
            </form>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 self-center mr-1">Active categories:</span>
            {offeringTypes.map((cat) => (
              <span key={cat} className="inline-block px-2 py-0.5 rounded bg-slate-200/60 border border-slate-300 text-slate-700 font-bold text-[10px]">
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Financial Graphs with Entry Motion */}
      <div className="space-y-6" id="finance-graphs-section">
        {/* Row 1: Income vs Expenses & Income Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income vs Expenses Chart Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Income vs Expenses</h3>
              <select className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] font-bold outline-none text-slate-600 focus:border-blue-500 cursor-pointer">
                <option>This Month</option>
                <option>Last 6 Months</option>
              </select>
            </div>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                    formatter={(value: any) => [`K${value.toLocaleString()}`, ""]}
                  />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Income Breakdown Pie Chart Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm">Income Breakdown</h3>
            <div className="w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                    formatter={(value: any) => [`K${value.toLocaleString()}`, ""]}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle" 
                    iconSize={8}
                    formatter={(value, entry: any) => {
                      const totalVal = displayAllocations.reduce((sum, item) => sum + item.val, 0) || 1;
                      const percentage = Math.round(((entry.payload?.value || 0) / totalVal) * 100);
                      return <span className="text-[11px] font-semibold text-slate-650">{value} {percentage}%</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: Expense Breakdown Bar Chart (Full Width) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Expense Breakdown</h3>
          <div className="w-full">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0f172a", borderRadius: "8px", border: "none", color: "#fff", fontSize: "11px" }}
                  formatter={(value: any) => [`K${value.toLocaleString()}`, "Amount"]}
                />
                <Bar dataKey="val" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 text-sm">Recent Ledger Statements</h3>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
            {allTx.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-8">No approved transactions in the ledger yet.</p>
            ) : (
              allTx.map((t) => (
                <div key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                      t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    }`}>
                      {t.type === "income" ? "↑" : "↓"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{t.category}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{t.name} · {t.date}</div>
                    </div>
                  </div>
                  <div className={`font-bold ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}K{t.amount.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Record Transaction</h3>
              <button onClick={() => setShowAdd(false)} className="w-7 h-7 text-slate-400 font-bold hover:bg-slate-100 rounded-md">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value as "income" | "expense")} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs">
                    <option value="income">Income (Collection)</option>
                    <option value="expense">Expense (Operational)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer">
                    {offeringTypes.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Amount (K)</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Contributor / Recipient</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAdd(false)} className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm">
                  {user.role === "deacon" || user.role === "elder" ? "Submit for Approval" : "Save Transaction"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. ATTENDANCE VIEW
// ==========================================
// 2. ATTENDANCE VIEW
// ==========================================
interface AttendanceViewProps {
  user: UserType;
  state: DatabaseState;
  onAddAttendance: (record: any) => void;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
}

export function AttendanceView({ user, state, onAddAttendance, onToast, onRefresh }: AttendanceViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [male, setMale] = useState<number>(0);
  const [female, setFemale] = useState<number>(0);
  const [kids, setKids] = useState<number>(0);
  const [level, setLevel] = useState<"youths" | "elders" | "mixed">("mixed");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check permissions
  const isAdminOrClergy = ["pastor", "elder", "admin"].includes(user.role);
  const hasSubmitDuty = user.assignedAttendanceDuty === true || isAdminOrClergy || user.role === "deacon";
  const canApprove = ["pastor", "elder", "admin"].includes(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      onToast("Please select a valid date.");
      return;
    }

    const total = Number(male) + Number(female) + Number(kids);
    if (total <= 0) {
      onToast("Total attendance headcount must be greater than 0.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      date,
      male: Number(male),
      female: Number(female),
      kids: Number(kids),
      total,
      level,
      notes,
      submittedBy: user.name,
      submittedRole: user.role,
      status: canApprove ? "approved" : "pending", // Auto-approved if submitted by pastor/elder/admin
      approvedBy: canApprove ? user.name : undefined,
      approvedDate: canApprove ? new Date().toISOString().split("T")[0] : undefined
    };

    try {
      await onAddAttendance(payload);
      setShowAdd(false);
      onToast(
        canApprove
          ? "Attendance logged and auto-approved!"
          : "Attendance submitted for Elder approval."
      );
      // Reset form
      setMale(0);
      setFemale(0);
      setKids(0);
      setLevel("mixed");
      setNotes("");
      if (onRefresh) onRefresh();
    } catch (err) {
      onToast("Failed to submit attendance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: user.name })
      });
      const data = await res.json();
      if (data.success) {
        onToast("Attendance sheet signed off and approved!");
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to sign off record.");
      }
    } catch (err) {
      onToast("Network Error: Could not approve.");
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/attendance/${id}/reject`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        onToast("Attendance sheet rejected.");
        if (onRefresh) onRefresh();
      } else {
        onToast("Failed to reject record.");
      }
    } catch (err) {
      onToast("Network Error: Could not reject.");
    }
  };

  return (
    <div className="space-y-6" id="attendance-log-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850 font-sans tracking-tight">Attendance Logs & Sign-offs</h2>
          <p className="text-slate-500 text-xs mt-1">Submit and verify congregation growth, youth ratios, and weekend attendance lists</p>
        </div>
        {hasSubmitDuty ? (
          <button
            onClick={() => setShowAdd(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-colors"
          >
            Log New Attendance
          </button>
        ) : (
          <div className="text-[11px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-1.5">
            🔒 Log attendance option is locked (Ask Pastor/Elder for Logging Duty assignment)
          </div>
        )}
      </div>

      {/* Attendance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Average Sunday Attendance</p>
          <p className="text-xl font-extrabold text-blue-600">253 <span className="text-xs text-slate-400 font-medium">members</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Latest Sunday Ratio</p>
          <p className="text-xl font-extrabold text-indigo-600">62% <span className="text-xs text-slate-400 font-medium">female ratio</span></p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Sanctuary Health Index</p>
          <p className="text-xl font-extrabold text-emerald-600">EXCELLENT</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-850 text-xs uppercase tracking-wider">Congregational Attendance & Sign-off History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[9px] tracking-wider">
                <th className="p-3">Date/Week</th>
                <th className="p-3">Demographic Split</th>
                <th className="p-3">Total Headcount</th>
                <th className="p-3">Level Focus</th>
                <th className="p-3">Logger / Submitter</th>
                <th className="p-3">Approval Sign-Off</th>
                {canApprove && <th className="p-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(state.attendance || []).map((row: any, i) => {
                const isNew = row.date !== undefined;
                const displayDate = isNew ? row.date : row.week;
                const maleVal = isNew ? row.male : 110;
                const femaleVal = isNew ? row.female : 140;
                const kidsVal = isNew ? row.kids : 60;
                const totalVal = isNew ? row.total : (row.sunday || 0) + (row.midweek || 0) + (row.youth || 0);
                const levelVal = row.level || "mixed";
                const submittedByVal = row.submittedBy || "System Admin";
                const statusVal = row.status || "approved";

                return (
                  <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{displayDate}</td>
                    <td className="p-3 text-slate-650 space-y-0.5 font-medium">
                      <div className="flex gap-2">
                        <span className="bg-blue-50 text-blue-700 px-1 py-0.2 rounded text-[10px]">M: {maleVal}</span>
                        <span className="bg-pink-50 text-pink-700 px-1 py-0.2 rounded text-[10px]">F: {femaleVal}</span>
                        <span className="bg-amber-50 text-amber-700 px-1 py-0.2 rounded text-[10px]">K: {kidsVal}</span>
                      </div>
                    </td>
                    <td className="p-3 font-extrabold text-blue-600 text-sm">
                      {totalVal} <span className="text-[10px] text-slate-400 font-medium">attendees</span>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                        levelVal === "youths" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                        levelVal === "elders" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                        "bg-slate-50 text-slate-700 border border-slate-200"
                      }`}>
                        {levelVal}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">
                      <div>{submittedByVal}</div>
                      <div className="text-[9px] text-slate-400 uppercase font-bold">{row.submittedRole || "clergyman"}</div>
                    </td>
                    <td className="p-3 font-semibold">
                      {statusVal === "approved" ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            ✓ Approved
                          </span>
                          {row.approvedBy && (
                            <div className="text-[9px] text-slate-400 font-medium">By {row.approvedBy}</div>
                          )}
                        </div>
                      ) : statusVal === "rejected" ? (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          ✗ Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
                          ⏳ Pending Sign-Off
                        </span>
                      )}
                    </td>
                    {canApprove && (
                      <td className="p-3">
                        {statusVal === "pending" ? (
                          <div className="flex gap-1.5 justify-center">
                            <button
                              onClick={() => handleApprove(row.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(row.id)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold px-2 py-1 rounded text-[10px] transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-slate-400 italic text-[10px]">— Signed off —</div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Log New Attendance</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Submit exact Male, Female, and Kids congregation headcount</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-7 h-7 text-slate-400 font-extrabold hover:bg-slate-200 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Select Attendance Calendar Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Male</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={male}
                    onChange={(e) => setMale(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Female</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={female}
                    onChange={(e) => setFemale(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Kids/Toddlers</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={kids}
                    onChange={(e) => setKids(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Target Demographic Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 cursor-pointer text-slate-700"
                >
                  <option value="mixed">Mixed Congregation</option>
                  <option value="youths">Youths Focus</option>
                  <option value="elders">Elders Focus</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Additional Notes / Sermon Theme (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Sunday sermon by Pastor Benson. Heavy rain during morning session."
                  className="w-full bg-slate-50 border border-slate-250 rounded-lg px-3 py-2 text-xs h-16 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? "Submitting..." : canApprove ? "Record & Approve" : "Submit for Approval"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. LEGACY SMALL GROUPS VIEW
// ==========================================
interface LegacyGroupsViewProps {
  user: UserType;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh: () => void;
  onViewSermon?: (id: string) => void;
}

export function LegacyGroupsView({ user, state, onToast, onRefresh, onViewSermon }: LegacyGroupsViewProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLeader, setCreateLeader] = useState("");
  const [createDay, setCreateDay] = useState("Tuesday");
  const [createTime, setCreateTime] = useState("18:30");
  const [createLocation, setCreateLocation] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [selectedGroupForRequest, setSelectedGroupForRequest] = useState<any | null>(null);
  const [addPersonName, setAddPersonName] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Group Detail Room states
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeGroupTab, setActiveGroupTab] = useState<"bulletins" | "chat" | "sermons">("bulletins");
  const [newBulletinText, setNewBulletinText] = useState("");
  const [isAddingBulletin, setIsAddingBulletin] = useState(false);
  const [groupChatText, setGroupChatText] = useState("");
  const [isSendingGroupChat, setIsSendingGroupChat] = useState(false);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createLeader || !createLocation) {
      onToast("Please fill in all connection group details.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          leader: createLeader,
          day: createDay,
          time: createTime,
          location: createLocation
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Connection Group '${createName}' is now active and on the roster!`);
        setCreateName("");
        setCreateLeader("");
        setCreateLocation("");
        setShowCreateModal(false);
        onRefresh();
      } else {
        onToast("Failed to create group.");
      }
    } catch (err) {
      onToast("Error connecting to database.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddPersonRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPersonName.trim()) {
      onToast("Please supply the full name of the person you want to add.");
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const res = await fetch(`/api/groups/${selectedGroupForRequest.id}/add-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personName: addPersonName,
          fromUser: user.name
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Secure shepherding request sent to add ${addPersonName} to ${selectedGroupForRequest.name}!`);
        setAddPersonName("");
        setSelectedGroupForRequest(null);
        onRefresh();
      } else {
        onToast("Failed to transmit request.");
      }
    } catch (err) {
      onToast("Error connecting to server.");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const isLeader = ["admin", "pastor", "elder", "deacon"].includes(user.role);

  // Render the Group Detail space if a group is active
  if (activeGroupId) {
    const group = (state.groups || []).find((g) => g.id === activeGroupId);
    if (!group) {
      setActiveGroupId(null);
      return null;
    }

    const bulletins = group.bulletins || [];
    const groupMessages = (state.messages || []).filter((m) => m.groupId === group.id);
    const sharedSermons = (state.sermons || []).filter((s) => (group.sharedSermons || []).includes(s.id));

    return (
      <div className="space-y-6" id="active-group-workspace">
        {/* Header */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setActiveGroupId(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Back to Groups"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-850">{group.name}</h2>
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Fellowship Room
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">
                  Shepherded by <strong>{group.leader}</strong> · Meets {group.day}s at {group.time} ({group.location})
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setActiveGroupId(null)}
              className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Back to Groups list
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Members List */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-[420px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
              Group Roster ({group.memberNames ? group.memberNames.length : 0})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {(group.memberNames || []).map((name: string, i: number) => (
                <div key={i} className="flex items-center gap-2.5 p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0"
                    style={{ backgroundColor: avatarBg(name) }}
                  >
                    {initials(name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-xs truncate">{name}</p>
                    <p className="text-[10px] text-slate-400">Fellow Member</p>
                  </div>
                </div>
              ))}
              {(!group.memberNames || group.memberNames.length === 0) && (
                <div className="text-center py-8 text-slate-400 italic text-xs">No members assigned.</div>
              )}
            </div>
          </div>

          {/* Right Main Panel: Tabs and Workspace */}
          <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col h-[420px]">
            {/* Tabs */}
            <div className="flex border-b border-slate-150 bg-slate-50 p-1 gap-1">
              <button
                onClick={() => setActiveGroupTab("bulletins")}
                className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeGroupTab === "bulletins"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Bulletin Board
              </button>
              <button
                onClick={() => setActiveGroupTab("chat")}
                className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeGroupTab === "chat"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Group Fellowship Chat
              </button>
              <button
                onClick={() => setActiveGroupTab("sermons")}
                className={`flex-1 py-2 text-center rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  activeGroupTab === "sermons"
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Shared Sermons
              </button>
            </div>

            {/* Workspace Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {activeGroupTab === "bulletins" && (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  {/* Notices list */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {bulletins.map((bull: any) => (
                      <div key={bull.id} className="bg-slate-50 p-3 rounded-lg border border-slate-150 text-xs shadow-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-indigo-700">{bull.author}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{bull.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{bull.content}</p>
                      </div>
                    ))}
                    {bulletins.length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic">
                        No bulletins posted yet. Share encouragement or study updates!
                      </div>
                    )}
                  </div>

                  {/* Form to post a bulletin */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!newBulletinText.trim()) return;
                      setIsAddingBulletin(true);
                      try {
                        const res = await fetch(`/api/groups/${group.id}/bulletins`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ author: user.name, content: newBulletinText })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setNewBulletinText("");
                          onToast("Group notice posted on the bulletin board!");
                          onRefresh();
                        }
                      } catch (err) {
                        onToast("Error posting bulletin.");
                      } finally {
                        setIsAddingBulletin(false);
                      }
                    }}
                    className="flex gap-2 pt-2 border-t border-slate-100 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder="Write a message to the bulletin board..."
                      value={newBulletinText}
                      onChange={(e) => setNewBulletinText(e.target.value)}
                      className="flex-1 bg-slate-55 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={isAddingBulletin || !newBulletinText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-all shrink-0"
                    >
                      Post Notice
                    </button>
                  </form>
                </div>
              )}

              {activeGroupTab === "chat" && (
                <div className="space-y-4 flex flex-col h-full justify-between">
                  {/* Messages container */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col-reverse">
                    {groupMessages.map((msg: any) => {
                      const isSelf = msg.from === user.name;
                      return (
                        <div key={msg.id} className={`flex gap-2 max-w-[80%] ${isSelf ? "self-end flex-row-reverse" : "self-start"}`}>
                          {!isSelf && (
                            <div 
                              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white font-bold mt-0.5 shrink-0"
                              style={{ backgroundColor: avatarBg(msg.from) }}
                            >
                              {initials(msg.from)}
                            </div>
                          )}
                          <div className={`p-3 rounded-2xl text-xs space-y-1 ${
                            isSelf 
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-sm" 
                              : "bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200"
                          }`}>
                            <div className="flex justify-between items-center gap-4">
                              <span className="font-bold text-[10px] opacity-90">{msg.from}</span>
                              <span className="text-[9px] opacity-75 font-mono">{msg.time}</span>
                            </div>
                            <p className="font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                            {/* Sermon attachment */}
                            {msg.attachmentType === "sermon" && (
                              <div 
                                onClick={() => {
                                  if (msg.attachmentId && onViewSermon) {
                                    onViewSermon(msg.attachmentId);
                                  } else {
                                    onToast("Opening sermon outline...");
                                    if (onViewSermon) onViewSermon("1");
                                  }
                                }}
                                className={`mt-2 p-2.5 rounded-lg border flex gap-3 items-center cursor-pointer hover:scale-[1.01] transition-transform ${
                                  isSelf ? "bg-white/10 border-white/20 text-white" : "bg-white border-slate-200 text-slate-800 shadow-xs"
                                }`}
                              >
                                <BookOpen size={16} className={isSelf ? "text-amber-300" : "text-blue-600"} />
                                <div className="min-w-0 flex-1">
                                  <p className="font-bold text-[10px] uppercase opacity-75 tracking-wider">Shared Sermon Outline (Click to open)</p>
                                  <p className="text-[11px] font-bold truncate mt-0.5">{msg.preview}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {groupMessages.length === 0 && (
                      <div className="text-center py-12 text-slate-400 italic my-auto">
                        This is the beginning of the connection group chat! Talk, pray, and fellowship together.
                      </div>
                    )}
                  </div>

                  {/* Form to type message */}
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!groupChatText.trim()) return;
                      setIsSendingGroupChat(true);
                      try {
                        const res = await fetch("/api/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            from: user.name,
                            groupId: group.id,
                            preview: `Group message`,
                            content: groupChatText
                          })
                        });
                        const data = await res.json();
                        if (data.success) {
                          setGroupChatText("");
                          onRefresh();
                        }
                      } catch (err) {
                        onToast("Error sending message.");
                      } finally {
                        setIsSendingGroupChat(false);
                      }
                    }}
                    className="flex gap-2 pt-2 border-t border-slate-100 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder={`Type a message to ${group.name}...`}
                      value={groupChatText}
                      onChange={(e) => setGroupChatText(e.target.value)}
                      className="flex-1 bg-slate-55 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-500 font-semibold"
                    />
                    <button
                      type="submit"
                      disabled={isSendingGroupChat || !groupChatText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer transition-all"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

              {activeGroupTab === "sermons" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sharedSermons.map((s) => (
                      <div key={s.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs hover:border-indigo-300 transition-colors shadow-xs">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-800 text-sm leading-tight">{s.title}</h4>
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded uppercase">
                            {s.category}
                          </span>
                        </div>
                        <p className="text-slate-500 font-medium">Speaker: {s.speaker} · {s.scripture}</p>
                        <p className="text-[11px] text-slate-400">Duration: {s.duration} · Published: {s.date}</p>
                      </div>
                    ))}
                    {sharedSermons.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-slate-400 italic">
                        No sermons shared with this group yet. Pastors can share study materials here from the Sermon outlined library.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="groups-directory">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Cell & Connection Small Groups</h2>
          <p className="text-slate-500 text-xs mt-1">Fellowship with small-scale spiritual units throughout the week</p>
        </div>
        {isLeader && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>Create Connection Group</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(state.groups || []).map((g) => {
          const isMember = g.memberNames && g.memberNames.includes(user.name);
          return (
            <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Users size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-850 text-base">{g.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">Led by Shepherd {g.leader}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span className="px-2.5 py-1 bg-slate-55 rounded-full">{g.memberNames ? g.memberNames.length : (g.members || 0)} members</span>
                <span className="px-2.5 py-1 bg-slate-55 rounded-full">{g.day} at {g.time}</span>
                <span className="px-2.5 py-1 bg-slate-55 rounded-full">📍 {g.location}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                {isMember ? (
                  <button
                    onClick={() => {
                      setActiveGroupId(g.id);
                      setActiveGroupTab("bulletins");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
                  >
                    <Users size={12} />
                    <span>Enter Group Room</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      onToast(`Joining connection group...`);
                      try {
                        const res = await fetch(`/api/groups/${g.id}/join`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ userName: user.name })
                        });
                        const data = await res.json();
                        if (data.success) {
                          onToast(`You have successfully joined ${g.name}! Welcome to the fellowship!`);
                          onRefresh();
                        } else {
                          onToast(data.message || "Join failed.");
                        }
                      } catch (err) {
                        onToast("Error joining group.");
                      }
                    }}
                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-all text-center"
                  >
                    Join Group Instantly
                  </button>
                )}
                <button
                  onClick={() => setSelectedGroupForRequest(g)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-all flex items-center justify-center gap-1"
                >
                  <UserPlus size={12} />
                  <span>Add Someone</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Launch Connection Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Connection Group Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kabulonga Fellowship"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Shepherd / Leader Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Banda"
                  value={createLeader}
                  onChange={(e) => setCreateLeader(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Meeting Day</label>
                  <select
                    value={createDay}
                    onChange={(e) => setCreateDay(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer font-semibold"
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
                    value={createTime}
                    onChange={(e) => setCreateTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Address / Venue Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 4 / Plot 10 Kabulonga"
                  value={createLocation}
                  onChange={(e) => setCreateLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  {isCreating ? "Launching..." : "Activate Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request to Add Someone Modal */}
      {selectedGroupForRequest && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Request to Add Member</h3>
              <button
                onClick={() => setSelectedGroupForRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddPersonRequestSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg leading-relaxed font-semibold">
                You are submitting a secure connection request to add a person to the <strong>{selectedGroupForRequest.name}</strong> group. Pastors, Elders, and Deacons will receive an alert to approve and add them.
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name of Person to Add</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Banda"
                  value={addPersonName}
                  onChange={(e) => setAddPersonName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedGroupForRequest(null)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  {isSubmittingRequest ? "Sending Request..." : "Submit Connection Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. MY GIVING VIEW
interface GivingViewProps {
  user: UserType;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
  onUpdateState?: (state: any) => void;
}
export function GivingView({ user, state, onToast, onRefresh, onUpdateState }: GivingViewProps) {
  const [showForm, setShowForm] = useState(false);
  
  const offeringTypes = state.finances?.offeringTypes || ["Tithe", "Offering", "Building Fund", "Missions Care", "Benevolence", "Thanksgiving"];
  
  const [category, setCategory] = useState(offeringTypes[0] || "Tithe");
  const [amountInput, setAmountInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [payMethod, setPayMethod] = useState<"card" | "airtel" | "mtn">("card");
  const [airtelPhone, setAirtelPhone] = useState("");
  const [airtelName, setAirtelName] = useState(user.name || "");
  const [airtelReference, setAirtelReference] = useState("");

  // Mobile Money simulated USSD overlay state
  const [showMMPrompt, setShowMMPrompt] = useState(false);
  const [mmPromptPhone, setMmPromptPhone] = useState("");
  const [mmPromptAmount, setMmPromptAmount] = useState(0);
  const [mmPromptNetwork, setMmPromptNetwork] = useState<"airtel" | "mtn">("airtel");
  const [mmPromptPin, setMmPromptPin] = useState("");
  const [mmPromptSenderName, setMmPromptSenderName] = useState("");
  const [mmPromptReference, setMmPromptReference] = useState("");
  const [mmPromptStatus, setMmPromptStatus] = useState<"awaiting_pin" | "submitting" | "success" | "failed">("awaiting_pin");

  // Sync category if offeringTypes updates
  useEffect(() => {
    if (offeringTypes.length > 0 && !offeringTypes.includes(category)) {
      setCategory(offeringTypes[0]);
    }
  }, [state.finances?.offeringTypes]);

  // Filter state.finances.income to extract this user's online contributions dynamically
  const userContributions = (state.finances?.income || [])
    .filter((tx: any) => tx.name?.startsWith(user.name))
    .map((tx: any) => ({
      date: tx.date,
      type: tx.category,
      amount: tx.amount,
      via: "Online Portal"
    }));

  const defaultContributions = [
    { date: "2026-06-22", type: "Tithe", amount: 500, via: "Manual Posting" },
    { date: "2026-06-15", type: "Offering", amount: 200, via: "Manual Posting" },
    { date: "2026-06-08", type: "Tithe", amount: 500, via: "Manual Posting" },
    { date: "2026-05-25", type: "Special Building Contribution", amount: 1000, via: "Manual Posting" },
  ];

  const allContributions = [...userContributions, ...defaultContributions];
  const total = allContributions.reduce((sum, g) => sum + g.amount, 0);

  const getGivingLevel = (amount: number) => {
    if (amount >= 10000) return { name: "Platinum Pillar", min: 10000, next: null, desc: "A pillar of strength supporting global missions and structural expansion." };
    if (amount >= 5000) return { name: "Gold Pillar", min: 5000, next: 10000, desc: "A visionary donor driving critical development and community outreach." };
    if (amount >= 2000) return { name: "Silver Pillar", min: 2000, next: 5000, desc: "A generous builder reinforcing core ecclesiastical and benevolence works." };
    if (amount >= 500) return { name: "Bronze Pillar", min: 500, next: 2000, desc: "A faithful steward backing standard services and ministry programs." };
    return { name: "Faithful Giver", min: 0, next: 500, desc: "A devoted contributor supporting day-to-day chapel operations." };
  };

  const currentLevel = getGivingLevel(total);

  const handleMakeContributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      onToast("Please enter a valid contribution amount.");
      return;
    }

    if (payMethod === "airtel" || payMethod === "mtn") {
      if (!airtelPhone || !airtelName) {
        const mName = payMethod === "mtn" ? "MTN" : "Airtel";
        onToast(`Please enter ${mName} wallet phone number and name.`);
        return;
      }
      // Trigger USSD push simulated flow
      setMmPromptAmount(parsedAmount);
      setMmPromptPhone(airtelPhone);
      setMmPromptNetwork(payMethod);
      setMmPromptSenderName(airtelName);
      setMmPromptReference(airtelReference || `mm_${Date.now()}`);
      setMmPromptStatus("awaiting_pin");
      setMmPromptPin("");
      setShowMMPrompt(true);
      return;
    }

    // Process Credit Card Payment
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/finances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "income",
          category,
          amount: parsedAmount,
          name: `${user.name} (Online)`
        })
      });
      const data = await response.json();
      if (data.success) {
        onToast(`Contribution of K${parsedAmount} received. Thank you for your stewardship!`);
        setShowForm(false);
        setAmountInput("");
        if (onUpdateState) {
          onUpdateState(data.state);
        } else if (onRefresh) {
          onRefresh();
        } else {
          window.location.reload();
        }
      } else {
        onToast("Stewardship transaction rejected.");
      }
    } catch (err) {
      onToast("Network Error: Unable to complete giving transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMMApproveSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!mmPromptPin || mmPromptPin.length < 4) {
      onToast("Please enter your 4-digit mobile money PIN.");
      return;
    }
    setMmPromptStatus("submitting");
    try {
      const response = await fetch("/api/finances/mobile-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: mmPromptAmount,
          phone: mmPromptPhone,
          senderName: mmPromptSenderName,
          reference: mmPromptReference,
          network: mmPromptNetwork
        })
      });
      const data = await response.json();
      if (data.success) {
        setMmPromptStatus("success");
        onToast(`Simulated push transaction successful! Reference: ${mmPromptReference}`);
        setTimeout(() => {
          setShowMMPrompt(false);
          setShowForm(false);
          setAmountInput("");
          setAirtelPhone("");
          setAirtelReference("");
          if (onUpdateState) {
            onUpdateState(data.state);
          } else if (onRefresh) {
            onRefresh();
          } else {
            window.location.reload();
          }
        }, 2200);
      } else {
        setMmPromptStatus("failed");
        onToast(data.message || "Push payment failed.");
      }
    } catch (err) {
      setMmPromptStatus("failed");
      onToast("Network Error connecting to Airtel/MTN Gateway.");
    }
  };

  return (
    <div className="space-y-6" id="personal-contributions">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-850">My Giving & Tithes Logs</h2>
          <p className="text-slate-500 text-xs mt-1">Secure logs of your financial offerings with instant tithing portals</p>
        </div>
        <button 
          onClick={() => {
            setCategory(offeringTypes[0] || "Tithe");
            setShowForm(true);
          }} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-colors flex items-center gap-1"
        >
          <Plus size={14} />
          <span>Make Contribution</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl p-5 shadow-sm">
          <div className="text-xs opacity-80">This Year's Faith Contributions</div>
          <div className="text-3xl font-black mt-2">K{total.toLocaleString()}</div>
          <div className="text-[10px] mt-1.5 opacity-90">Thank you for supporting the gospel!</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Last Contribution Month</div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            K{allContributions[0]?.amount || 0}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Confirmed & Tax Deductible</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Total Statements Issued</div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{allContributions.length}</div>
          <div className="text-[10px] text-slate-400 mt-1 font-semibold">Ready to download</div>
        </div>

        {/* Dynamic Stewardship Tiers & Giving Levels */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm col-span-1 md:col-span-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-850 px-2 py-0.5 rounded-full">
                  Stewardship Level
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-850 px-2 py-0.5 rounded-full">
                  {currentLevel.name}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm mt-1">{currentLevel.name} Level</h3>
              <p className="text-slate-500 text-xs">{currentLevel.desc}</p>
            </div>
            {currentLevel.next && (
              <div className="text-left md:text-right shrink-0">
                <span className="text-[10px] font-bold text-slate-400">NEXT TIER: {getGivingLevel(currentLevel.next).name}</span>
                <div className="text-xs font-bold text-slate-700 mt-0.5">
                  K{total.toLocaleString()} / K{currentLevel.next.toLocaleString()}
                </div>
              </div>
            )}
          </div>
          {currentLevel.next && (
            <div className="mt-4">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full" 
                  style={{ width: `${Math.min(100, (total / currentLevel.next) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1.5">
                <span>K{currentLevel.min}</span>
                <span>{Math.round((total / currentLevel.next) * 100)}% to next level</span>
                <span>K{currentLevel.next}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-850 text-sm mb-4">Contribution History Statement</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3">Posting Date</th>
                <th className="p-3">Contribution Category</th>
                <th className="p-3">Tendered Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allContributions.map((g, i) => (
                <tr key={i} className="hover:bg-slate-55">
                  <td className="p-3 text-slate-500">{g.date}</td>
                  <td className="p-3">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {g.type}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-800">K{g.amount.toLocaleString()}</td>
                  <td className="p-3 text-slate-400 font-medium">{g.via}</td>
                  <td className="p-3 text-emerald-600 font-semibold">✓ Confirmed</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Online Giving Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs md:text-sm">Secure Ecclesiastical Giving Gateway</h3>
              <button 
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleMakeContributionSubmit} className="p-5 space-y-4">
              {/* Payment Method Tab Selector */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPayMethod("card")}
                  className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                    payMethod === "card" ? "bg-white text-blue-700 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Bank / Card
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("airtel")}
                  className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                    payMethod === "airtel" ? "bg-white text-rose-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Airtel Money
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("mtn")}
                  className={`py-1.5 rounded-md transition-all cursor-pointer text-center ${
                    payMethod === "mtn" ? "bg-white text-amber-600 shadow-sm font-bold" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  MTN MoMo
                </button>
              </div>

              {payMethod === "card" ? (
                <div>
                  <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Stewardship Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer font-semibold"
                  >
                    {offeringTypes.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">{payMethod === "mtn" ? "MTN" : "Airtel"} Wallet Name</label>
                    <input 
                      type="text"
                      required
                      placeholder="Enter wallet full name"
                      value={airtelName}
                      onChange={(e) => setAirtelName(e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold ${payMethod === "mtn" ? "focus:border-amber-500" : "focus:border-rose-500"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">{payMethod === "mtn" ? "MTN" : "Airtel"} Mobile Number</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 0977123456"
                      value={airtelPhone}
                      onChange={(e) => setAirtelPhone(e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold ${payMethod === "mtn" ? "focus:border-amber-500" : "focus:border-rose-500"}`}
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Transaction ID / Reference (Optional)</label>
                    <input 
                      type="text"
                      placeholder={payMethod === "mtn" ? "e.g. MTN260628.5678" : "e.g. AT260628.1234"}
                      value={airtelReference}
                      onChange={(e) => setAirtelReference(e.target.value)}
                      className={`w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold ${payMethod === "mtn" ? "focus:border-amber-500" : "focus:border-rose-500"}`}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Amount (Kwacha - K)</label>
                <input 
                  type="number"
                  required
                  min="1"
                  placeholder="Enter amount e.g. 500"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div className="text-[10px] leading-relaxed font-semibold bg-slate-50 rounded-lg p-2.5 border border-slate-150">
                {payMethod === "card" ? (
                  <span className="text-slate-500">🛡️ Transacting through our local banking network. An automated tax exemption certificate and church statement will be generated immediately.</span>
                ) : payMethod === "mtn" ? (
                  <span className="text-amber-600 font-semibold">📲 Submit your MTN Money transaction. The leadership team will review the transaction, assign it to your chosen giving category, and post it to your ledger.</span>
                ) : (
                  <span className="text-rose-600 font-semibold">📲 Submit your Airtel Money transaction. The leadership team will review the transaction, assign it to your chosen giving category, and post it to your ledger.</span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-1 shadow-sm"
                >
                  {isSubmitting ? "Processing..." : "Tender Giving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMMPrompt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-250" id="mm-ussd-overlay">
          <div className="bg-[#2B2D2F] border-4 border-slate-700 text-[#DFE0E2] rounded-[24px] max-w-sm w-full shadow-2xl p-6 relative overflow-hidden font-mono text-sm max-w-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
            {/* Phone Screen Notch / Speaker bar */}
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-700/50">
              <div className="w-10 h-1 bg-slate-600 rounded-full" />
            </div>

            {/* USSD Dialog Style */}
            <div className="bg-[#E6E8EA] text-slate-900 p-4 rounded-xl shadow-inner border border-white space-y-4">
              <div className="border-b border-slate-300 pb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${mmPromptNetwork === "airtel" ? "bg-rose-500 animate-pulse" : "bg-amber-500 animate-pulse"}`} />
                  {mmPromptNetwork === "airtel" ? "Airtel Money" : "MTN MoMo"}
                </span>
                <span>ZAMTEL / SECURE</span>
              </div>

              {mmPromptStatus === "awaiting_pin" && (
                <form onSubmit={handleMMApproveSubmit} className="space-y-4">
                  <p className="text-xs leading-relaxed text-slate-700 font-semibold">
                    Pay Merchant: <span className="font-extrabold text-slate-900">GRACE COMMUNITY ASSEMBLY</span>
                    <br />
                    Amount: <span className="font-extrabold text-slate-900 text-sm">K{mmPromptAmount.toFixed(2)}</span>
                    <br />
                    Ref: <span className="text-slate-600 break-all">{mmPromptReference}</span>
                    <br />
                    Wallet: <span className="text-slate-600">{mmPromptPhone}</span>
                  </p>
                  
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500">Enter your 4-Digit PIN to Approve:</label>
                    <input 
                      type="password"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      required
                      autoFocus
                      placeholder="••••"
                      value={mmPromptPin}
                      onChange={(e) => setMmPromptPin(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-widest text-lg font-bold bg-white border border-slate-300 rounded-lg py-2 focus:border-slate-500 outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-200">
                    <button 
                      type="button" 
                      onClick={() => setShowMMPrompt(false)}
                      className="w-1/2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg text-xs tracking-wider uppercase border border-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="w-1/2 bg-slate-800 hover:bg-slate-950 text-white font-bold py-2 rounded-lg text-xs tracking-wider uppercase cursor-pointer shadow-sm"
                    >
                      Send PIN
                    </button>
                  </div>
                </form>
              )}

              {mmPromptStatus === "submitting" && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider animate-pulse">Broadcasting USSD SIM Toolkit Request...</p>
                </div>
              )}

              {mmPromptStatus === "success" && (
                <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-sm">
                    ✓
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">PIN Accepted!</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                    Zambia Gateway broadcast approved. Transaction Reference <span className="font-bold text-slate-700">{mmPromptReference}</span> logged to finance registry.
                  </p>
                </div>
              )}

              {mmPromptStatus === "failed" && (
                <div className="text-center py-6 space-y-3 animate-in zoom-in-95">
                  <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✕
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Failed</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Airtel/MTN gateway returned an invalid status. Please check your PIN and balance and try again.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => setMmPromptStatus("awaiting_pin")}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-4 rounded-lg text-[10px] uppercase border border-slate-300"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Back Button / Navigation bar at the bottom of the device */}
            <div className="flex justify-center items-center mt-6">
              <button 
                onClick={() => setShowMMPrompt(false)}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700/50 flex items-center justify-center shadow-md cursor-pointer transition-colors"
                title="Exit handset view"
              >
                <div className="w-3.5 h-3.5 border-2 border-slate-500 rounded-[3px]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. TASKS VIEW
// ==========================================
interface TasksViewProps {
  user: UserType;
  state: DatabaseState;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onToast: (msg: string) => void;
  onUpdateState?: (state: any) => void;
}
export function TasksView({ user, state, onUpdateTask, onToast, onUpdateState }: TasksViewProps) {
  const isDeacon = user.role === "deacon";
  const tasks = isDeacon 
    ? (state.tasks || []).filter((t) => t.assignee === "Deacon Winnie" || t.assignee === user.name)
    : (state.tasks || []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getAuthorityLevel = (m: any) => {
    if (!m) return 1;
    if (m.role === "admin") return 6;
    if (m.role === "pastor" && m.pastorType === "main") return 6; // Lead Pastor
    if (m.role === "pastor") return 5; // Pastor
    if (m.role === "elder") return 4; // Elder
    if (m.role === "deacon") return 3; // Deacon
    if (m.spiritualGrowthLevel === "Group Shepherd" || m.spiritualGrowthLevel === "Disciple Maker") return 2; // Ministry Leader
    return 1; // Member / Lower
  };

  const currentUserMember = (state.members || []).find((m) => m.email === user.email || m.name === user.name) || user;
  const userLevel = getAuthorityLevel(currentUserMember);

  const shareMinistryGroup = (m1: any, m2: any) => {
    const g1 = m1.groups || [];
    const g2 = m2.groups || [];
    return g1.some((g: string) => g2.includes(g));
  };

  const assignableMembers = (state.members || []).filter((m) => {
    // Cannot assign to self
    if (m.id === currentUserMember.id || m.name === currentUserMember.name) {
      return false;
    }
    const targetLevel = getAuthorityLevel(m);
    
    // Level must be strictly lower
    if (targetLevel >= userLevel) {
      return false;
    }
    
    // Ministry Leaders (Level 2) can only assign to Members (Level 1) within their ministry (shared groups)
    if (userLevel === 2) {
      if (!shareMinistryGroup(currentUserMember, m)) {
        return false;
      }
    }
    
    return true;
  });

  const finalLeaders = assignableMembers.map((m) => m.name);

  // Initialize assignee if empty or not eligible
  useEffect(() => {
    if (finalLeaders.length > 0) {
      if (!taskAssignee || !finalLeaders.includes(taskAssignee)) {
        setTaskAssignee(finalLeaders[0]);
      }
    } else {
      setTaskAssignee("");
    }
  }, [finalLeaders, taskAssignee]);

  const handleUpdate = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "pending" ? "in-progress" : "completed";
    onUpdateTask(id, { status: nextStatus });
    onToast("Task state updated!");
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskDue || !taskAssignee) {
      onToast("Please fill in all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskTitle,
          priority: taskPriority,
          assignee: taskAssignee,
          due: taskDue,
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Successfully assigned task: ${taskTitle}`);
        if (onUpdateState) {
          onUpdateState(data.state);
        }
        setShowAddModal(false);
        setTaskTitle("");
        setTaskDue("");
      } else {
        onToast("Failed to assign task.");
      }
    } catch (err) {
      onToast("Error saving task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPrioColor = (p: string) => {
    return p === "high" ? "bg-red-50 text-red-700" : p === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600";
  };

  const getStatusColor = (s: string) => {
    return s === "completed" ? "bg-emerald-50 text-emerald-700" : s === "in-progress" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
  };

  const canGiveAssignments = userLevel > 1;

  return (
    <div className="space-y-6" id="tasks-checklist">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-850">
            {isDeacon ? "My Ministry Assignments" : "Ministry Task Assignment"}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            Maintain and coordinate operational duties throughout the deacon assembly
          </p>
        </div>
        {canGiveAssignments && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Plus size={16} />
            <span>Give Assignment</span>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-white border border-slate-200 rounded-xl">
            <Clipboard className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-xs font-semibold">No ministry tasks currently assigned</p>
          </div>
        ) : (
          tasks.map((t) => (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{t.title}</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getPrioColor(t.priority)}`}>
                    {t.priority}
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] mt-1.5 font-semibold">Assigned: {t.assignee} · Due date: {t.due}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusColor(t.status)}`}>
                  {t.status}
                </span>
                {t.status !== "completed" && (
                  <button
                    onClick={() => handleUpdate(t.id, t.status)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm shadow-slate-100"
                  >
                    Advance State
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Assign Church Task</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg leading-relaxed font-semibold">
                Tasks can only be given to active church leaders (Pastor, Elder, Deacon, Admin) as members are exempt from church operational assignments.
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Task Title / Operational Duty *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prepare Communion Elements"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Assign Task To *</label>
                {finalLeaders.length > 0 ? (
                  <select
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                  >
                    {finalLeaders.map((leader) => (
                      <option key={leader} value={leader}>
                        {leader}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-red-500 text-xs italic font-semibold">
                    No eligible candidates at a lower authority level{userLevel === 2 ? " within your ministry" : ""} are currently registered in the database.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || finalLeaders.length === 0}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {isSubmitting ? "Assigning..." : "Assign Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 6. MESSAGES VIEW
// ==========================================
interface MessagesViewProps {
  user: UserType;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh: () => void;
  onViewSermon?: (id: string) => void;
}

export function MessagesView({ user, state, onToast, onRefresh, onViewSermon }: MessagesViewProps) {
  const [activeContactName, setActiveContactName] = useState<string>("Pastor Benson");
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const [showAttachSermon, setShowAttachSermon] = useState(false);
  const [selectedSermonId, setSelectedSermonId] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  // Get all registered users except current user
  const allDbUsers = React.useMemo(() => {
    const list = new Map<string, string>();
    const defaults = [
      { name: "Pastor Benson Nyirenda", role: "pastor" },
      { name: "Deconess Celina", role: "deacon" },
      { name: "Pastor John", role: "elder" },
      { name: "Deconess Winnie Nyirenda", role: "deacon" },
      { name: "Pastor Teddy", role: "pastor" },
      { name: "Elder Chileshe", role: "elder" },
      { name: "Elder Sem", role: "elder" },
      { name: "Deacon Mukandawile", role: "deacon" },
      { name: "Church Admin", role: "admin" }
    ];
    defaults.forEach(c => list.set(c.name, c.role));
    (state.users || []).forEach((u: any) => {
      if (u.name) list.set(u.name, u.role);
    });
    (state.members || []).forEach((m: any) => {
      if (m.name) list.set(m.name, m.role);
    });

    return Array.from(list.entries())
      .map(([name, role]) => ({ name, role }))
      .filter((u) => u.name !== user.name);
  }, [state.users, state.members, user.name]);

  // filter contacts based on query and role visibility
  const contactsList = React.useMemo(() => {
    const query = contactSearch.toLowerCase().trim();
    if (query) {
      return allDbUsers.filter(u => u.name.toLowerCase().includes(query));
    } else {
      // Default view: only show senior leaders (pastor, elder, deacon, admin)
      return allDbUsers.filter(u => ["pastor", "elder", "deacon", "admin"].includes(u.role));
    }
  }, [allDbUsers, contactSearch]);

  // Safeguard against self-chat or blank threads
  React.useEffect(() => {
    if (activeContactName === user.name && contactsList.length > 0) {
      setActiveContactName(contactsList[0].name);
    }
  }, [user.name, activeContactName, contactsList]);

  // Get messages for current active thread
  // Direct messages between user.name and activeContactName
  const threadMessages = (state.messages || []).filter((m) => {
    // Exclude group messages (they have groupId)
    if (m.groupId) return false;
    return (m.from === user.name && m.to === activeContactName) || 
           (m.from === activeContactName && m.to === user.name);
  }).sort((a, b) => a.id.localeCompare(b.id)); // chronological order for thread view!

  const handleSendDirectMessage = async (e: React.FormEvent, contentText: string, attachment?: { type: string, id: string, preview: string }) => {
    if (e) e.preventDefault();
    const text = contentText.trim();
    if (!text && !attachment) return;

    setIsSending(true);
    try {
      const payload: any = {
        from: user.name,
        to: activeContactName,
        preview: attachment ? attachment.preview : (text.substring(0, 35) + (text.length > 35 ? "..." : "")),
        content: text
      };

      if (attachment) {
        payload.attachmentType = attachment.type;
        payload.attachmentId = attachment.id;
      }

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setChatInput("");
        onRefresh();
      } else {
        onToast("Failed to transmit chat message.");
      }
    } catch (err) {
      onToast("Error connecting to message broker.");
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachSermon = async () => {
    if (!selectedSermonId) return;
    const sermon = (state.sermons || []).find((s) => s.id === selectedSermonId);
    if (!sermon) return;

    await handleSendDirectMessage(null as any, `I recommend checking out this sermon outline: "${sermon.title}". May it bless your spiritual walk!`, {
      type: "sermon",
      id: sermon.id,
      preview: `Sermon recommendation: "${sermon.title}"`
    });

    setShowAttachSermon(false);
    setSelectedSermonId("");
    onToast(`Sermon outline attached and sent to ${activeContactName}!`);
  };

  const isPastor = ["pastor", "admin"].includes(user.role);

  return (
    <div className="space-y-6" id="messages-inbox-portal">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Ecclesiastical Chat Portal</h2>
          <p className="text-slate-500 text-xs mt-1">
            Direct secure communication with shepherding offices and local church members
          </p>
        </div>
        <button 
          onClick={() => setShowCompose(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
        >
          <Plus size={14} />
          <span>New Conversation</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[500px]">
        {/* Left Side: Directory/Threads list */}
        <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 bg-slate-55 border-b border-slate-150 font-bold text-[11px] text-slate-500 uppercase tracking-wider">
            Conversations Directory
          </div>
          <div className="p-2 border-b border-slate-150 bg-white">
            <input
              type="text"
              placeholder="🔍 Search members..."
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-blue-500 font-semibold"
            />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {contactsList.map((contact) => {
              const isActive = activeContactName === contact.name;
              // Check if any unread messages from this sender
              const unreadCount = (state.messages || []).filter((m) => m.from === contact.name && m.to === user.name && m.unread).length;

              return (
                <div
                  key={contact.name}
                  onClick={() => setActiveContactName(contact.name)}
                  className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isActive 
                      ? "bg-blue-50/40 border-l-4 border-l-blue-600" 
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0" 
                      style={{ backgroundColor: avatarBg(contact.name) }}
                    >
                      {initials(contact.name)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-xs truncate">{contact.name}</span>
                        <span className="text-[9px] px-1 bg-slate-100 text-slate-500 rounded font-semibold capitalize scale-90">
                          {contact.role}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] truncate mt-0.5">Secure connection established</p>
                    </div>
                  </div>

                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Thread Chat View */}
        <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between overflow-hidden h-full">
          {/* Active Contact Header */}
          <div className="p-3.5 bg-slate-55 border-b border-slate-150 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs" 
                style={{ backgroundColor: avatarBg(activeContactName) }}
              >
                {initials(activeContactName)}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs">{activeContactName}</h4>
                <p className="text-[10px] text-slate-400">Direct Message Thread · End-to-End Encrypted</p>
              </div>
            </div>

            {/* Pastor quick tools */}
            {isPastor && (
              <button
                onClick={() => setShowAttachSermon(true)}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-2.5 py-1 rounded text-[10px] inline-flex items-center gap-1 transition-all border border-indigo-100 cursor-pointer shadow-xs"
              >
                <BookOpen size={11} />
                <span>Attach Sermon Outline</span>
              </button>
            )}
          </div>

          {/* Messages Log area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40 flex flex-col">
            {threadMessages.map((msg) => {
              const isSelf = msg.from === user.name;
              const hasSermon = msg.attachmentType === "sermon";
              const isThankYou = msg.attachmentType === "prayer_thankyou";

              return (
                <div key={msg.id} className={`flex flex-col max-w-[75%] ${isSelf ? "self-end items-end" : "self-start items-start"}`}>
                  <div className={`p-3 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                    isSelf 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                  }`}>
                    <p className="font-medium leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                    {/* Render Sermon Card in Chat */}
                    {hasSermon && (
                      <div 
                        onClick={() => {
                          if (msg.attachmentId && onViewSermon) {
                            onViewSermon(msg.attachmentId);
                          } else {
                            onToast("Opening sermon outline...");
                            if (onViewSermon) onViewSermon("1");
                          }
                        }}
                        className={`mt-2 p-2.5 rounded-lg border flex gap-2.5 items-center cursor-pointer hover:scale-[1.01] transition-transform ${
                          isSelf ? "bg-white/10 border-white/20 text-white" : "bg-indigo-50/50 border-indigo-100 text-slate-850"
                        }`}
                      >
                        <BookOpen size={18} className={isSelf ? "text-amber-300" : "text-indigo-600"} />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[10px] uppercase opacity-75 tracking-wider">Shared Sermon Outline (Click to open)</p>
                          <p className="text-[11px] font-extrabold truncate mt-0.5">{msg.preview}</p>
                        </div>
                      </div>
                    )}

                    {/* Render Thank You Card in Chat */}
                    {isThankYou && (
                      <div className={`mt-2 p-2.5 rounded-lg border flex gap-2.5 items-center ${
                        isSelf ? "bg-white/10 border-white/20 text-white" : "bg-red-50/50 border-red-150 text-slate-850"
                      }`}>
                        <Heart size={18} className="text-red-500 fill-red-500" />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[10px] uppercase opacity-75 tracking-wider">Prayer Alert Thank You</p>
                          <p className="text-[11px] font-extrabold truncate mt-0.5">"Thank you for praying with me!"</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">{msg.time}</span>
                </div>
              );
            })}

            {threadMessages.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 italic space-y-2 py-10">
                <MessageSquare size={32} />
                <p className="text-[11px]">No messages in this direct line yet. Type below to begin fellowship.</p>
              </div>
            )}
          </div>

          {/* Send Input Area */}
          <form 
            onSubmit={(e) => handleSendDirectMessage(e, chatInput)} 
            className="p-3 border-t border-slate-200 bg-white flex gap-2 items-center shrink-0"
          >
            <input
              type="text"
              placeholder={`Send message to ${activeContactName}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 font-semibold"
            />
            <button
              type="submit"
              disabled={isSending || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Attach Sermon Outline Modal */}
      {showAttachSermon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 text-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Select Sermon Outline to Attach</h3>
              <button 
                onClick={() => setShowAttachSermon(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Sermon Outline</label>
                <select
                  value={selectedSermonId}
                  onChange={(e) => setSelectedSermonId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                >
                  <option value="">-- Choose sermon --</option>
                  {(state.sermons || []).map((s) => (
                    <option key={s.id} value={s.id}>{s.title} ({s.scripture})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAttachSermon(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttachSermon}
                  disabled={!selectedSermonId}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Attach & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Conversation Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 text-xs">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Start Direct Conversation</h3>
              <button 
                onClick={() => setShowCompose(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Select Church Contact</label>
                <select
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                >
                  <option value="">-- Choose recipient --</option>
                  {allDbUsers.map((contact) => (
                    <option key={contact.name} value={contact.name}>{contact.name} ({contact.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Initial Message</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Type message to initiate thread..."
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-medium resize-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!composeTo || !composeBody.trim()) {
                      onToast("Recipient and initial message are required.");
                      return;
                    }
                    setActiveContactName(composeTo);
                    await handleSendDirectMessage(null as any, composeBody);
                    setComposeBody("");
                    setShowCompose(false);
                    onToast(`Conversation with ${composeTo} initiated successfully!`);
                  }}
                  disabled={!composeTo || !composeBody.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Start Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. REPORTS VIEW
// ==========================================
// 7. REPORTS VIEW
// ==========================================
interface ReportsViewProps {
  user: UserType;
  state: DatabaseState;
}

export function ReportsView({ user, state }: ReportsViewProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFinancials = () => {
    let csv = "Category,Type,Amount (K),Date,Submitted By/To\n";
    const incomes = state.finances?.income || [];
    const expenses = state.finances?.expenses || [];
    
    incomes.forEach((tx: any) => {
      csv += `"${tx.category || "Tithe"}","Income","${tx.amount}","${tx.date}","${tx.name || "System"}"\n`;
    });
    expenses.forEach((tx: any) => {
      csv += `"${tx.category || "Rent"}","Expense","${tx.amount}","${tx.date}","${tx.name || "System"}"\n`;
    });

    downloadCSV("Ministry_Financial_Ledger_Report.csv", csv);
  };

  const handleDownloadMetrics = () => {
    let csv = "Metric,Value\n";
    const metrics = [
      { label: "Annual Member Growth", val: "8.3%" },
      { label: "Average Sunday Worship", val: "253" },
      { label: "Faith Giving YTD", val: "K344,000" },
      { label: "New Believers This Month", val: "12" },
      { label: "Cell Small Groups Joined", val: "64%" }
    ];
    metrics.forEach(m => {
      csv += `"${m.label}","${m.val}"\n`;
    });
    downloadCSV("Ministry_Key_Analytics_Metrics.csv", csv);
  };

  const handleDownloadAttendanceHistory = () => {
    let csv = "Date/Week,Sunday Attendance,Midweek Attendance,Youth Attendance,Total,Submitted By,Status,Level,Notes\n";
    (state.attendance || []).forEach((row: any) => {
      const isNew = row.date !== undefined;
      const dateVal = isNew ? row.date : row.week;
      const sun = isNew ? (row.male || 0) + (row.female || 0) : (row.sunday || 0);
      const mid = isNew ? 0 : (row.midweek || 0);
      const yth = isNew ? (row.kids || 0) : (row.youth || 0);
      const tot = isNew ? (row.total || 0) : (sun + mid + yth);
      csv += `"${dateVal}","${sun}","${mid}","${yth}","${tot}","${row.submittedBy || "System"}","${row.status || "Approved"}","${row.level || "Mixed"}","${(row.notes || "").replace(/"/g, '""')}"\n`;
    });
    downloadCSV("Congregational_Attendance_Report.csv", csv);
  };

  // Check if current user is Pastor, Elder or Admin
  const isShepherd = ["pastor", "elder", "admin"].includes(user.role);

  // Load selected member details
  const members = state.members || [];
  const selectedMember = members.find(m => m.id === selectedMemberId);

  // Get selected member's giving & prayer history
  const memberContributions = selectedMember
    ? (state.finances?.income || []).filter((tx: any) => 
        tx.name?.toLowerCase().includes(selectedMember.name.toLowerCase())
      )
    : [];

  const memberPrayers = selectedMember
    ? (state.prayerRequests || []).filter((pr: any) => 
        pr.member?.toLowerCase() === selectedMember.name.toLowerCase()
      )
    : [];

  const memberGroups = selectedMember
    ? (state.groups || []).filter((g: any) => 
        g.memberNames?.includes(selectedMember.name) || selectedMember.groups?.includes(g.id)
      )
    : [];

  const handleDownloadSelectedMemberReport = () => {
    if (!selectedMember) return;
    
    let content = `=== SPIRITUAL & FINANCIAL AUDIT: ${selectedMember.name.toUpperCase()} ===\n`;
    content += `Generated Date: ${new Date().toISOString().split("T")[0]}\n`;
    content += `Email: ${selectedMember.email}\n`;
    content += `Phone: ${selectedMember.phone}\n`;
    content += `Ministry Role: ${selectedMember.role.toUpperCase()}\n`;
    content += `Member Since: ${selectedMember.memberSince}\n`;
    content += `Spiritual Attendance Metric: ${selectedMember.attendance}%\n`;
    content += `Assigned Attendance Duty: ${selectedMember.assignedAttendanceDuty ? "YES" : "NO"}\n`;
    content += `Connected Small Groups: ${memberGroups.map(g => g.name).join("; ") || "None"}\n\n`;

    content += `=== TITHE & GIVING RECORD ===\n`;
    content += `Date,Category,Amount (K),Channel\n`;
    if (memberContributions.length > 0) {
      memberContributions.forEach((tx: any) => {
        content += `"${tx.date}","${tx.category}","${tx.amount}","Online Portal"\n`;
      });
    } else {
      content += `No custom giving transactions registered on file. (Showing default manual stewardship average: K350/mo)\n`;
    }
    content += `\n`;

    content += `=== CONGREGATIONAL PRAYER BOARD LIFE ===\n`;
    content += `Date,Category,Status,Intercessors Count,Request Text\n`;
    if (memberPrayers.length > 0) {
      memberPrayers.forEach((p: any) => {
        content += `"${p.date}","${p.category}","${p.status}","${p.prayers}","${p.request?.replace(/"/g, '""')}"\n`;
      });
    } else {
      content += `No active prayer requests submitted.\n`;
    }

    downloadCSV(`Spiritual_Audit_${selectedMember.name.replace(/\s+/g, "_")}.csv`, content);
  };

  return (
    <div className="space-y-6" id="ministry-reports">
      {/* Header and Download Button bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850 font-sans tracking-tight">Ministry Analytical Reports</h2>
          <p className="text-slate-500 text-xs mt-1">Consolidated analytics reports and downloadable spiritual growth spreadsheets</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleDownloadFinancials}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          >
            <Download size={14} />
            <span>Financial CSV</span>
          </button>
          <button
            onClick={handleDownloadAttendanceHistory}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Download size={14} />
            <span>Attendance CSV</span>
          </button>
          <button
            onClick={handleDownloadMetrics}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-slate-200"
          >
            <Download size={14} />
            <span>Metrics CSV</span>
          </button>
        </div>
      </div>

      {/* Main analytical blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Monthly Revenue Inflow Trends (K)</h3>
          <div className="flex items-end justify-between h-36 px-4">
            {[
              { label: "Jan", val: 45 },
              { label: "Feb", val: 52 },
              { label: "Mar", val: 48 },
              { label: "Apr", val: 55 },
              { label: "May", val: 58 },
              { label: "Jun", val: 62 }
            ].map((b, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-bold text-slate-400">K{b.val}K</span>
                <div className="w-6 rounded-t bg-gradient-to-t from-blue-500 to-indigo-600" style={{ height: `${b.val * 1.5}px` }} />
                <span className="text-[10px] font-semibold text-slate-500">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Key Ministry Analytics Metrics</h3>
          <div className="space-y-2">
            {[
              { label: "Annual Member Growth", val: "8.3%", color: "text-emerald-600" },
              { label: "Average Sunday Worship", val: "253", color: "text-blue-600" },
              { label: "Faith Giving YTD", val: "K344,000", color: "text-emerald-600" },
              { label: "New Believers This Month", val: "12", color: "text-purple-600" },
              { label: "Cell Small Groups Joined", val: "64%", color: "text-indigo-600" }
            ].map((m, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200/50 rounded-lg text-xs">
                <span className="font-semibold text-slate-750">{m.label}</span>
                <span className={`font-extrabold ${m.color}`}>↑ {m.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shepherd auditing tool */}
      {isShepherd ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-850 text-sm flex items-center gap-2">
              <Shield size={16} className="text-blue-600" />
              <span>Pastor & Elder Member Spiritual Audit Panel</span>
            </h3>
            <p className="text-slate-500 text-xs mt-1">Check any member's detailed prayer requests board index, financial tithing patterns, and attendance history</p>
          </div>

          <div className="max-w-md">
            <label className="block text-slate-700 font-bold text-xs mb-2">Select Member to Audit</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer text-slate-850 font-semibold"
            >
              <option value="">-- Choose a Congregation Member --</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {selectedMember ? (
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-slate-50 p-5 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200/70 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-base select-none shrink-0"
                    style={{ backgroundColor: avatarBg(selectedMember.name) }}
                  >
                    {initials(selectedMember.name)}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-850 text-sm">{selectedMember.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold uppercase">{selectedMember.role} • Registered Since {selectedMember.memberSince}</p>
                  </div>
                </div>

                <button
                  onClick={handleDownloadSelectedMemberReport}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-sm"
                >
                  <Download size={13} />
                  <span>Download Spiritual Audit CSV</span>
                </button>
              </div>

              {/* Grid detail metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-150 rounded-lg p-3 text-xs">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Contact Metadata</p>
                  <p className="text-slate-800 font-semibold truncate"><span className="text-slate-400">E:</span> {selectedMember.email}</p>
                  <p className="text-slate-800 font-semibold mt-1"><span className="text-slate-400">P:</span> {selectedMember.phone}</p>
                </div>
                <div className="bg-white border border-slate-150 rounded-lg p-3 text-xs">
                  <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Weekly Care & Groups</p>
                  <p className="text-slate-800 font-bold">
                    {memberGroups.length > 0 ? memberGroups.map(g => g.name).join(", ") : "Not in any Connection Group"}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-1 font-medium">Spiritual Retention Index</p>
                </div>
                <div className="bg-white border border-slate-150 rounded-lg p-3 text-xs flex flex-col justify-between">
                  <div>
                    <p className="text-slate-400 font-bold uppercase text-[9px] tracking-wider mb-1">Sanctuary Attendance Ratio</p>
                    <p className="text-slate-800 font-bold text-sm">{selectedMember.attendance}%</p>
                  </div>
                  <span className={`text-[9px] font-extrabold tracking-wide uppercase mt-1 px-1.5 py-0.5 rounded max-w-max ${
                    selectedMember.assignedAttendanceDuty ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {selectedMember.assignedAttendanceDuty ? "Has Attendance Logging Duty" : "No Attendance Logging Duty"}
                  </span>
                </div>
              </div>

              {/* Giving ledger & prayers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Giving segment */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>Tithing & Stewardship Logs</span>
                    <span className="text-blue-600 font-bold normal-case text-[10px]">{memberContributions.length} records found</span>
                  </h5>
                  {memberContributions.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {memberContributions.map((tx: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-850">{tx.category}</span>
                            <span className="text-[10px] text-slate-400 ml-2">{tx.date}</span>
                          </div>
                          <span className="font-extrabold text-emerald-600">K{tx.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic p-4 text-center">No online giving logs registered. Member may contribute manually via envelopes.</p>
                  )}
                </div>

                {/* Prayers segment */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                  <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <span>Prayer Chain Active History</span>
                    <span className="text-purple-600 font-bold normal-case text-[10px]">{memberPrayers.length} requested</span>
                  </h5>
                  {memberPrayers.length > 0 ? (
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {memberPrayers.map((pr: any, idx: number) => (
                        <div key={idx} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-extrabold uppercase">{pr.category}</span>
                            <span className={`text-[9px] font-bold uppercase ${pr.status === "answered" ? "text-emerald-600" : "text-blue-600"}`}>{pr.status}</span>
                          </div>
                          <p className="text-slate-700 italic truncate font-medium">"{pr.request}"</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{pr.date} • Lifted by {pr.prayers} intercessors</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic p-4 text-center">No submitted prayer requests registered on file.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-slate-250 rounded-xl p-8 text-center text-slate-400 italic text-xs font-semibold">
              Please select a member above to execute a custom spiritual, giving and growth audit.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-500 text-xs italic">
          🔒 Pastoral spiritual audit features and personal tithing records are restricted to the Pastor, Elders, and Administrators.
        </div>
      )}
    </div>
  );
}

// ==========================================
// 8. USER MANAGEMENT VIEW
// ==========================================
interface UsersViewProps {
  user: UserType;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh: () => void;
}

export function UsersView({ user, state, onToast, onRefresh }: UsersViewProps) {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<any>("member");
  const [pastorType, setPastorType] = useState<'main' | 'associate'>("associate");
  const [isCreating, setIsCreating] = useState(false);

  // Edit user states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState<any>("member");
  const [editUserPhone, setEditUserPhone] = useState("");
  const [editPastorType, setEditPastorType] = useState<'main' | 'associate'>("associate");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStartEditUser = (u: any) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserRole(u.role);
    setEditUserPhone(u.phone || "");
    setEditUserPassword(""); // Blank keeps old password
    setEditPastorType(u.pastorType || "associate");
    setShowEditModal(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserName || !editUserEmail) {
      onToast("Name and email are required.");
      return;
    }
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName,
          email: editUserEmail,
          role: editUserRole,
          phone: editUserPhone,
          password: editUserPassword,
          pastorType: editUserRole === "pastor" ? editPastorType : undefined,
          spiritualGrowthLevel: editUserRole === "pastor" && editPastorType === "main" ? "Spiritual Father / Pastor" : undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        onToast(`Portal Account for ${editUserName} updated successfully!`);
        setShowEditModal(false);
        fetchUsers();
        onRefresh();
      } else {
        onToast(data.message || "Failed to update account.");
      }
    } catch (err) {
      onToast("Error: Account update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [state]);

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      onToast("Please supply all user credential details.");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role,
          pastorType: role === "pastor" ? pastorType : undefined
        })
      });
      const data = await response.json();
      if (data.success) {
        onToast(`Portal Account successfully created for ${name}!`);
        setName("");
        setEmail("");
        setPassword("");
        setRole("member");
        setPastorType("associate");
        setShowAddModal(false);
        fetchUsers();
        onRefresh();
      } else {
        onToast(data.message || "Failed to register account.");
      }
    } catch (err) {
      onToast("Error: Account register failed.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === "5" || userName === user.name) {
      onToast("Security Lock: You cannot delete the core System Admin or your own active session!");
      return;
    }
    if (!window.confirm(`Are you absolutely sure you want to terminate the portal account for ${userName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onToast(`User portal credentials for ${userName} have been revoked.`);
        fetchUsers();
        onRefresh();
      }
    } catch (err) {
      onToast("Error deleting user.");
    }
  };

  return (
    <div className="space-y-6" id="users-directory">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-850">User Portal Accounts</h2>
          <p className="text-slate-500 text-xs mt-1">Audit active portal accounts with custom office privileges</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Plus size={14} />
          <span>Add Portal Account</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3.5">User Identity</th>
                <th className="p-3.5">Portal Role</th>
                <th className="p-3.5">Email Address</th>
                <th className="p-3.5">Member Since</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-55">
                  <td className="p-3.5 font-bold text-slate-800">{u.name}</td>
                  <td className="p-3.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-500">{u.email}</td>
                  <td className="p-3.5 text-slate-400 font-medium">{u.memberSince || "2020-01-15"}</td>
                  <td className="p-3.5 text-right">
                    <button 
                      onClick={() => handleStartEditUser(u)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer mr-1.5"
                      title="Edit User Login"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Create New Portal Account</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUserSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Mary Chanda"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email Address</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. mary@church.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Temporary Password</label>
                <input 
                  type="password"
                  required
                  placeholder="Choose temporary password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Ecclesiastical Privilege Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer font-semibold"
                >
                  <option value="member">Congregation Member</option>
                  <option value="deacon">Deacon / Deaconess</option>
                  <option value="elder">Church Elder</option>
                  <option value="pastor">Senior Pastor</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {role === "pastor" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-indigo-950 font-extrabold text-[9px] uppercase tracking-wider">Pastor Type Assignment *</label>
                  <select
                    value={pastorType}
                    onChange={(e) => {
                      const val = e.target.value as 'main' | 'associate';
                      setPastorType(val);
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none font-bold text-indigo-900 cursor-pointer"
                  >
                    <option value="associate">Associate Pastor</option>
                    <option value="main">Main / Senior Pastor</option>
                  </select>
                  <p className="text-[10px] text-indigo-700 font-medium leading-relaxed">
                    {pastorType === "main" 
                      ? "💡 Senior Pastors default to the 'Spiritual Father / Pastor' Discipleship Pathway Stage." 
                      : "💡 Associate Pastors default to the 'Ministry Volunteer' stage."}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  {isCreating ? "Registering..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Edit Portal Account Credentials</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditUserSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Mary Chanda"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Email / Username</label>
                <input 
                  type="email"
                  required
                  placeholder="e.g. mary@church.org"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Phone Number (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g. 0977123456"
                  value={editUserPhone}
                  onChange={(e) => setEditUserPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-slate-700 font-bold text-[10px] uppercase">Portal Password</label>
                  <span className="text-[9px] text-slate-400 font-bold lowercase">Leave blank to keep current</span>
                </div>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[10px] uppercase mb-1">Ecclesiastical Privilege Role</label>
                <select 
                  value={editUserRole}
                  onChange={(e) => setEditUserRole(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer font-semibold"
                >
                  <option value="member">Congregation Member</option>
                  <option value="deacon">Deacon / Deaconess</option>
                  <option value="elder">Church Elder</option>
                  <option value="pastor">Senior Pastor</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>

              {editUserRole === "pastor" && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-indigo-950 font-extrabold text-[9px] uppercase tracking-wider">Pastor Type Assignment *</label>
                  <select
                    value={editPastorType}
                    onChange={(e) => {
                      const val = e.target.value as 'main' | 'associate';
                      setEditPastorType(val);
                    }}
                    className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs outline-none font-bold text-indigo-900 cursor-pointer"
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUpdating}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs"
                >
                  {isUpdating ? "Updating..." : "Save Credentials"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 9. SETTINGS VIEW
// ==========================================
interface SettingsViewProps {
  user: UserType;
  state: DatabaseState | null;
  onUpdateUser: (u: UserType) => void;
  onToast: (msg: string) => void;
  onRefresh: () => void;
}

export function SettingsView({ user, state, onUpdateUser, onToast, onRefresh }: SettingsViewProps) {
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isTogglingMfa, setIsTogglingMfa] = useState(false);

  const defaultChurch = state?.churches?.[0] || { id: "1", name: "Church Kingly Anointed App", address: "123 Faith Ave, Lusaka, Zambia" };
  const [churchNameInput, setChurchNameInput] = useState(defaultChurch.name);
  const [churchAddressInput, setChurchAddressInput] = useState(defaultChurch.address);
  const [isUpdatingChurch, setIsUpdatingChurch] = useState(false);

  useEffect(() => {
    if (state?.churches?.[0]) {
      setChurchNameInput(state.churches[0].name);
      setChurchAddressInput(state.churches[0].address);
    }
  }, [state]);

  const handleUpdateChurch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchNameInput.trim() || !churchAddressInput.trim()) {
      onToast("Church Name and Address Location details cannot be empty.");
      return;
    }
    setIsUpdatingChurch(true);
    try {
      const churchId = state?.churches?.[0]?.id || "1";
      const res = await fetch(`/api/churches/${churchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: churchNameInput,
          address: churchAddressInput
        })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Church profile updated successfully!`);
        onRefresh();
      } else {
        onToast("Failed to update church identity profile.");
      }
    } catch (err) {
      onToast("Failed to connect to portal server.");
    } finally {
      setIsUpdatingChurch(false);
    }
  };

  const fetchLoginHistory = async () => {
    try {
      const res = await fetch("/api/auth/login-history");
      const data = await res.json();
      // Filter logs related to this user
      const filtered = data.filter((log: any) => log.userEmail?.toLowerCase() === user.email?.toLowerCase());
      setHistoryList(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLoginHistory();
  }, [user]);

  const [pref, setPref] = useState([
    { label: "Email Notifications", desc: "Receive email alerts for events and calendar updates", checked: true },
    { label: "SMS Broadcast Alerts", desc: "Get urgent text messages for community outreach cancellations", checked: false },
    { label: "Member Account Approvals Required", desc: "Require administrator approvals before new members gain database access", checked: true },
    { label: "Allow Public Prayers Boards", desc: "Permit verified members to publish public prayer requests", checked: true },
  ]);

  const handleToggle = (idx: number) => {
    const updated = [...pref];
    updated[idx].checked = !updated[idx].checked;
    setPref(updated);
    onToast("Preference settings updated!");
  };

  const handleToggleMfa = async () => {
    setIsTogglingMfa(true);
    const nextVal = !user.mfaEnabled;
    try {
      const res = await fetch("/api/auth/toggle-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, enabled: nextVal })
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Two-Factor Authentication is now ${nextVal ? "ENABLED" : "DISABLED"} for security.`);
        onUpdateUser(data.user);
        fetchLoginHistory();
      }
    } catch (err) {
      onToast("Failed to update 2FA state.");
    } finally {
      setIsTogglingMfa(false);
    }
  };

  return (
    <div className="space-y-6" id="settings-configurations">
      <div>
        <h2 className="text-xl font-bold text-slate-850">Church Configurations & Portal Security</h2>
        <p className="text-slate-500 text-xs mt-1">Configure database configurations, MFA policies, and view audit history logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
            <Shield size={16} className="text-blue-600" />
            <span>Portal Multi-Factor Security (2FA)</span>
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed font-semibold">
            Protect your shepherding credentials by requiring an additional 6-digit verification code when logging in from unknown devices.
          </p>
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-150 text-xs">
            <div>
              <div className="font-bold text-slate-850">Two-Factor Authentication (2FA)</div>
              <p className="text-slate-400 text-[10px] mt-0.5 font-semibold">
                Status: {user.mfaEnabled ? <span className="text-emerald-600 font-bold">● ACTIVE</span> : <span className="text-slate-500 font-bold">○ DEACTIVATED</span>}
              </p>
            </div>
            <button
              onClick={handleToggleMfa}
              disabled={isTogglingMfa}
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 outline-none ${
                user.mfaEnabled ? "bg-emerald-600" : "bg-slate-300"
              }`}
            >
              <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 shadow transition-all ${
                user.mfaEnabled ? "right-1" : "left-1"
              }`} />
            </button>
          </div>
          
          <form onSubmit={handleUpdateChurch} className="space-y-3 text-xs pt-2 border-t border-slate-100 mt-2">
            <h4 className="font-bold text-slate-700 text-[10px] uppercase">Assembly Identity Profile</h4>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Church Name</label>
              <input
                type="text"
                value={churchNameInput}
                onChange={(e) => setChurchNameInput(e.target.value)}
                disabled={user.role !== "admin"}
                placeholder="Church Kingly Anointed App"
                className={`w-full border rounded-lg px-3 py-2 outline-none font-semibold ${
                  user.role === "admin"
                    ? "bg-white border-slate-300 focus:border-blue-500"
                    : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Address Location</label>
              <input
                type="text"
                value={churchAddressInput}
                onChange={(e) => setChurchAddressInput(e.target.value)}
                disabled={user.role !== "admin"}
                placeholder="123 Faith Ave, Lusaka, Zambia"
                className={`w-full border rounded-lg px-3 py-2 outline-none font-semibold ${
                  user.role === "admin"
                    ? "bg-white border-slate-300 focus:border-blue-500"
                    : "bg-slate-50 border-slate-200"
                }`}
              />
            </div>
            {user.role === "admin" && (
              <button
                type="submit"
                disabled={isUpdatingChurch}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                {isUpdatingChurch ? "Saving Church Profile..." : "Save Church Details"}
              </button>
            )}
            {user.role !== "admin" && (
              <p className="text-[10px] text-slate-400 italic mt-1 leading-normal">
                * Note: Only the Portal Administrator can edit the church identity details.
              </p>
            )}
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">System & Alerts Preferences</h3>
          <div className="divide-y divide-slate-100 text-xs">
            {pref.map((item, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="font-bold text-slate-800 leading-snug">{item.label}</div>
                  <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed font-semibold">{item.desc}</p>
                </div>
                <button
                  onClick={() => handleToggle(i)}
                  className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 outline-none ${
                    item.checked ? "bg-blue-600" : "bg-slate-200"
                  }`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white absolute top-0.75 shadow transition-all ${
                    item.checked ? "right-1" : "left-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login History / Security Logs */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="font-bold text-slate-850 text-sm mb-1.5 flex items-center gap-1.5">
          <Activity size={16} className="text-blue-600" />
          <span>My Login Security Audit Trails</span>
        </h3>
        <p className="text-slate-500 text-[11px] mb-4">Complete historic record of your portal session logins</p>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="p-3">Login Timestamp</th>
                <th className="p-3">Session Origin Location / IP</th>
                <th className="p-3">Device Agent</th>
                <th className="p-3">Audit Outcome</th>
                <th className="p-3">2FA Secure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.map((log) => (
                <tr key={log.id} className="hover:bg-slate-55">
                  <td className="p-3 text-slate-500">
                    {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="p-3 font-semibold text-slate-700">{log.ipAddress}</td>
                  <td className="p-3 text-slate-400 font-mono text-[10px]">{log.device}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                      log.status?.includes("Success") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 font-semibold">
                    {log.mfaVerified ? (
                      <span className="text-emerald-600">✓ Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                </tr>
              ))}
              {historyList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 italic font-semibold">
                    No login records logged under this session. Turn on 2FA or re-login to populate security audit logs.
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

// ==========================================
// 10. MEMBER PROFILE VIEW
// ==========================================
export function ProfileView({ user }: { user: UserType }) {
  return (
    <div className="space-y-6" id="member-profile-viewer">
      <div>
        <h2 className="text-xl font-bold text-slate-850">My Personal Profile</h2>
        <p className="text-slate-500 text-xs mt-1">Your registered ecclesiastical record and portal details</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-white text-3xl shrink-0" style={{ backgroundColor: avatarBg(user.name) }}>
          {initials(user.name)}
        </div>
        <div className="text-center md:text-left space-y-1">
          <h3 className="text-lg font-bold text-slate-800 leading-tight">{user.name}</h3>
          <p className="text-slate-500 text-xs font-semibold">{user.email}</p>
          <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start text-[10px] font-bold">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
              Role: {user.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-55 text-slate-600 border border-slate-200">
              Registered since: {user.memberSince}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
