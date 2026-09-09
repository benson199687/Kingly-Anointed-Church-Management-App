import React, { useState } from "react";
import { Calendar, Clock, MapPin, Plus, Check } from "lucide-react";
import { User, DatabaseState, Event } from "../types";

interface EventsViewProps {
  user: User;
  state: DatabaseState;
  onAddEvent: (event: Partial<Event>) => void;
  onRsvpEvent: (id: string) => void;
  onToast: (msg: string) => void;
}

export function EventsView({ user, state, onAddEvent, onRsvpEvent, onToast }: EventsViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("Main Sanctuary");
  const [type, setType] = useState<Event["type"]>("service");
  const [capacity, setCapacity] = useState(300);

  const canAdd = ["pastor", "admin", "elder"].includes(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
      onToast("Title, Date, and Time are required.");
      return;
    }
    onAddEvent({
      title,
      date,
      time,
      location,
      type,
      capacity: Number(capacity)
    });
    setTitle("");
    setDate("");
    setTime("");
    setLocation("Main Sanctuary");
    setType("service");
    setCapacity(300);
    setShowAddForm(false);
  };

  const getTypeColor = (t: Event["type"]) => {
    const map = {
      service: "#3b82f6",
      youth: "#8b5cf6",
      study: "#10b981",
      prayer: "#f59e0b",
      outreach: "#ef4444"
    };
    return map[t] || "#3b82f6";
  };

  return (
    <div className="space-y-6" id="events-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-850">Events & Congregational Calendars</h2>
          <p className="text-slate-500 text-xs mt-1">RSVP to active Bible study groups, fellowships, and outreach ministries</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            id="add-event-trigger"
          >
            <Plus size={16} />
            <span>Schedule Event</span>
          </button>
        )}
      </div>

      <div className="space-y-4" id="events-list">
        {(state.events || []).map((e) => {
          const rsvpPercent = Math.round(((e.attendees || 0) / (e.capacity || 300)) * 100);
          const col = getTypeColor(e.type);
          return (
            <div
              key={e.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-5 items-start md:items-center justify-between"
            >
              <div className="flex gap-4 items-center">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${col}1a`, color: col }}
                >
                  <Calendar size={22} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-base">{e.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-slate-400" />
                      <span>{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {e.time}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{e.location}</span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${rsvpPercent}%`, backgroundColor: col }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {e.attendees}/{e.capacity} Registered
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-none pt-4 md:pt-0 gap-3 shrink-0">
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `${col}15`, color: col }}
                >
                  {e.type}
                </span>
                <button
                  onClick={() => onRsvpEvent(e.id)}
                  disabled={e.attendees >= e.capacity}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-1.5 rounded-lg text-xs transition-colors shadow-sm inline-flex items-center gap-1 shadow-slate-100 cursor-pointer"
                >
                  <Check size={12} className="text-emerald-600" />
                  <span>RSVP</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" id="add-event-modal">
          <div className="bg-white rounded-xl max-w-md w-full shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-150 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Schedule Church Event</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="w-7 h-7 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md flex items-center justify-center font-bold text-sm outline-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wednesday Midweek Service"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Time *</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Youth Hall"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Event Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Event["type"])}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none cursor-pointer"
                  >
                    <option value="service">Service</option>
                    <option value="youth">Youth</option>
                    <option value="study">Study</option>
                    <option value="prayer">Prayer</option>
                    <option value="outreach">Outreach</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold text-xs mb-1.5">Capacity limit</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-blue-500"
                  />
                </div>
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
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
