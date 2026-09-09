import React, { useState } from "react";
import { Megaphone, Pin, Plus, Calendar, AlertTriangle, ThumbsUp, MessageCircle, Share2, Send } from "lucide-react";
import { User, DatabaseState, Announcement } from "../types";

interface AnnouncementsViewProps {
  user: User;
  state: DatabaseState;
  onAddAnnouncement: (announcement: Partial<Announcement>) => void;
  onToast: (msg: string) => void;
  onRefresh?: () => void;
}

export function AnnouncementsView({ user, state, onAddAnnouncement, onToast, onRefresh }: AnnouncementsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Announcement["category"]>("General");
  const [content, setContent] = useState("");
  const [expires, setExpires] = useState("");
  const [pinned, setPinned] = useState(false);

  // Social media interaction states
  const [commentingAnnId, setCommentingAnnId] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<{[annId: string]: string}>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<{[annId: string]: boolean}>({});

  const handleLike = async (annId: string) => {
    try {
      const res = await fetch(`/api/announcements/${annId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: user.name })
      });
      const data = await res.json();
      if (data.success) {
        if (onRefresh) onRefresh();
      } else {
        onToast("Could not process like request.");
      }
    } catch (err) {
      console.error(err);
      onToast("Connection issue with reaction service.");
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, annId: string) => {
    e.preventDefault();
    const commentText = (commentTexts[annId] || "").trim();
    if (!commentText) return;

    setIsSubmittingComment(prev => ({ ...prev, [annId]: true }));
    try {
      const res = await fetch(`/api/announcements/${annId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: user.name,
          role: user.role,
          content: commentText
        })
      });
      const data = await res.json();
      if (data.success) {
        setCommentTexts(prev => ({ ...prev, [annId]: "" }));
        onToast("Comment published!");
        if (onRefresh) onRefresh();
      } else {
        onToast("Could not publish comment.");
      }
    } catch (err) {
      console.error(err);
      onToast("Error saving comment.");
    } finally {
      setIsSubmittingComment(prev => ({ ...prev, [annId]: false }));
    }
  };

  const handleShare = async (annId: string) => {
    try {
      const res = await fetch(`/api/announcements/${annId}/share`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        // Mock copy deep-link link
        const shareLink = `${window.location.origin}/#announcements?id=${annId}`;
        await navigator.clipboard.writeText(shareLink);
        onToast("Assembly bulletin link copied! Share it with friends and family.");
        if (onRefresh) onRefresh();
      } else {
        onToast("Could not record share.");
      }
    } catch (err) {
      console.error(err);
      onToast("Error recording share.");
    }
  };

  const canPost = user.role === "pastor" && user.pastorType === "main";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      onToast("Title and Content are required.");
      return;
    }
    onAddAnnouncement({
      title,
      category,
      content,
      expires: expires || null,
      pinned
    });
    setTitle("");
    setCategory("General");
    setContent("");
    setExpires("");
    setPinned(false);
    setShowAddForm(false);
  };

  const getCatColor = (cat: Announcement["category"]) => {
    const map = {
      Urgent: "bg-red-50 text-red-700 border-red-200",
      Events: "bg-blue-50 text-blue-700 border-blue-200",
      Prayer: "bg-amber-50 text-amber-700 border-amber-200",
      Youth: "bg-purple-50 text-purple-700 border-purple-200",
      General: "bg-slate-55 text-slate-700 border-slate-200"
    };
    return map[cat] || map.General;
  };

  return (
    <div className="space-y-6" id="announcements-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Bulletins & Announcements</h2>
          <p className="text-slate-500 text-xs mt-1">Stay updated with the latest assembly plans and church news</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            id="post-bulletin-trigger"
          >
            <Plus size={16} />
            <span>Post Bulletin</span>
          </button>
        )}
      </div>

      <div className="space-y-4" id="announcements-list">
        {(state.announcements || []).map((a) => (
          <div
            key={a.id}
            className={`bg-white border rounded-xl p-5 shadow-sm transition-all duration-150 relative ${
              a.pinned ? "border-l-4 border-l-blue-500 border-slate-200" : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-500 text-white uppercase tracking-wider">
                    <Pin size={10} className="fill-white" />
                    <span>Pinned</span>
                  </span>
                )}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getCatColor(a.category)}`}>
                  {a.category}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            </div>

            <h3 className="font-bold text-slate-800 text-base mt-3 leading-snug">{a.title}</h3>
            <p className="text-slate-650 text-xs md:text-sm mt-2.5 leading-relaxed whitespace-pre-wrap">{a.content}</p>

            {a.expires && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Calendar size={11} />
                <span>Expires on: {new Date(a.expires).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
            )}

            {/* Social Interaction Buttons */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs font-semibold">
              <div className="flex items-center gap-4">
                {/* Like Button */}
                <button
                  onClick={() => handleLike(a.id)}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer ${
                    a.likes?.includes(user.name) ? "text-blue-600 bg-blue-50/50" : ""
                  }`}
                >
                  <ThumbsUp size={14} className={a.likes?.includes(user.name) ? "fill-blue-600 text-blue-600" : ""} />
                  <span>{a.likes?.length || 0} Likes</span>
                </button>

                {/* Comment Toggle Button */}
                <button
                  onClick={() => setCommentingAnnId(commentingAnnId === a.id ? null : a.id)}
                  className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 transition-all cursor-pointer ${
                    commentingAnnId === a.id ? "text-slate-800 bg-slate-100/70" : ""
                  }`}
                >
                  <MessageCircle size={14} />
                  <span>{a.comments?.length || 0} Comments</span>
                </button>
              </div>

              {/* Share Button */}
              <button
                onClick={() => handleShare(a.id)}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              >
                <Share2 size={14} />
                <span>{a.sharesCount || 0} Shares</span>
              </button>
            </div>

            {/* Comments Thread Section */}
            {commentingAnnId === a.id && (
              <div className="mt-4 pt-4 border-t border-slate-150 space-y-3">
                {/* Comments List */}
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {(a.comments || []).map((comment) => (
                    <div key={comment.id} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">{comment.author}</span>
                          <span className="px-1 py-0.2 bg-slate-200/60 text-slate-500 text-[8px] rounded uppercase font-bold scale-90">
                            {comment.role}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-450 font-mono">
                          {new Date(comment.date).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                  {(a.comments || []).length === 0 && (
                    <p className="text-center py-2 text-slate-400 italic text-[11px]">
                      Be the first to comment on this bulletin notice!
                    </p>
                  )}
                </div>

                {/* Add Comment Input Form */}
                <form
                  onSubmit={(e) => handleCommentSubmit(e, a.id)}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    required
                    placeholder="Write a comment..."
                    value={commentTexts[a.id] || ""}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [a.id]: e.target.value }))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment[a.id] || !(commentTexts[a.id] || "").trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-1.5 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Announcement Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="add-announcement-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Publish Assembly Bulletin</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Bulletin Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Youth Camp registration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Announcement["category"])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="General">General</option>
                    <option value="Events">Events</option>
                    <option value="Prayer">Prayer</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Youth">Youth</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Expiration date</label>
                  <input
                    type="date"
                    value={expires}
                    onChange={(e) => setExpires(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Bulletin Content *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Draft your bulletin announcement here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="pin-bulletin-checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pin-bulletin-checkbox" className="text-slate-700 font-semibold text-xs cursor-pointer select-none">
                  Pin this bulletin to the top
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
                  Post Bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
