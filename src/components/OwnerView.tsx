import React, { useState } from "react";
import { 
  Plus, Truck, ShieldCheck, MapPin, ClipboardList, TrendingUp, AlertCircle, 
  Clock, DollarSign, RefreshCw, Send, CheckCircle2, Navigation, AlertTriangle
} from "lucide-react";
import { motion } from "motion/react";
import { Trip, FleetStats } from "../types";

interface OwnerViewProps {
  trips: Trip[];
  onAddTrip: (tripData: Partial<Trip>) => void;
  onRefresh: () => void;
}

export default function OwnerView({ trips, onAddTrip, onRefresh }: OwnerViewProps) {
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [truckNumber, setTruckNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [cargoType, setCargoType] = useState("Portland Cement");
  const [cargoWeight, setCargoWeight] = useState("25");
  const [source, setSource] = useState("");
  const [distance, setDistance] = useState("450");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute fleet statistics from actual trips
  const fleetTrips = trips.filter(t => t.id !== "not_owned_mock"); // Filter out unrelated if any
  const totalTrucks = fleetTrips.length;
  const enRouteCount = fleetTrips.filter(t => t.status === "en_route" || t.status === "delayed").length;
  const queuedCount = fleetTrips.filter(t => t.status === "queued" || t.status === "loading").length;
  
  // Calculate average wait time (simulated based on queued list)
  const waitTimes = fleetTrips.filter(t => t.status === "queued" && t.estimatedWaitTimeHours).map(t => t.estimatedWaitTimeHours!);
  const avgWaitTime = waitTimes.length ? (waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length).toFixed(1) : "14.5";

  // Calculate simulated detention charges (₹2,500/day after 12 hours of waiting)
  const totalDetention = fleetTrips.reduce((acc, t) => {
    if (t.status === "queued" && t.estimatedWaitTimeHours && t.estimatedWaitTimeHours > 12) {
      const excessHours = t.estimatedWaitTimeHours - 12;
      return acc + Math.round((excessHours / 24) * 2500);
    }
    return acc;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckNumber || !driverName || !driverPhone || !source) return;

    setIsSubmitting(true);
    try {
      await onAddTrip({
        truckNumber: truckNumber.toUpperCase(),
        driverName,
        driverPhone,
        cargoType,
        cargoWeight: Number(cargoWeight),
        source,
        distance: Number(distance),
        destinationCompany: "Ultratech Yard Hub, Surat"
      });
      // Reset form
      setTruckNumber("");
      setDriverName("");
      setDriverPhone("");
      setSource("");
      setDistance("450");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6" id="owner-dashboard">
      
      {/* Dashboard Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5" id="owner-title-bar">
        <div>
          <div className="flex items-center space-x-2 text-amber-400">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-black tracking-widest uppercase font-mono">Fleet Controller</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Sher-E-Hind Fleet Dashboard</h1>
          <p className="text-xs text-slate-400">Real-time truck coordinates, queue ETA, and driver welfare monitor</p>
        </div>
        
        <div className="flex items-center space-x-2 shrink-0">
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-amber-500/10 active:scale-95 transition"
            id="owner-add-trip-btn"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Dispatch New Journey</span>
          </button>
          <button 
            onClick={onRefresh}
            className="p-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-slate-300 hover:text-white transition"
            id="owner-refresh-btn"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Fleet Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="fleet-stats-grid">
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Active Fleet</div>
          <div className="text-3xl font-black text-white mt-2 font-mono">{totalTrucks}</div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <Truck className="w-3.5 h-3.5 text-amber-500" />
            <span>Configured in India Roster</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">En Route / Delayed</div>
          <div className="text-3xl font-black text-sky-400 mt-2 font-mono">
            {enRouteCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Moving towards destination</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">At Yard (In Queue)</div>
          <div className="text-3xl font-black text-indigo-400 mt-2 font-mono">
            {queuedCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <Navigation className="w-3.5 h-3.5 text-indigo-400" />
            <span>Waiting virtual sequence</span>
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
          <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Estimated Detention</div>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            ₹{totalDetention.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Avoided ₹{Math.round(totalDetention * 0.4).toLocaleString('en-IN')} via Virtual Queue</span>
          </div>
        </div>
      </div>

      {/* Slide-out / Collapsible Dispatch Form */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4"
          id="dispatch-trip-form"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center space-x-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Dispatch New Journey (प्री-रजिस्ट्रेशन)</span>
            </h3>
            <button 
              onClick={() => setShowForm(false)} 
              className="text-slate-500 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Truck Number (MH-12-PQ-4567)</label>
              <input 
                type="text" 
                required
                placeholder="e.g. MH-12-PQ-4567"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-400 uppercase font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Driver Name</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Gurpreet Singh"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Driver Phone Number</label>
              <input 
                type="text" 
                required
                placeholder="e.g. +91 98765 43210"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Cargo Material</label>
              <select 
                value={cargoType}
                onChange={(e) => setCargoType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none"
              >
                <option value="Portland Cement">Portland Cement</option>
                <option value="Structural Steel Bars">Structural Steel Bars</option>
                <option value="Fly Ash">Fly Ash</option>
                <option value="Gypsum Powder">Gypsum Powder</option>
                <option value="Aggregates">Aggregates</option>
                <option value="Coal Fuel">Coal Fuel</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Cargo Weight (Tons)</label>
              <input 
                type="number" 
                value={cargoWeight}
                onChange={(e) => setCargoWeight(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Source Location (City, State)</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Jaipur, Rajasthan"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Destination Yard</label>
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-400 mt-1 font-semibold">
                Ultratech Yard Hub, Surat
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono uppercase">Distance (KM)</label>
              <input 
                type="number" 
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl text-xs py-2.5 px-3.5 text-slate-200 mt-1 focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-end">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-2 cursor-pointer shadow-lg active:scale-98 transition disabled:opacity-50"
                id="submit-dispatch-btn"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? "Dispatching..." : "Pre-Register Cargo Trip"}</span>
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Fleet Roster List */}
      <div className="space-y-3" id="fleet-roster-list">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <ClipboardList className="w-4.5 h-4.5 text-amber-500" />
            <span>My Active Fleet Monitor ({trips.length})</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">ALL CHANNELS SECURE</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {trips.length === 0 ? (
            <div className="bg-slate-950/40 p-10 border border-slate-800 border-dashed rounded-3xl text-center text-slate-500">
              No active dispatches registered. Pre-register your trucks above to begin tracking.
            </div>
          ) : (
            trips.map((t) => (
              <div 
                key={t.id}
                className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition space-y-4"
              >
                {/* Truck header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/40 pb-3">
                  <div className="flex items-center space-x-3.5">
                    <div className="p-3 bg-slate-900 text-amber-400 rounded-xl border border-slate-800">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-base font-black text-white font-mono tracking-wider">{t.truckNumber}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold px-2 py-0.5 bg-slate-900 border border-slate-800 rounded">
                          {t.cargoType} ({t.cargoWeight}T)
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Driver: <strong className="text-slate-200">{t.driverName}</strong> • {t.driverPhone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-extrabold uppercase tracking-wide ${
                      t.status === 'en_route' ? 'bg-sky-950/40 text-sky-400 border-sky-800' :
                      t.status === 'delayed' ? 'bg-amber-950/40 text-amber-400 border-amber-800/60' :
                      t.status === 'queued' ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/60' :
                      t.status === 'loading' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60 animate-pulse' :
                      'bg-teal-950/40 text-teal-400 border-teal-800/60'
                    }`}>
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Logistics details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Route Journey</div>
                    <div className="text-slate-300 font-medium flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{t.source} ➔ Surat</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.distance} km total trip</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Queue / Entry Status</div>
                    {t.status === 'queued' ? (
                      <div className="text-amber-400 font-black text-sm flex items-center space-x-1 font-mono">
                        <span>Rank #{t.queueNumber}</span>
                        <span className="text-[10px] text-slate-400 font-normal">(~{t.estimatedWaitTimeHours}h wait)</span>
                      </div>
                    ) : t.status === 'loading' ? (
                      <div className="text-emerald-400 font-bold text-xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unloading at Bay #{t.queueNumber}</span>
                      </div>
                    ) : t.status === 'completed' ? (
                      <div className="text-teal-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unloaded Successfully</span>
                      </div>
                    ) : (
                      <div className="text-sky-400 font-medium font-mono flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>ETA: {new Date(t.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Driver Welfare Checkin</div>
                    {t.facilityBookings.length === 0 ? (
                      <div className="text-slate-500 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        <span>No facilities booked yet</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {t.facilityBookings.map((fb, i) => (
                          <span 
                            key={i} 
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center space-x-0.5 ${fb.status === 'claimed' ? 'bg-slate-900 text-slate-500 line-through border border-slate-800' : 'bg-amber-400/10 text-amber-400 border border-amber-400/20'}`}
                          >
                            <span>{fb.facilityType.toUpperCase()}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress simulator (for visual engagement) */}
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      t.status === 'completed' ? 'w-full bg-teal-500' :
                      t.status === 'loading' ? 'w-[90%] bg-emerald-500' :
                      t.status === 'queued' ? 'w-[75%] bg-indigo-500' :
                      t.status === 'delayed' ? 'w-[45%] bg-amber-500 animate-pulse' :
                      'w-[30%] bg-sky-500'
                    }`} 
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
