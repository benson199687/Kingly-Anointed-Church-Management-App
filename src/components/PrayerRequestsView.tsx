import React, { useState } from "react";
import { Heart, Lock, CheckCircle, Plus, EyeOff } from "lucide-react";
import { User, DatabaseState, PrayerRequest } from "../types";
import { avatarBg, initials } from "./Sidebar";

interface PrayerRequestsViewProps {
  user: User;
  state: DatabaseState;
  onAddPrayerRequest: (request: Partial<PrayerRequest>) => void;
  onIncrementPrayers: (id: string) => void;
  onMarkAnswered: (id: string) => void;
  onToast: (msg: string) => void;
}

export function PrayerRequestsView({
  user,
  state,
  onAddPrayerRequest,
  onIncrementPrayers,
  onMarkAnswered,
  onToast
}: PrayerRequestsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [category, setCategory] = useState<PrayerRequest["category"]>("Personal");
  const [request, setRequest] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const canManage = ["pastor", "elder", "admin"].includes(user.role);

  // Filter requests. Private requests are only visible to the author or to leadership.
  const visibleRequests = (state.prayerRequests || []).filter((p) => {
    if (p.private) {
      return canManage || p.member === user.name;
    }
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!request) {
      onToast("Prayer request content is required.");
      return;
    }
    onAddPrayerRequest({
      member: isPrivate ? "Anonymous" : user.name,
      category,
      request,
      private: isPrivate,
    });
    setRequest("");
    setCategory("Personal");
    setIsPrivate(false);
    setShowAddForm(false);
  };

  // Analyze which category is prayed for the most
  const categoryCounts = (state.prayerRequests || []).reduce((acc, pr) => {
    acc[pr.category] = (acc[pr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoriesOrdered = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const highestCategory = categoriesOrdered[0]?.[0] || "None";
  const highestCount = categoriesOrdered[0]?.[1] || 0;

  return (
    <div className="space-y-6" id="prayer-requests-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Prayer Chain Request Board</h2>
          <p className="text-slate-500 text-xs mt-1">Submit your requests and lift up fellow brothers and sisters in Christ</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          id="submit-prayer-trigger"
        >
          <Heart size={16} className="fill-white" />
          <span>Submit Request</span>
        </button>
      </div>

      {/* Prayer Analytics Summary Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="font-extrabold text-slate-800 text-[10px] tracking-wider uppercase flex items-center gap-1">
            <Heart size={10} className="fill-red-500 text-red-500" />
            <span>Active Congregation Prayer Focus</span>
          </h3>
          <p className="text-slate-650 text-xs">
            Our assembly is currently interceding the most for <strong className="text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md font-extrabold">{highestCategory}</strong> (with <strong>{highestCount} active requests</strong>).
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {["Personal", "Health", "Family", "Work", "Finance", "Other"].map((cat) => {
            const count = categoryCounts[cat] || 0;
            const percentage = (state.prayerRequests || []).length > 0
              ? Math.round((count / (state.prayerRequests || []).length) * 100)
              : 0;
            const isHighest = cat === highestCategory;
            return (
              <div
                key={cat}
                className={`border rounded-lg px-2.5 py-1 text-[11px] flex items-center gap-1.5 shadow-2xs transition-all ${
                  isHighest
                    ? "bg-blue-600 border-blue-600 text-white font-bold scale-105"
                    : "bg-white border-slate-200 text-slate-700"
                }`}
              >
                <span>{cat}:</span>
                <span className={isHighest ? "text-white" : "text-blue-600 font-extrabold"}>{count}</span>
                <span className={`text-[9px] ${isHighest ? "text-blue-100" : "text-slate-400"}`}>({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4" id="prayer-requests-list">
        {visibleRequests.map((p) => (
          <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs select-none shrink-0"
                  style={{ backgroundColor: avatarBg(p.member) }}
                >
                  {initials(p.member)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span>{p.member}</span>
                    {p.private && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-red-50 text-red-600 text-[8px] font-extrabold uppercase rounded">
                        <Lock size={8} /> Private
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-700">
                  {p.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  p.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>

            <p className="text-slate-650 text-xs md:text-sm mt-3.5 leading-relaxed whitespace-pre-wrap">
              {p.request}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onIncrementPrayers(p.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Heart size={12} className="fill-red-600 text-red-600" />
                    <span>Pray ({p.prayers})</span>
                  </button>
                  {p.status === "active" && canManage && (
                    <button
                      onClick={() => onMarkAnswered(p.id)}
                      className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm shadow-slate-100"
                    >
                      <CheckCircle size={12} className="text-emerald-500" />
                      <span>Mark Answered</span>
                    </button>
                  )}
                </div>
              </div>
              
              {p.likedBy && p.likedBy.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-500 font-semibold bg-slate-50 rounded-lg p-2 flex items-center gap-1.5">
                  <span className="text-slate-400">🙏 Praying with this:</span>
                  <span className="text-slate-700 italic">{Array.from(new Set(p.likedBy.map((l) => l.userName))).join(", ")}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {visibleRequests.length === 0 && (
          <div className="bg-slate-50 border border-dashed border-slate-250 p-8 rounded-xl text-center text-slate-450 italic font-medium">
            No active prayer requests found.
          </div>
        )}
      </div>

      {/* Add Request Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="add-prayer-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Submit Prayer Request</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Request Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PrayerRequest["category"])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                >
                  <option value="Personal">Personal</option>
                  <option value="Health">Health</option>
                  <option value="Family">Family</option>
                  <option value="Work">Work</option>
                  <option value="Finance">Finance</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Your Request *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share your request with the congregation or privately..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="private-prayer-checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="private-prayer-checkbox" className="text-slate-700 font-semibold text-xs cursor-pointer select-none">
                  Keep Private (visible only to Pastor & leadership, submitted anonymously)
                </label>
              </div>
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
