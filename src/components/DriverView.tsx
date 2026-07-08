import React, { useState, useEffect, useRef } from "react";
import { 
  Truck, User, MapPin, Navigation, Clock, Calendar, ShieldCheck, 
  ShowerHead, Coffee, Bed, ArrowRight, MessageSquare, Send, AlertTriangle, 
  Sparkles, CheckCircle2, ChevronRight, RefreshCw, Languages, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Trip, FacilityBooking, ChatMessage, YardStatus } from "../types";

interface DriverViewProps {
  trips: Trip[];
  onUpdateTrip: (tripId: string, status: string, eta?: string) => void;
  onBookFacility: (tripId: string, facilityType: 'toilet' | 'shower' | 'restroom' | 'meal', slotTime: string) => void;
  onClaimBooking: (tripId: string, bookingId: string, status: 'claimed' | 'cancelled') => void;
  onRefresh: () => void;
  yardStatus: YardStatus;
}

export default function DriverView({ 
  trips, 
  onUpdateTrip, 
  onBookFacility, 
  onClaimBooking, 
  onRefresh,
  yardStatus 
}: DriverViewProps) {
  // Find trips associated with drivers
  const [selectedTripId, setSelectedTripId] = useState<string>("trip-1");
  const activeTrip = trips.find(t => t.id === selectedTripId) || trips[0];

  // Facility booking state
  const [bookingType, setBookingType] = useState<'toilet' | 'shower' | 'restroom' | 'meal' | null>(null);
  const [bookingTime, setBookingTime] = useState<string>("19:00");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  // AI Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [language, setLanguage] = useState("Hindi");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'facilities' | 'assist'>('dashboard');

  // Load chat messages when selected trip changes
  useEffect(() => {
    if (activeTrip) {
      fetch(`/api/chats/${activeTrip.id}`)
        .then(res => res.json())
        .then(data => setMessages(data))
        .catch(err => console.error("Error loading chat:", err));
    }
  }, [selectedTripId, activeTrip?.id]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleStatusChange = (status: string) => {
    onUpdateTrip(activeTrip.id, status);
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingType) return;
    
    setIsBookingSubmitting(true);
    try {
      await onBookFacility(activeTrip.id, bookingType, bookingTime);
      setBookingType(null); // Close modal
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, presetText?: string) => {
    if (e) e.preventDefault();
    const textToSend = presetText || inputMessage;
    if (!textToSend.trim()) return;

    if (!presetText) setInputMessage("");
    
    // Optimistic user message update
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "driver",
      text: textToSend,
      timestamp: new Date().toISOString(),
      language
    };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`/api/chats/${activeTrip.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend, language })
      });
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsChatLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-gray-100 text-gray-800 border-gray-200";
      case "en_route": return "bg-sky-100 text-sky-800 border-sky-200 animate-pulse";
      case "delayed": return "bg-amber-100 text-amber-800 border-amber-200";
      case "queued": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "loading": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "completed": return "bg-teal-100 text-teal-800 border-teal-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "scheduled": return "Scheduled (नियोजित)";
      case "en_route": return "On the Way (रास्ते में)";
      case "delayed": return "Delayed (देरी)";
      case "queued": return "In Queue (लाइन में)";
      case "loading": return "Unloading/Loading (खाली/लोड चालू)";
      case "completed": return "Journey Completed (पूरी हुई)";
      default: return status;
    }
  };

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case "toilet": return <User className="w-5 h-5 text-indigo-600" />;
      case "shower": return <ShowerHead className="w-5 h-5 text-blue-600" />;
      case "restroom": return <Bed className="w-5 h-5 text-teal-600" />;
      case "meal": return <Coffee className="w-5 h-5 text-amber-600" />;
      default: return <CheckCircle2 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFacilityLabel = (type: string) => {
    switch (type) {
      case "toilet": return "Hygienic Toilet (शौचालय)";
      case "shower": return "Hot Shower (स्नानघर)";
      case "restroom": return "Rest Bed (विश्राम गृह)";
      case "meal": return "Subsidized Meal (गर्म खाना)";
      default: return type;
    }
  };

  const presetQuestions = [
    { text: "Where is the clean toilet?", label: "Clean Toilet Location (साफ़ शौचालय कहाँ है?)" },
    { text: "How much is my queue wait time?", label: "My Wait Time (कितनी देर लगेगी?)" },
    { text: "Are there charging sockets in rest area?", label: "Mobile Charging (चार्जिंग कहाँ करें?)" },
    { text: "What is the food menu today?", label: "Meal Food Menu (आज खाने में क्या है?)" }
  ];

  if (!activeTrip) {
    return <div className="p-4 text-center">Loading driver trips...</div>;
  }

  return (
    <div className="max-w-md mx-auto bg-slate-900 text-white min-h-[750px] shadow-2xl rounded-3xl border border-slate-800 flex flex-col overflow-hidden relative" id="driver-app-frame">
      {/* App Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between" id="driver-header">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Truck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-amber-400 uppercase">Milaap Yard Mitr</h1>
            <p className="text-[10px] text-slate-400 font-mono">DRIVER COMPANION APP</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Driver Selector Mockup */}
          <select 
            value={selectedTripId} 
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg text-xs py-1 px-2 focus:outline-none focus:ring-1 focus:ring-amber-400 text-slate-200"
            id="driver-profile-selector"
          >
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.driverName} ({t.truckNumber})</option>
            ))}
          </select>
          <button 
            onClick={onRefresh}
            className="p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition"
            id="driver-refresh-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Screen Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 pb-20">
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs" id="driver-nav-tabs">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`py-2 px-1 rounded-lg font-semibold transition ${activeTab === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-dashboard"
          >
            My Token
          </button>
          <button 
            onClick={() => setActiveTab('facilities')}
            className={`py-2 px-1 rounded-lg font-semibold transition ${activeTab === 'facilities' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-facilities"
          >
            Facilities ({activeTrip.facilityBookings.length})
          </button>
          <button 
            onClick={() => setActiveTab('assist')}
            className={`py-2 px-1 rounded-lg font-semibold transition flex items-center justify-center space-x-1 ${activeTab === 'assist' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            id="tab-assist"
          >
            <Sparkles className="w-3 h-3 text-current" />
            <span>AI Assist</span>
          </button>
        </div>

        {/* Dynamic Screens */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col space-y-4"
              id="driver-screen-dashboard"
            >
              {/* Truck Plate Card */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between" id="truck-plate-card">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Truck Registration</div>
                  <div className="text-xl font-extrabold tracking-wider text-amber-400 font-mono mt-0.5">{activeTrip.truckNumber}</div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{activeTrip.driverName} • {activeTrip.driverPhone}</span>
                  </div>
                </div>
                <div className={`px-2.5 py-1 rounded-full border text-[11px] font-bold ${getStatusColor(activeTrip.status)}`} id="trip-status-badge">
                  {getStatusLabel(activeTrip.status)}
                </div>
              </div>

              {/* Virtual Queue Token Card (Only if queued or arrived) */}
              {(activeTrip.status === 'queued' || activeTrip.status === 'loading') ? (
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-5 rounded-2xl border border-indigo-500/30 text-center relative overflow-hidden" id="queue-token-card">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="text-xs text-indigo-300 font-semibold tracking-wider uppercase">Your Virtual Entry Token</div>
                  
                  {activeTrip.status === 'queued' ? (
                    <>
                      <div className="text-6xl font-black text-amber-400 font-mono my-3 tracking-tighter" id="queue-pos-number">
                        #{activeTrip.queueNumber}
                      </div>
                      <p className="text-xs text-slate-300 px-4">
                        Please rest! You do not need to stand in line. We will notify you when your token reaches #1.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-left border-r border-slate-800/80 pr-2">
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1 font-mono uppercase">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>Wait Time</span>
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5 font-mono">{activeTrip.estimatedWaitTimeHours} hrs</div>
                        </div>
                        <div className="text-left pl-2">
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1 font-mono uppercase">
                            <Navigation className="w-3 h-3 text-slate-400" />
                            <span>Yard Capacity</span>
                          </div>
                          <div className="text-base font-extrabold text-white mt-0.5 font-mono">
                            {yardStatus.occupiedParkingBays}/{yardStatus.totalParkingBays} Bays
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-extrabold text-emerald-400 flex items-center justify-center space-x-2 my-6" id="unloading-active-status">
                        <CheckCircle2 className="w-8 h-8 animate-bounce" />
                        <span>Go to Bay #{activeTrip.queueNumber}</span>
                      </div>
                      <p className="text-xs text-emerald-200 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-500/20">
                        Proceed immediately to Gate Unloading Bay #3. Keep your documents ready for fast gate checkout.
                      </p>
                    </>
                  )}
                </div>
              ) : activeTrip.status === 'completed' ? (
                <div className="bg-teal-950/20 p-5 rounded-2xl border border-teal-800/40 text-center" id="trip-completed-card">
                  <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-2" />
                  <h3 className="text-base font-bold text-teal-300">Journey Successfully Unloaded!</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Your shipment was processed successfully. Gate pass issued. Safe travels back to your home state, Captain!
                  </p>
                  <button 
                    onClick={() => onUpdateTrip(activeTrip.id, "scheduled")}
                    className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl hover:bg-slate-700 transition"
                    id="driver-reset-trip"
                  >
                    Simulate New Trip
                  </button>
                </div>
              ) : (
                /* En Route State Card */
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4" id="enroute-state-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Route</span>
                      <h3 className="font-bold text-sm text-slate-200 mt-0.5">{activeTrip.source}</h3>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 mt-4" />
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Destination</span>
                      <h3 className="font-bold text-sm text-amber-400 mt-0.5">{activeTrip.destinationCompany}</h3>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase">Estimated Arrival (ETA)</div>
                        <div className="text-xs font-extrabold text-slate-200">{new Date(activeTrip.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({Math.round(activeTrip.distance / 60)} hrs left)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 font-mono uppercase">Distance</div>
                      <div className="text-xs font-bold text-slate-200">{activeTrip.distance} km</div>
                    </div>
                  </div>

                  {/* Drivers buttons to report actual status */}
                  <div className="grid grid-cols-2 gap-2" id="driver-status-update-actions">
                    <button 
                      onClick={() => handleStatusChange("arrived")}
                      className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-amber-500/10 active:scale-[0.98] transition"
                      id="driver-btn-arrived"
                    >
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                      <span>Report Arrived at Yard</span>
                    </button>
                    {activeTrip.status !== 'delayed' ? (
                      <button 
                        onClick={() => handleStatusChange("delayed")}
                        className="w-full py-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 active:scale-[0.98] transition"
                        id="driver-btn-delayed"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Report Border/Traffic Delay</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleStatusChange("en_route")}
                        className="w-full py-3 bg-sky-950 text-sky-400 border border-sky-800 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition animate-pulse"
                        id="driver-btn-resume"
                      >
                        <span>Resume Journey</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Welfare Alert Notice */}
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 flex items-start space-x-2.5" id="driver-welfare-notice">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Milaap Dignity Protocol Active</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                    Ustad ji, you do not need to sit in the truck under high heat. Book a bed in our air-cooled restroom and clean bathroom slots. Food is subsidized.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'facilities' && (
            <motion.div 
              key="facilities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col space-y-4"
              id="driver-screen-facilities"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Book Facilities (सुविधाएं)</h2>
                  <p className="text-[10px] text-slate-400">Zero Line Virtual Booking</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-400">
                  Sector A Facilities Hub
                </span>
              </div>

              {/* Facility Booking Quick Buttons */}
              <div className="grid grid-cols-2 gap-2" id="facilities-booking-selection-grid">
                <button 
                  onClick={() => setBookingType('toilet')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 relative overflow-hidden transition ${bookingType === 'toilet' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                  id="book-btn-toilet"
                >
                  <User className="w-5 h-5 text-indigo-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Clean Toilet</div>
                    <div className="text-[9px] text-slate-400">शौचालय (Water supply ok)</div>
                  </div>
                </button>
                <button 
                  onClick={() => setBookingType('shower')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 relative overflow-hidden transition ${bookingType === 'shower' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                  id="book-btn-shower"
                >
                  <ShowerHead className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Hot Shower</div>
                    <div className="text-[9px] text-slate-400">स्नानघर (Hygienic bathrooms)</div>
                  </div>
                </button>
                <button 
                  onClick={() => setBookingType('restroom')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 relative overflow-hidden transition ${bookingType === 'restroom' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                  id="book-btn-restroom"
                >
                  <Bed className="w-5 h-5 text-teal-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Sleeping Berth</div>
                    <div className="text-[9px] text-slate-400">विश्राम गृह (Air cooled dorms)</div>
                  </div>
                </button>
                <button 
                  onClick={() => setBookingType('meal')}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between h-24 relative overflow-hidden transition ${bookingType === 'meal' ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                  id="book-btn-meal"
                >
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">Subsidized Food</div>
                    <div className="text-[9px] text-slate-400">भोजन (Dal, Roti, Rice ₹30)</div>
                  </div>
                </button>
              </div>

              {/* Dynamic Booking Confirmation Panel */}
              {bookingType && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                  onSubmit={handleBook}
                  id="facility-booking-form"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                      {getFacilityIcon(bookingType)}
                      <span>Book {getFacilityLabel(bookingType)}</span>
                    </span>
                    <button 
                      type="button" 
                      onClick={() => setBookingType(null)}
                      className="text-slate-400 hover:text-white text-[10px] font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono uppercase">Select Time Slot</label>
                      <select 
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs py-2 px-2.5 mt-0.5 text-slate-200"
                        id="booking-slot-time-select"
                      >
                        <option value="15:30">03:30 PM</option>
                        <option value="17:00">05:00 PM</option>
                        <option value="18:30">06:30 PM</option>
                        <option value="19:00">07:00 PM</option>
                        <option value="20:30">08:30 PM</option>
                        <option value="22:00">10:00 PM</option>
                        <option value="23:30">11:30 PM</option>
                        <option value="08:00">08:00 AM (Next Day)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-mono uppercase">Location Hub</label>
                      <div className="bg-slate-900 border border-slate-800 rounded-lg text-xs py-2 px-2.5 mt-0.5 text-slate-400 font-medium">
                        Sector A Hub
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isBookingSubmitting}
                    className="w-full py-2 bg-amber-500 text-slate-950 font-extrabold rounded-lg text-xs active:scale-[0.98] transition disabled:opacity-50"
                    id="submit-booking-btn"
                  >
                    {isBookingSubmitting ? "Generating Token..." : "Confirm Virtual Booking Slot"}
                  </button>
                </motion.form>
              )}

              {/* My Booking Tokens */}
              <div className="space-y-2 mt-2" id="driver-my-bookings-list">
                <h3 className="text-xs font-bold text-slate-300">My Active Tokens (मेरे एक्टिव कूपन)</h3>
                {activeTrip.facilityBookings.length === 0 ? (
                  <div className="bg-slate-950/40 border border-dashed border-slate-800 p-4 rounded-xl text-center text-xs text-slate-500">
                    No active facility tokens booked. Use grid above to reserve.
                  </div>
                ) : (
                  activeTrip.facilityBookings.map((b) => (
                    <div 
                      key={b.id}
                      className={`p-3.5 rounded-xl border ${b.status === 'claimed' ? 'bg-slate-950/20 border-slate-800 text-slate-500' : 'bg-slate-950 border-slate-800'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-lg ${b.status === 'claimed' ? 'bg-slate-900 text-slate-600' : 'bg-slate-900 text-amber-400'}`}>
                            {getFacilityIcon(b.facilityType)}
                          </div>
                          <div>
                            <h4 className={`text-xs font-bold ${b.status === 'claimed' ? 'text-slate-500' : 'text-slate-200'}`}>
                              {getFacilityLabel(b.facilityType)}
                            </h4>
                            <div className="text-[10px] text-slate-400 font-mono">Slot: {b.slotTime} • Sector A</div>
                          </div>
                        </div>

                        {/* Booking code and claim action */}
                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${b.status === 'claimed' ? 'bg-slate-900 text-slate-600' : 'bg-amber-400/10 text-amber-400'}`}>
                            {b.token}
                          </span>
                          
                          <div className="mt-1.5">
                            {b.status === 'booked' ? (
                              <button 
                                onClick={() => onClaimBooking(activeTrip.id, b.id, "claimed")}
                                className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] font-black rounded uppercase transition"
                                id={`claim-btn-${b.id}`}
                              >
                                Tap to Claim
                              </button>
                            ) : (
                              <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                                Claimed (पहुंच गए)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'assist' && (
            <motion.div 
              key="assist"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col flex-1"
              id="driver-screen-assist"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold text-white flex items-center space-x-1">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Yard Mitr (यार्ड मित्र एआई)</span>
                  </h2>
                  <p className="text-[10px] text-slate-400">Multilingual Driver Support</p>
                </div>
                <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                  <Languages className="w-3.5 h-3.5 text-amber-400" />
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded p-0.5 text-[9px] text-slate-200 focus:outline-none"
                    id="chat-lang-select"
                  >
                    <option value="Hindi">हिंदी (Hindi)</option>
                    <option value="English">English</option>
                    <option value="Tamil">தமிழ் (Tamil)</option>
                    <option value="Telugu">తెలుగు (Telugu)</option>
                    <option value="Punjabi">ਪੰਜਾਬੀ (Punjabi)</option>
                  </select>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto max-h-[360px] space-y-3 py-3 pr-1" id="chat-messages-container">
                {messages.map((m) => (
                  <div 
                    key={m.id}
                    className={`flex ${m.sender === 'driver' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${m.sender === 'driver' ? 'bg-amber-500 text-slate-950 font-semibold rounded-tr-none' : 'bg-slate-950 border border-slate-800 rounded-tl-none text-slate-200'}`}>
                      {m.sender === 'assistant' && (
                        <div className="text-[9px] font-black text-amber-400 font-mono uppercase tracking-wider mb-1 flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-current shrink-0" />
                          <span>Yard Mitr AI</span>
                        </div>
                      )}
                      <p className="whitespace-pre-line">{m.text}</p>
                      <span className="text-[8px] opacity-60 block mt-1 text-right font-mono">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      <span className="text-[10px] text-slate-400 font-mono">Mitr is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preset suggestion chip bar */}
              <div className="flex space-x-1.5 overflow-x-auto py-1.5 scrollbar-none" id="preset-suggestions">
                {presetQuestions.map((q, idx) => (
                  <button 
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, q.text)}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-full px-3 py-1 text-[9px] shrink-0 font-medium transition"
                  >
                    {q.label}
                  </button>
                ))}
              </div>

              {/* Message input bar */}
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2 mt-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5" id="driver-chat-form">
                <input 
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message (e.g. 'कहां सो सकते हैं?')..."
                  className="bg-transparent border-0 ring-0 focus:outline-none focus:ring-0 text-xs flex-1 text-slate-100 placeholder-slate-500 px-2"
                  id="chat-text-input"
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="p-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg active:scale-95 transition disabled:opacity-40 disabled:hover:bg-amber-500"
                  id="send-chat-btn"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Persistent Bottom Tab Bar (Mobile Mock Look) */}
      <div className="absolute bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800 grid grid-cols-3 py-2 text-center" id="driver-bottom-navbar">
        <button 
          onClick={() => { setActiveTab('dashboard'); }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'dashboard' ? 'text-amber-400' : 'text-slate-500'}`}
          id="nav-btn-dashboard"
        >
          <Truck className="w-4 h-4" />
          <span className="text-[9px] font-bold">My Token</span>
        </button>
        <button 
          onClick={() => { setActiveTab('facilities'); }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'facilities' ? 'text-amber-400' : 'text-slate-500'}`}
          id="nav-btn-facilities"
        >
          <ShowerHead className="w-4 h-4" />
          <span className="text-[9px] font-bold">Facilities</span>
        </button>
        <button 
          onClick={() => { setActiveTab('assist'); }}
          className={`flex flex-col items-center space-y-0.5 ${activeTab === 'assist' ? 'text-amber-400' : 'text-slate-500'}`}
          id="nav-btn-assist"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[9px] font-bold">Yard Mitr AI</span>
        </button>
      </div>

    </div>
  );
}
