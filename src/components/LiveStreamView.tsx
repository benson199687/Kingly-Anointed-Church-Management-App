import React, { useState } from "react";
import { Youtube, Tv, Calendar, ExternalLink, Save, Sparkles } from "lucide-react";
import { User, DatabaseState } from "../types";

interface LiveStreamViewProps {
  user: User;
  state: DatabaseState;
  onToast: (msg: string) => void;
  onRefresh: () => void;
}

export function LiveStreamView({ user, state, onToast, onRefresh }: LiveStreamViewProps) {
  const church = (state.churches || [])[0] || { id: "1", name: "Church Kingly Anointed App", youtubeUrl: "" };
  const [youtubeLink, setYoutubeLink] = useState(church.youtubeUrl || "https://www.youtube.com/watch?v=coU6LAsLgR8");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with incoming props
  React.useEffect(() => {
    if (church.youtubeUrl) {
      setYoutubeLink(church.youtubeUrl);
    }
  }, [church.youtubeUrl]);

  // Poll backend state for real-time updates to the live stream
  React.useEffect(() => {
    const timer = setInterval(() => {
      onRefresh();
    }, 3000);
    return () => clearInterval(timer);
  }, [onRefresh]);

  // Parse Youtube Video ID for embedded playback
  const getEmbedId = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    } catch (e) {
      return null;
    }
  };

  const videoId = getEmbedId(youtubeLink);

  const handleSaveLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeLink.trim()) {
      onToast("YouTube URL cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/churches/${church.id || "1"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeLink })
      });
      const data = await res.json();
      if (data.success) {
        onToast("YouTube Live Stream Link updated successfully!");
        onRefresh();
      } else {
        onToast("Failed to save stream link.");
      }
    } catch (err) {
      onToast("Network Error: Could not update stream link.");
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = user.role === "pastor" && user.pastorType === "main";

  return (
    <div className="space-y-6 animate-in fade-in duration-200" id="live-service-portal">
      <div>
        <h2 className="text-xl font-bold text-slate-850 font-sans tracking-tight">GracePortal Live Sanctuary</h2>
        <p className="text-slate-500 text-xs mt-1">Connect with the local community virtually and participate in weekly services</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Watch Card */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Active Service Broadcast</h3>
            </div>
            <span className="text-[10px] font-extrabold uppercase bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full tracking-wider">
              ONLINE
            </span>
          </div>

          {/* YouTube Video Link/Embed Container */}
          {videoId ? (
            <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-950 aspect-video shadow-md">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Church Live Stream"
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-250 p-8 rounded-xl text-center space-y-3">
              <Tv className="mx-auto text-slate-400" size={32} />
              <p className="text-slate-650 font-bold text-xs">No active video stream player</p>
              <p className="text-slate-400 text-[11px]">The live YouTube streaming link is loaded below. You can open it directly in a new tab.</p>
            </div>
          )}

          {/* Direct Youtube Navigation Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <Youtube size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">Official Church YouTube Broadcast Link</p>
                <p className="text-[11px] text-slate-500 truncate max-w-xs md:max-w-md">{youtubeLink}</p>
              </div>
            </div>
            
            <a
              href={youtubeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <span>Watch on YouTube</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Right Sidebar: Service Schedule or Link Setter */}
        <div className="lg:col-span-4 space-y-6">
          {/* Admin link setter */}
          {canEdit && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-150 pb-2">
                <Sparkles size={16} className="text-amber-500" />
                <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider">Broadcast Settings</h4>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                As a designated church leader, you have privileges to update the broadcast URL shown to all members.
              </p>
              <form onSubmit={handleSaveLink} className="space-y-3">
                <div>
                  <label className="block text-slate-750 font-bold text-[10px] uppercase mb-1">YouTube Live Stream Link</label>
                  <input
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeLink}
                    onChange={(e) => setYoutubeLink(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-red-500 font-semibold text-slate-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors inline-flex items-center justify-center gap-1"
                >
                  <Save size={13} />
                  <span>{isSaving ? "Updating Link..." : "Update Live Link"}</span>
                </button>
              </form>
            </div>
          )}

          {/* Schedule Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-850 text-xs uppercase tracking-wider border-b border-slate-100 pb-2">Weekly Live Schedule</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-xs">
                <Calendar size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Sunday Main Assembly</p>
                  <p className="text-slate-500 text-[11px]">Sundays: 09:00 AM - 11:30 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <Calendar size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Midweek Interactive Study</p>
                  <p className="text-slate-500 text-[11px]">Wednesdays: 06:00 PM - 07:30 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs">
                <Calendar size={14} className="text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-800">Youth Fellowship Hour</p>
                  <p className="text-slate-500 text-[11px]">Fridays: 05:00 PM - 06:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
