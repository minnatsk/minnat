import React, { useState } from "react";
import { 
  Building2, Users, MapPin, ClipboardList, ShieldAlert, Sparkles, 
  Trash2, Play, Check, ChevronRight, Settings, Plus, Info, RefreshCw, AlertTriangle, Bed, Coffee, CheckSquare, ListOrdered
} from "lucide-react";
import { motion } from "motion/react";
import { Trip, YardStatus, FacilityBooking } from "../types";

interface YardManagerViewProps {
  trips: Trip[];
  yardStatus: YardStatus;
  onUpdateTrip: (tripId: string, status: string) => void;
  onUpdateYardConfig: (config: Partial<YardStatus>) => void;
  onRefresh: () => void;
}

export default function YardManagerView({ 
  trips, 
  yardStatus, 
  onUpdateTrip, 
  onUpdateYardConfig,
  onRefresh 
}: YardManagerViewProps) {
  // Config state
  const [showConfig, setShowConfig] = useState(false);
  const [tempGates, setTempGates] = useState(yardStatus.activeGates.toString());
  const [tempBays, setTempBays] = useState(yardStatus.activeLoadingBays.toString());
  const [tempCapacity, setTempCapacity] = useState(yardStatus.totalParkingBays.toString());

  // AI Diagnostic report state
  const [report, setReport] = useState<string>("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Sub-tab for manager
  const [activePane, setActivePane] = useState<'roster' | 'upcoming' | 'facilities'>('roster');

  // Categorize trips
  const queuedTrips = trips.filter(t => t.status === "queued").sort((a, b) => (a.queueNumber || 99) - (b.queueNumber || 99));
  const activeBaysTrips = trips.filter(t => t.status === "loading").sort((a, b) => (a.queueNumber || 0) - (b.queueNumber || 0));
  const upcomingTrips = trips.filter(t => t.status === "en_route" || t.status === "delayed");
  const completedTrips = trips.filter(t => t.status === "completed");

  const handleConfigSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateYardConfig({
      activeGates: Number(tempGates) || 2,
      activeLoadingBays: Number(tempBays) || 4,
      totalParkingBays: Number(tempCapacity) || 40
    });
    setShowConfig(false);
  };

  const handleCallTruck = (tripId: string) => {
    onUpdateTrip(tripId, "loading");
  };

  const handleCompleteUnloading = (tripId: string) => {
    onUpdateTrip(tripId, "completed");
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    setReport("");
    try {
      const response = await fetch("/api/gemini/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error("Report generation error:", err);
      setReport("Failed to contact Gemini. Please verify your GEMINI_API_KEY in the Secrets panel.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Simple Markdown parser to style the report nicely
  const renderReportText = (text: string) => {
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return <h2 key={index} className="text-lg font-black text-amber-400 mt-4 border-b border-slate-800 pb-1">{line.replace('# ', '')}</h2>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-sm font-black text-white mt-3 flex items-center space-x-1"><Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> <span>{line.replace('## ', '')}</span></h3>;
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={index} className="text-xs text-slate-300 ml-4 list-disc mt-1 leading-relaxed">{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\./)) {
        return <div key={index} className="text-xs text-slate-300 font-medium pl-2 mt-1.5 flex items-start space-x-1"><strong>{line.match(/^\d+\./)?.[0]}</strong> <span className="pl-1">{line.replace(/^\d+\.\s*/, '')}</span></div>;
      }
      if (line.trim() === '') return <div key={index} className="h-2" />;
      
      // Handle simple bold parsing **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (line.match(boldRegex)) {
        const parts = line.split(boldRegex);
        return (
          <p key={index} className="text-xs text-slate-400 mt-1 leading-relaxed">
            {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-200">{part}</strong> : part)}
          </p>
        );
      }
      
      return <p key={index} className="text-xs text-slate-400 mt-1 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6" id="yard-manager-dashboard">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5" id="yard-header-bar">
        <div>
          <div className="flex items-center space-x-2 text-amber-400">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black tracking-widest uppercase font-mono">Yard Dispatch Command</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Ultratech Cement Yard Hub</h1>
          <p className="text-xs text-slate-400">Gate coordination, virtual queuing sequence, and pre-arrival ETA tracker</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-extrabold rounded-xl text-xs flex items-center space-x-2 active:scale-95 transition"
            id="yard-config-toggle-btn"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Yard Parameters</span>
          </button>
          <button 
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white transition"
            id="yard-refresh-btn"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Yard Metrics Status Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="yard-metrics-bento">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Yard Parking Occupancy</div>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            {yardStatus.occupiedParkingBays} <span className="text-xs text-slate-400 font-normal">/ {yardStatus.totalParkingBays} Bays</span>
          </div>
          <div className="mt-2 w-full bg-slate-900 h-1 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500" 
              style={{ width: `${(yardStatus.occupiedParkingBays / yardStatus.totalParkingBays) * 100}%` }}
            />
          </div>
          <div className="text-[9px] text-slate-500 mt-1">
            {yardStatus.totalParkingBays - yardStatus.occupiedParkingBays} dry spaces remaining
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Sequence Queue</div>
          <div className="text-2xl font-black text-indigo-400 mt-2 font-mono">
            {queuedTrips.length} <span className="text-xs text-slate-400 font-normal">trucks waiting</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-2 flex items-center space-x-1">
            <ListOrdered className="w-3.5 h-3.5 text-indigo-400" />
            <span>Virtual FIFO algorithm active</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Loading Bays</div>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {activeBaysTrips.length} <span className="text-xs text-slate-400 font-normal">/ {yardStatus.activeLoadingBays} Bays</span>
          </div>
          <div className="text-[9px] text-slate-400 mt-2 flex items-center space-x-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bays fully operational</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Historical Wait Index</div>
          <div className="text-2xl font-black text-amber-500 mt-2 font-mono">
            {yardStatus.avgWaitTimeHours}h <span className="text-xs text-slate-400 font-normal">avg wait</span>
          </div>
          <div className="text-[9px] text-amber-500/80 mt-2 flex items-center space-x-1 font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Reduced by 60% with dynamic tokens</span>
          </div>
        </div>
      </div>

      {/* Collapsible Parameters Config Form */}
      {showConfig && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4"
          id="yard-config-form"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center space-x-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Modify Yard Operations Parameters</span>
            </h3>
            <button 
              onClick={() => setShowConfig(false)} 
              className="text-slate-500 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleConfigSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Operational Entrance Gates</label>
              <input 
                type="number" 
                value={tempGates}
                onChange={(e) => setTempGates(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Unloading / Loading Bays</label>
              <input 
                type="number" 
                value={tempBays}
                onChange={(e) => setTempBays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 font-mono focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Total Outer Parking Bays</label>
              <input 
                type="number" 
                value={tempCapacity}
                onChange={(e) => setTempCapacity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 font-mono focus:outline-none"
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <button 
                type="submit"
                className="px-5 py-2 bg-amber-500 text-slate-950 font-black rounded-lg text-xs cursor-pointer active:scale-95 transition"
                id="save-yard-config-btn"
              >
                Save Operational Changes
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Panel grid: Left side tabs, Right side AI diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="yard-main-layout">
        
        {/* Left Column (2-span): Tab selection and lists */}
        <div className="lg:col-span-2 space-y-4" id="yard-operations-panels">
          
          {/* Sub Navigation */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs" id="manager-sub-tabs">
            <button 
              onClick={() => setActivePane('roster')}
              className={`py-2 px-1 rounded-lg font-bold transition uppercase tracking-wider ${activePane === 'roster' ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
              id="subtab-roster"
            >
              Virtual Queue ({queuedTrips.length + activeBaysTrips.length})
            </button>
            <button 
              onClick={() => setActivePane('upcoming')}
              className={`py-2 px-1 rounded-lg font-bold transition uppercase tracking-wider flex items-center justify-center space-x-1.5 ${activePane === 'upcoming' ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
              id="subtab-upcoming"
            >
              <span>Upcoming ETAs ({upcomingTrips.length})</span>
            </button>
            <button 
              onClick={() => setActivePane('facilities')}
              className={`py-2 px-1 rounded-lg font-bold transition uppercase tracking-wider ${activePane === 'facilities' ? 'bg-slate-800 text-amber-400 shadow-sm border border-slate-700/80' : 'text-slate-400 hover:text-slate-200'}`}
              id="subtab-facilities"
            >
              Amenities Map
            </button>
          </div>

          {/* Tab Panes */}
          {activePane === 'roster' && (
            <div className="space-y-4" id="roster-pane">
              {/* Active Loading Bays Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Unloading Bays ({activeBaysTrips.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeBaysTrips.length === 0 ? (
                    <div className="bg-slate-950/40 p-5 border border-slate-800/80 border-dashed rounded-xl text-center text-xs text-slate-500 md:col-span-2">
                      No active unloading at bays currently. Click "Call to Bay" in queue roster.
                    </div>
                  ) : (
                    activeBaysTrips.map((t) => (
                      <div 
                        key={t.id}
                        className="bg-slate-950 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <div className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center space-x-1.5">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            <span>Unloading at Bay #{t.queueNumber}</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-white font-mono">{t.truckNumber}</h4>
                          <p className="text-[10px] text-slate-400 font-medium">Cargo: {t.cargoType} • Driver: {t.driverName}</p>
                        </div>
                        <button 
                          onClick={() => handleCompleteUnloading(t.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-2xs rounded-lg uppercase tracking-wide cursor-pointer transition active:scale-95"
                          id={`complete-btn-${t.id}`}
                        >
                          Checkout
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Waiting sequence queue */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Awaiting Call in Virtual Queue ({queuedTrips.length})</h3>
                <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  {queuedTrips.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500">
                      Virtual queue sequence is empty. Arriving trucks will join this sequence.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse" id="queue-roster-table">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-mono uppercase text-[9px] tracking-wider">
                          <th className="p-3 pl-4">Rank</th>
                          <th className="p-3">Truck / Driver</th>
                          <th className="p-3">Cargo Load</th>
                          <th className="p-3">Welfare Booking</th>
                          <th className="p-3 text-right pr-4">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {queuedTrips.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-900/30 transition">
                            <td className="p-3 pl-4 font-mono font-black text-amber-400 text-sm">#{t.queueNumber}</td>
                            <td className="p-3">
                              <div className="font-extrabold text-white font-mono">{t.truckNumber}</div>
                              <div className="text-[10px] text-slate-500">{t.driverName} • {t.driverPhone}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{t.cargoType}</div>
                              <div className="text-[10px] text-slate-500">{t.cargoWeight} tons • {t.source}</div>
                            </td>
                            <td className="p-3">
                              {t.facilityBookings.length === 0 ? (
                                <span className="text-[10px] text-slate-600">-</span>
                              ) : (
                                <div className="flex space-x-1">
                                  {t.facilityBookings.map((fb, i) => (
                                    <span 
                                      key={i} 
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${fb.status === 'claimed' ? 'bg-slate-900 text-slate-600' : 'bg-amber-400/10 text-amber-400 border border-amber-400/10'}`}
                                      title={`Slot: ${fb.slotTime}`}
                                    >
                                      {fb.facilityType.substring(0, 1).toUpperCase()}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right pr-4">
                              <button 
                                onClick={() => handleCallTruck(t.id)}
                                className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] rounded-lg uppercase tracking-wide cursor-pointer transition active:scale-95"
                                id={`call-btn-${t.id}`}
                              >
                                Call to Bay
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          )}

          {activePane === 'upcoming' && (
            <div className="space-y-3" id="upcoming-pane">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Pre-Arrival Dispatch Monitor (En Route / Delayed)
                </h3>
                <span className="text-[9px] bg-sky-950 border border-sky-800 text-sky-400 px-2 py-0.5 rounded font-mono uppercase animate-pulse">
                  Live GPS Ingress
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {upcomingTrips.length === 0 ? (
                  <div className="bg-slate-950/40 p-8 border border-slate-800 border-dashed rounded-xl text-center text-xs text-slate-500">
                    No upcoming dispatches en route to the yard currently.
                  </div>
                ) : (
                  upcomingTrips.map((t) => (
                    <div 
                      key={t.id}
                      className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-white font-mono">{t.truckNumber}</span>
                          <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800">
                            {t.cargoType} ({t.cargoWeight}T)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Origin: <strong className="text-slate-300">{t.source}</strong> • Distance: <strong className="text-slate-300">{t.distance} km</strong>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Driver: {t.driverName} ({t.driverPhone})
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/40 pt-2.5 sm:pt-0 shrink-0">
                        <div className="text-left sm:text-right">
                          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Estimated Ingress (ETA)</div>
                          <div className={`text-xs font-extrabold ${t.status === 'delayed' ? 'text-amber-400' : 'text-sky-400'} font-mono`}>
                            {new Date(t.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({Math.round(t.distance / 60)}h remaining)
                          </div>
                          {t.status === 'delayed' && (
                            <span className="text-[8px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider mt-0.5 inline-block">
                              Delay Flagged by GPS
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => handleCallTruck(t.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-200 text-[10px] font-extrabold rounded-lg uppercase transition"
                          id={`upcoming-pre-call-${t.id}`}
                        >
                          Manual gate-in
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activePane === 'facilities' && (
            <div className="space-y-4" id="facilities-pane">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Driver Amenities Hub Diagnostics</h3>
                <span className="text-[10px] text-slate-500">Status updated 1 min ago</span>
              </div>

              {/* Status breakdown of facilities */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">Restroom Sleep Dorms</span>
                    <Bed className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="text-2xl font-black text-teal-400 font-mono">14 / 20 <span className="text-xs text-slate-500 font-normal">berths used</span></div>
                  <p className="text-[10px] text-slate-400">Coolers checked. Safe parking guard active. Subsidized bedding.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">Hygienic Toilets</span>
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">Good <span className="text-xs text-emerald-400 font-semibold">(Clean checked)</span></div>
                  <p className="text-[10px] text-slate-400">Water supply level 100%. Sanitizer points stocked. Separate female block active.</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-white uppercase tracking-wider">Hot Meal Canteen</span>
                    <Coffee className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">₹30 <span className="text-xs text-slate-400 font-normal">subsidized Thali</span></div>
                  <p className="text-[10px] text-slate-400">Dal, Roti, Rice available till 23:30. Tea stall open 24 hours.</p>
                </div>
              </div>

              {/* Live Bookings Active Schedule */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Facility Tokens Booked by Drivers</h4>
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4">
                  {trips.every(t => t.facilityBookings.length === 0) ? (
                    <div className="text-center py-6 text-xs text-slate-500">No driver amenity tokens registered currently.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {trips.flatMap(t => t.facilityBookings.map(b => ({ ...b, driverName: t.driverName, truckNumber: t.truckNumber }))).map((booking, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-white">{booking.truckNumber}</span>
                            <div className="text-[10px] text-slate-400">{booking.facilityType.toUpperCase()} - {booking.slotTime}</div>
                          </div>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${booking.status === 'claimed' ? 'bg-slate-950 text-slate-500 line-through' : 'bg-amber-400/10 text-amber-400'}`}>
                            {booking.token} ({booking.status})
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Column (1-span): AI Predictive reports */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col h-fit space-y-4" id="yard-ai-diagnostics-column">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Gemini AI Yard Consultant</span>
            </h3>
            <p className="text-[10px] text-slate-500">Dynamic queue forecast & welfare evaluation</p>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Generate a full dynamic optimization report combining live yard parking, en-route truck loads, and average detention wait-times.
          </div>

          <button 
            onClick={generateReport}
            disabled={isGeneratingReport}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 active:scale-95 transition disabled:opacity-50"
            id="run-diagnostics-report-btn"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>{isGeneratingReport ? "Analyzing Logistics Logs..." : "Generate AI Yard Diagnostic Report"}</span>
          </button>

          {/* AI generated report container */}
          {report && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[420px] overflow-y-auto mt-2 select-text"
              id="ai-report-view-container"
            >
              {renderReportText(report)}
            </motion.div>
          )}

          {!report && !isGeneratingReport && (
            <div className="bg-slate-900/40 border border-dashed border-slate-800/80 rounded-xl p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center space-y-2">
              <Info className="w-5 h-5 text-slate-600" />
              <span>Click the button above to evaluate logistics and yard bottlenecks with AI reasoning.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
