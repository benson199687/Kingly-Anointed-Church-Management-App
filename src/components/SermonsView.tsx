import React, { useState } from "react";
import { Video, BookOpen, Eye, Plus, Sparkles, Loader2, ArrowLeft, Share, Edit3, Save, ExternalLink, Trash2, Download, CheckCircle, Image } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { User, DatabaseState, Sermon } from "../types";

export const DEFAULT_SERMON_THUMBNAIL = "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=60";

export const DEFAULT_PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=600&auto=format&fit=crop&q=60", // Bible
  "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60", // Worship
  "https://images.unsplash.com/photo-1438263308737-6e5a7a1a157e?w=600&auto=format&fit=crop&q=60", // Sunrise
  "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=60", // Sanctuary
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=600&auto=format&fit=crop&q=60", // Peaceful sky
  "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=60", // Forest light
  "https://images.unsplash.com/photo-1447069387593-a5de0862481e?w=600&auto=format&fit=crop&q=60", // Old book
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&auto=format&fit=crop&q=60"  // Mountain top
];

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  return null;
}

export function getYouTubeThumbnail(url?: string): string | null {
  const id = getYouTubeVideoId(url);
  if (id) {
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  }
  return null;
}

export function getDeterministicDefaultImage(title: string, category?: string): string {
  const t = title || "Grace Community Assembly Sermon";
  let hash = 0;
  for (let i = 0; i < t.length; i++) {
    hash = t.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DEFAULT_PRESET_IMAGES.length;
  return DEFAULT_PRESET_IMAGES[index];
}

interface SermonsViewProps {
  user: User;
  state: DatabaseState;
  onAddSermon: (sermon: Partial<Sermon>) => void;
  onToast: (msg: string) => void;
  onRefreshData: () => void;
  activeSermonId?: string | null;
  setActiveSermonId?: (id: string | null) => void;
}

export function SermonsView({ user, state, onAddSermon, onToast, onRefreshData, activeSermonId, setActiveSermonId }: SermonsViewProps) {
  const [activeSermon, setActiveSermon] = useState<Sermon | null>(null);

  React.useEffect(() => {
    if (activeSermonId) {
      const found = state.sermons?.find((s) => String(s.id) === String(activeSermonId));
      if (found) {
        setActiveSermon(found);
      }
    }
  }, [activeSermonId, state.sermons]);

  const handleBack = () => {
    setActiveSermon(null);
    if (setActiveSermonId) {
      setActiveSermonId(null);
    }
  };

  const handleDeleteSermon = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this sermon and its associated outlines?")) {
      return;
    }
    try {
      const res = await fetch(`/api/sermons/${id}?role=${user.role}&userName=${encodeURIComponent(user.name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        if (data.pendingApproval) {
          onToast("Deletion request has been submitted to Lead Pastor for certification.");
        } else {
          onToast("Sermon deleted successfully!");
          setActiveSermon(null);
        }
        onRefreshData();
      } else {
        onToast("Failed to delete sermon.");
      }
    } catch (err) {
      onToast("Error deleting sermon.");
    }
  };
  
  // Normal add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSpeaker, setNewSpeaker] = useState(user.name || "Pastor Benson");
  const [newDuration, setNewDuration] = useState("40 min");
  const [newCategory, setNewCategory] = useState("Faith");
  const [newScripture, setNewScripture] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newHasCustomThumbnail, setNewHasCustomThumbnail] = useState(false);

  // Edit form states for active sermon
  const [isEditingSermon, setIsEditingSermon] = useState(false);
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editHasCustomThumbnail, setEditHasCustomThumbnail] = useState(false);
  const [isSavingSermon, setIsSavingSermon] = useState(false);

  // AI draft states
  const [showAiDraft, setShowAiDraft] = useState(false);
  const [aiTitle, setAiTitle] = useState("");
  const [aiScripture, setAiScripture] = useState("");
  const [aiTopic, setAiTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Sharing states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTargetType, setShareTargetType] = useState<"member" | "group">("member");
  const [shareTargetId, setShareTargetId] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const isLeadPastor = user.role === "pastor" && user.pastorType === "main";
  const isPastor = ["pastor", "admin"].includes(user.role);
  const canManageSermons = ["pastor", "admin"].includes(user.role);

  const handleDownloadSermon = (sermon: Sermon) => {
    const filename = `${sermon.title.replace(/[^a-z0-9]/gi, "_")}_study_outline.txt`;
    const outlineContent = (sermon as any).content || `Introduction
Welcome, congregation! Today we gather to meditate deeply on God's word found in ${sermon.scripture}. Let us open our hearts to the message of ${sermon.title}.

Part 1: The Biblical Foundation
This scripture details a central covenant in our Christian journey. We must look at the historical context of ${sermon.scripture} and apply its core lessons to our contemporary daily lives.

Part 2: Personal Application & Illustration
How do we walk out this faith in Kitwe, Lusaka, or wherever God has placed us? It requires action, daily spiritual disciplines, and submission to the Holy Spirit.

Conclusion & Final Blessing
May you depart today with renewed hope, carrying the light of this text with you throughout the week. Praise be to God!`;

    const fullText = `=========================================
SERMON STUDY OUTLINE & DISCIPLINE MATERIAL
=========================================
Title: ${sermon.title}
Speaker: ${sermon.speaker}
Date: ${sermon.date}
Scripture: ${sermon.scripture}
Duration: ${sermon.duration}
Category: ${sermon.category}
=========================================

POST-SERVICE PASTORAL NOTES:
----------------------------
${sermon.notes || "No additional pastoral notes submitted yet."}

=========================================
STUDY CONTENT & LESSONS:
----------------------------
${outlineContent}

=========================================
Generated via Grace Community Assembly Portal.
Blessed is the one who reads aloud the words of this prophecy, and blessed are those who hear...
=========================================`;

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast("Study outline downloaded successfully!");
  };

  const handleShareSermon = async () => {
    if (!shareTargetId) {
      onToast("Please select a target member or group.");
      return;
    }
    setIsSharing(true);
    try {
      const endpoint = shareTargetType === "group" 
        ? `/api/sermons/${activeSermon?.id}/share-group`
        : `/api/sermons/${activeSermon?.id}/share-member`;

      const payload = shareTargetType === "group"
        ? { groupId: shareTargetId, fromUser: user.name }
        : { toUser: shareTargetId, fromUser: user.name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onToast(`Sermon successfully shared with ${shareTargetType === "group" ? "the group" : shareTargetId}!`);
        setShowShareModal(false);
        setShareTargetId("");
      } else {
        onToast(data.message || "Failed to share sermon.");
      }
    } catch (err) {
      onToast("Error connecting to server.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleNormalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newScripture) {
      onToast("Title and Scripture reference are required");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const isApprovedRole = ["pastor", "admin"].includes(user.role);
    const sermonStatus = isApprovedRole ? "approved" : "pending";

    let finalImageUrl = "";
    let finalHasCustomThumbnail = false;

    if (newImageUrl && newImageUrl.trim() !== "") {
      finalImageUrl = newImageUrl.trim();
      finalHasCustomThumbnail = true;
    } else {
      const ytThumb = getYouTubeThumbnail(newVideoUrl);
      if (ytThumb) {
        finalImageUrl = ytThumb;
        finalHasCustomThumbnail = false;
      } else {
        finalImageUrl = getDeterministicDefaultImage(newTitle, newCategory);
        finalHasCustomThumbnail = false;
      }
    }

    onAddSermon({
      title: newTitle,
      speaker: newSpeaker,
      date: today,
      duration: newDuration,
      category: newCategory,
      scripture: newScripture,
      videoUrl: newVideoUrl || undefined,
      notes: newNotes || undefined,
      imageUrl: finalImageUrl,
      hasCustomThumbnail: finalHasCustomThumbnail,
      status: sermonStatus,
    });
    setNewTitle("");
    setNewScripture("");
    setNewVideoUrl("");
    setNewNotes("");
    setNewImageUrl("");
    setNewHasCustomThumbnail(false);
    setShowAddForm(false);
  };

  const handleUpdateSermon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSermon) return;
    setIsSavingSermon(true);

    let finalImageUrl = editImageUrl;
    let finalHasCustomThumbnail = editHasCustomThumbnail;

    if (!finalHasCustomThumbnail) {
      const ytThumb = getYouTubeThumbnail(editVideoUrl);
      if (ytThumb) {
        finalImageUrl = ytThumb;
      } else {
        finalImageUrl = getDeterministicDefaultImage(activeSermon.title, activeSermon.category);
      }
    }

    try {
      const res = await fetch(`/api/sermons/${activeSermon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoUrl: editVideoUrl,
          notes: editNotes,
          imageUrl: finalImageUrl,
          hasCustomThumbnail: finalHasCustomThumbnail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onToast("Sermon details updated successfully!");
        setActiveSermon(data.sermon);
        setIsEditingSermon(false);
        onRefreshData();
      } else {
        onToast(data.message || "Failed to update sermon.");
      }
    } catch (err) {
      onToast("Error saving changes.");
    } finally {
      setIsSavingSermon(false);
    }
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  const handleAiDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle || !aiScripture || !aiTopic) {
      onToast("All inputs are required for AI generation.");
      return;
    }

    setIsGenerating(true);
    onToast("Initializing Gemini 3.5 Flash to generate sermon & quiz...");

    const isApprovedRole = ["pastor", "admin"].includes(user.role);
    const sermonStatus = isApprovedRole ? "approved" : "pending";

    try {
      const response = await fetch("/api/gemini/generate-sermon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: aiTitle,
          scripture: aiScripture,
          topic: aiTopic,
          speaker: user.name || "Pastor Benson",
          status: sermonStatus
        })
      });

      const data = await response.json();
      if (data.success) {
        onToast("Sermon drafted and weekly Bible quiz generated successfully!");
        onRefreshData(); // Refresh list to fetch newly persisted data
        
        // Open the newly generated sermon
        setActiveSermon(data.sermon);
        
        // Reset
        setAiTitle("");
        setAiScripture("");
        setAiTopic("");
        setShowAiDraft(false);
      } else {
        onToast(data.message || "Failed to generate sermon.");
      }
    } catch (err) {
      console.error(err);
      onToast("API error: Failed to connect to sermon generator.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (activeSermon) {
    return (
      <div className="space-y-6" id="sermon-detail-viewer">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Sermon Library</span>
        </button>

        {activeSermon.status === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
            <div className="space-y-1">
              <p className="font-bold text-amber-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Sermon Awaiting Pastoral Approval</span>
              </p>
              <p className="text-slate-600 text-xs">
                This sermon draft was uploaded by Elder <strong>{activeSermon.speaker}</strong> and is pending approval before appearing in the public congregation library.
              </p>
            </div>
            {["pastor", "admin"].includes(user.role) && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/sermons/${activeSermon.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "approved", approvedBy: user.name })
                    });
                    const data = await res.json();
                    if (data.success) {
                      onToast("Sermon successfully approved and published!");
                      setActiveSermon(data.sermon);
                      onRefreshData();
                    } else {
                      onToast("Failed to approve sermon.");
                    }
                  } catch (err) {
                    onToast("Error approving sermon.");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-center cursor-pointer transition-colors"
              >
                <CheckCircle size={14} />
                <span>Approve & Publish</span>
              </button>
            )}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 uppercase mb-2">
                {activeSermon.category}
              </span>
              <h2 className="text-xl font-bold text-slate-800">{activeSermon.title}</h2>
              <p className="text-slate-500 text-xs mt-1.5 font-medium">
                Sermon by {activeSermon.speaker} · {new Date(activeSermon.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="text-right flex flex-col items-start md:items-end gap-1 shrink-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <BookOpen size={14} className="text-blue-600" />
                <span>Scripture: {activeSermon.scripture}</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 mt-1">
                Duration: {activeSermon.duration} · {activeSermon.views} views
              </span>
              <div className="flex flex-wrap gap-2 mt-2 justify-start md:justify-end">
                <button
                  onClick={() => handleDownloadSermon(activeSermon)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                  id="btn-download-sermon"
                >
                  <Download size={11} />
                  <span>Download Outline</span>
                </button>

                {canManageSermons && (
                  <>
                    <button
                      onClick={() => {
                        setShareTargetId("");
                        setShowShareModal(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      id="btn-share-sermon"
                    >
                      <Share size={11} />
                      <span>Share Sermon</span>
                    </button>
                    <button
                      onClick={() => {
                        setEditVideoUrl(activeSermon.videoUrl || "");
                        setEditNotes(activeSermon.notes || "");
                        setEditImageUrl(activeSermon.imageUrl || "");
                        setEditHasCustomThumbnail((activeSermon as any).hasCustomThumbnail || false);
                        setIsEditingSermon(!isEditingSermon);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      id="btn-edit-sermon"
                    >
                      <Edit3 size={11} />
                      <span>{isEditingSermon ? "Cancel Edit" : "Edit Notes & Video"}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSermon(activeSermon.id)}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] inline-flex items-center gap-1 transition-all shadow-xs cursor-pointer"
                      id="btn-delete-sermon"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Edit Notes & Video Form */}
          {isEditingSermon ? (
            <form onSubmit={handleUpdateSermon} className="space-y-4 bg-slate-50 border border-slate-150 rounded-xl p-5 text-xs animate-in slide-in-from-top-4 duration-200">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Edit3 size={16} className="text-blue-600" />
                <span>Submit Service Materials (After-Service Notes & Video Links)</span>
              </h3>
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">YouTube Video Link</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={editVideoUrl}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setEditVideoUrl(newUrl);
                    if (!editHasCustomThumbnail) {
                      const ytThumb = getYouTubeThumbnail(newUrl);
                      if (ytThumb) {
                        setEditImageUrl(ytThumb);
                      } else {
                        setEditImageUrl(getDeterministicDefaultImage(activeSermon.title, activeSermon.category));
                      }
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500"
                />
                <p className="text-slate-400 text-[10px] mt-1">Upload YouTube video links for recording / streaming. Updates thumbnail automatically unless a custom thumbnail is selected.</p>
              </div>

              {/* Thumbnail Management Section */}
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3.5">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Image size={14} className="text-blue-600" />
                  <span>Sermon Thumbnail Management</span>
                </h4>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Thumbnail Preview */}
                  <div className="w-full sm:w-32 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0 relative">
                    {editImageUrl ? (
                      <img 
                        src={editImageUrl} 
                        alt="Thumbnail preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-[10px]">
                        No Image
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white font-extrabold px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider">
                      {editHasCustomThumbnail ? "Custom" : "Auto"}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="flex-1 space-y-2 w-full">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Custom Thumbnail Image URL</label>
                      <input
                        type="url"
                        placeholder="Paste any custom picture URL..."
                        value={editHasCustomThumbnail ? editImageUrl : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.trim() === "") {
                            setEditHasCustomThumbnail(false);
                            const ytThumb = getYouTubeThumbnail(editVideoUrl);
                            setEditImageUrl(ytThumb || getDeterministicDefaultImage(activeSermon.title, activeSermon.category));
                          } else {
                            setEditImageUrl(val);
                            setEditHasCustomThumbnail(true);
                          }
                        }}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 outline-none font-semibold focus:border-blue-500 font-mono"
                      />
                    </div>

                    {/* Presets Grid */}
                    <div>
                      <span className="block text-slate-500 text-[10px] font-bold mb-1">Or choose a loving church preset:</span>
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                        {DEFAULT_PRESET_IMAGES.map((url, idx) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => {
                              setEditImageUrl(url);
                              setEditHasCustomThumbnail(true);
                            }}
                            className={`h-8 rounded overflow-hidden border-2 transition-all relative cursor-pointer ${
                              editImageUrl === url && editHasCustomThumbnail ? "border-blue-600 ring-1 ring-blue-500/10" : "border-transparent hover:border-slate-300"
                            }`}
                          >
                            <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const ytThumb = getYouTubeThumbnail(editVideoUrl);
                          if (ytThumb) {
                            setEditImageUrl(ytThumb);
                            setEditHasCustomThumbnail(false);
                            onToast("Reverted to YouTube thumbnail!");
                          } else {
                            onToast("Please provide a valid YouTube video link first to use its thumbnail.");
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                      >
                        Use YouTube Thumbnail
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultImg = getDeterministicDefaultImage(activeSermon.title, activeSermon.category);
                          setEditImageUrl(defaultImg);
                          setEditHasCustomThumbnail(false);
                          onToast("Reverted to sermon deterministic default!");
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded text-[10px] transition-colors cursor-pointer"
                      >
                        Remove Custom (Use Default)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Pastor's Service Notes / Reflections</label>
                <textarea
                  rows={6}
                  placeholder="Type or paste the pastor's notes or scripture reflections submitted after the service..."
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold focus:border-blue-500 font-sans"
                />
                <p className="text-slate-400 text-[10px] mt-1">Notes will display alongside scripture reflections for the congregation.</p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsEditingSermon(false)}
                  className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSermon}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{isSavingSermon ? "Saving..." : "Save Materials"}</span>
                </button>
              </div>
            </form>
          ) : null}

          {/* Sermon Cover Image */}
          <div className="w-full max-w-2xl mx-auto h-64 rounded-xl overflow-hidden shadow-sm border border-slate-150 relative animate-in fade-in">
            <img 
              src={activeSermon.imageUrl || getDeterministicDefaultImage(activeSermon.title, activeSermon.category)} 
              alt={activeSermon.title} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* YouTube Video Section */}
          {activeSermon.videoUrl && (
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md aspect-video max-w-2xl mx-auto border border-slate-800 animate-in fade-in">
              {getYouTubeEmbedUrl(activeSermon.videoUrl) ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={getYouTubeEmbedUrl(activeSermon.videoUrl)!}
                  title={activeSermon.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              ) : (
                <div className="p-8 text-center text-white space-y-4">
                  <Video size={48} className="mx-auto text-red-500 animate-pulse" />
                  <div>
                    <h4 className="font-bold text-sm">YouTube Live Recording Link Ready</h4>
                    <p className="text-xs text-slate-400 mt-1">This sermon recording link is available outside of direct embedding.</p>
                  </div>
                  <a
                    href={activeSermon.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    <span>Watch Recording on YouTube</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Pastor's Notes Section */}
          {activeSermon.notes && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 md:p-6 space-y-3 animate-in fade-in">
              <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2 border-b border-amber-100 pb-2.5">
                <span>✍️</span>
                <span>Pastor's Post-Service Notes</span>
              </h3>
              <p className="text-amber-900 font-sans leading-relaxed text-sm whitespace-pre-wrap">
                {activeSermon.notes}
              </p>
            </div>
          )}

          <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm space-y-4" id="sermon-outline-content">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2.5">Sermon Outline & Study Material</h3>
            {/* If content exists, render markdown, else fallback to standard default outline */}
            {(activeSermon as any).content ? (
              <ReactMarkdown>{(activeSermon as any).content}</ReactMarkdown>
            ) : (
              <div className="space-y-4">
                <p className="font-semibold text-slate-800">Introduction</p>
                <p>Welcome, congregation! Today we gather to meditate deeply on God's word found in {activeSermon.scripture}. Let us open our hearts to the message of {activeSermon.title}.</p>
                
                <p className="font-semibold text-slate-800">Part 1: The Biblical Foundation</p>
                <p>This scripture details a central covenant in our Christian journey. We must look at the historical context of {activeSermon.scripture} and apply its core lessons to our contemporary daily lives.</p>
                
                <p className="font-semibold text-slate-800">Part 2: Personal Application & Illustration</p>
                <p>How do we walk out this faith in Kitwe, Lusaka, or wherever God has placed us? It requires action, daily spiritual disciplines, and submission to the Holy Spirit.</p>
                
                <p className="font-semibold text-slate-800">Conclusion & Final Blessing</p>
                <p>May you depart today with renewed hope, carrying the light of this text with you throughout the week. Praise be to God!</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl max-w-sm w-full shadow-xl overflow-hidden text-xs">
              <div className="p-4 border-b border-slate-150 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">Share Sermon with Flock</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Where do you want to share?</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={shareTargetType === "member"}
                        onChange={() => {
                          setShareTargetType("member");
                          setShareTargetId("");
                        }}
                      />
                      <span>Direct Inbox</span>
                    </label>
                    <label className="flex items-center gap-1.5 font-semibold cursor-pointer">
                      <input
                        type="radio"
                        checked={shareTargetType === "group"}
                        onChange={() => {
                          setShareTargetType("group");
                          setShareTargetId("");
                        }}
                      />
                      <span>Connection Group</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">
                    {shareTargetType === "group" ? "Select Connection Group" : "Select Church Member"}
                  </label>
                  <select
                    value={shareTargetId}
                    onChange={(e) => setShareTargetId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none font-semibold cursor-pointer"
                  >
                    <option value="">-- Choose target --</option>
                    {shareTargetType === "group" ? (
                      (state.groups || []).map((g) => (
                        <option key={g.id} value={g.id}>{g.name} (Shepherd: {g.leader})</option>
                      ))
                    ) : (
                      // Exclude current user from list
                      (state.members || []).filter((m: any) => m.name !== user.name).map((m: any) => (
                        <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="bg-white border border-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleShareSermon}
                    disabled={isSharing}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                  >
                    {isSharing ? "Sharing..." : "Share Now"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6" id="sermons-library-container">
      {/* AI Assistant Callout for Pastors */}
      {isLeadPastor && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-lg space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase">
              <Sparkles size={11} className="text-amber-300 fill-amber-300" />
              <span>Ministry Intelligence</span>
            </div>
            <h3 className="text-lg font-bold leading-tight">Draft Sermon Outlines & Quizzes Instantly</h3>
            <p className="text-white/80 text-xs leading-relaxed font-medium">
              Specify your scripture target and topic. Gemini will generate a structured theological sermon outline and a corresponding 5-question interactive Bible quiz for the weekly study.
            </p>
            <button
              onClick={() => setShowAiDraft(true)}
              className="inline-flex items-center gap-1.5 bg-white text-blue-700 hover:bg-blue-50 font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              id="ai-sermon-trigger"
            >
              <Sparkles size={14} className="text-blue-600" />
              <span>Launch AI Sermon Assistant</span>
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>
      )}

      {/* Title Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Sermon Outlines & Materials</h2>
          <p className="text-slate-500 text-xs mt-1">Study outlined lessons and prepare for Sunday school</p>
        </div>
        {canManageSermons && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            id="add-sermon-trigger"
          >
            <Plus size={16} />
            <span>Upload Outline</span>
          </button>
        )}
      </div>

      {/* Sermon Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="sermons-card-grid">
        {(state.sermons || [])
          .filter((s) => {
            const status = s.status || "approved";
            if (status === "approved") return true;
            if (["pastor", "admin", "elder"].includes(user.role)) return true;
            return false;
          })
          .map((s) => (
          <div
            key={s.id}
            onClick={() => setActiveSermon(s)}
            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-full h-36 rounded-lg mb-4 overflow-hidden relative bg-slate-100 flex items-center justify-center">
                <img 
                  src={s.imageUrl || getDeterministicDefaultImage(s.title, s.category)} 
                  alt={s.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                />
                {s.status === "pending" && (
                  <span className="absolute top-2 left-2 bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider animate-pulse shadow-sm">
                    ⚠️ Pending Approval
                  </span>
                )}
                <span className="absolute bottom-2.5 right-2.5 bg-slate-900/70 text-white font-semibold px-2 py-0.5 rounded text-[10px]">
                  {s.duration}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-base group-hover:text-blue-700 transition-colors leading-tight">
                {s.title}
              </h3>
              <p className="text-slate-500 text-xs mt-1 font-medium">
                {s.speaker} · {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="border-t border-slate-100 mt-4 pt-3 flex items-center justify-between">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                {s.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                <BookOpen size={12} className="text-blue-500" />
                <span className="truncate max-w-[120px]">{s.scripture}</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Eye size={12} /> {s.views} views
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Standard Upload Outline Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="add-sermon-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Upload Sermon Outline</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleNormalSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Sermon Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Walking in Abundance"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Speaker</label>
                  <input
                    type="text"
                    value={newSpeaker}
                    onChange={(e) => setNewSpeaker(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Expected Length</label>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Scripture Reference *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John 3:16-17"
                    value={newScripture}
                    onChange={(e) => setNewScripture(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="Faith">Faith</option>
                    <option value="Prayer">Prayer</option>
                    <option value="Love">Love</option>
                    <option value="Peace">Peace</option>
                    <option value="Giving">Giving</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">YouTube Video URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Sermon Cover Picture *</label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[
                    {
                      name: "Bible",
                      url: "https://images.unsplash.com/photo-1504051771394-dd2e66b2e08f?w=600&auto=format&fit=crop&q=60"
                    },
                    {
                      name: "Worship",
                      url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60"
                    },
                    {
                      name: "Sunrise",
                      url: "https://images.unsplash.com/photo-1438263308737-6e5a7a1a157e?w=600&auto=format&fit=crop&q=60"
                    },
                    {
                      name: "Sanctuary",
                      url: "https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=600&auto=format&fit=crop&q=60"
                    }
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setNewImageUrl(preset.url);
                        setNewHasCustomThumbnail(true);
                      }}
                      className={`h-12 rounded-lg overflow-hidden border-2 transition-all relative group cursor-pointer ${
                        newImageUrl === preset.url && newHasCustomThumbnail ? "border-blue-600 ring-2 ring-blue-500/10" : "border-transparent hover:border-slate-300"
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] text-white font-bold">{preset.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Or paste a custom picture URL..."
                    value={newHasCustomThumbnail ? newImageUrl : ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.trim() === "") {
                        setNewImageUrl("");
                        setNewHasCustomThumbnail(false);
                      } else {
                        setNewImageUrl(val);
                        setNewHasCustomThumbnail(true);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 font-mono"
                  />
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>
                      {!newHasCustomThumbnail ? (
                        <span className="text-blue-600 font-semibold">✨ Auto-Thumbnail Active (YouTube / unique church photo)</span>
                      ) : (
                        <span className="text-amber-600 font-semibold">🔒 Custom Thumbnail Lock Active</span>
                      )}
                    </span>
                    {newHasCustomThumbnail && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewImageUrl("");
                          setNewHasCustomThumbnail(false);
                        }}
                        className="text-slate-400 hover:text-rose-600 font-bold underline transition-colors cursor-pointer"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Sermon Notes / Scripture Insights (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Paste initial post-service reflections or sermon notes..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 font-sans"
                />
              </div>
              {!["pastor", "admin"].includes(user.role) && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-800 leading-normal font-semibold">
                  ⚠️ <strong>Notice:</strong> As an Elder, this sermon outline and picture will be submitted to <strong>Pastor Benson</strong> for review and spiritual approval before publication.
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-white border border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
                >
                  Create Outline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Sermon Generator Modal */}
      {showAiDraft && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="ai-sermon-modal">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 fill-indigo-200" />
                <h3 className="font-bold text-slate-800">AI Sermon & Study Outline Draft</h3>
              </div>
              <button
                disabled={isGenerating}
                onClick={() => setShowAiDraft(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAiDraftSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Sermon Title *</label>
                <input
                  type="text"
                  required
                  disabled={isGenerating}
                  placeholder="e.g. Navigating storms of life"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Scripture Reference Target *</label>
                <input
                  type="text"
                  required
                  disabled={isGenerating}
                  placeholder="e.g. Mark 4:35-41"
                  value={aiScripture}
                  onChange={(e) => setAiScripture(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Core Topic / Spiritual Themes *</label>
                <textarea
                  required
                  disabled={isGenerating}
                  rows={3}
                  placeholder="e.g. Trusting Jesus in difficult times, overcoming fear, and having active biblical faith."
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>

              {!["pastor", "admin"].includes(user.role) && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-[11px] text-amber-800 leading-normal font-semibold">
                  ⚠️ <strong>Notice:</strong> As an Elder, this AI-generated outline and quiz will be drafted in <strong>pending approval</strong> status and will require Pastor Benson's blessing before release.
                </div>
              )}

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                  <Loader2 size={36} className="text-indigo-600 animate-spin" />
                  <div className="space-y-1">
                    <p className="font-bold text-slate-800 text-xs">Generating sermon outline & study questions...</p>
                    <p className="text-slate-400 text-[10px]">Gemini 3.5 Flash is analyzing scripture context...</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAiDraft(false)}
                    className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Sparkles size={14} className="fill-indigo-300" />
                    <span>Generate Materials</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
