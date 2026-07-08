import React, { useState, useEffect } from "react";
import { 
  Truck, User, Building2, Smartphone, ShieldCheck, 
  MapPin, Clock, Info, HelpCircle, CheckCircle2, ChevronRight, RefreshCw, Sparkles, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import DriverView from "./components/DriverView";
import OwnerView from "./components/OwnerView";
import YardManagerView from "./components/YardManagerView";
import { Trip, YardStatus } from "./types";

export default function App() {
  // Current active persona for simulation
  const [activeRole, setActiveRole] = useState<'driver' | 'owner' | 'manager'>('driver');
  
  // App state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [yardStatus, setYardStatus] = useState<YardStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tripsRes, yardRes] = await Promise.all([
        fetch("/api/trips"),
        fetch("/api/yard")
      ]);

      if (!tripsRes.ok || !yardRes.ok) {
        throw new Error("Failed to load operations logs from Express API.");
      }

      const tripsData = await tripsRes.json();
      const yardData = await yardRes.json();

      setTrips(tripsData);
      setYardStatus(yardData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred connecting to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // API Callbacks passed to sub-components
  const handleUpdateTrip = async (tripId: string, status: string, eta?: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, eta })
      });
      if (!response.ok) throw new Error("Failed to update trip");
      const updatedTrip = await response.json();
      
      // Update local state
      setTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
      
      // Refresh yard status as well (queue counts change)
      const yardRes = await fetch("/api/yard");
      const yardData = await yardRes.json();
      setYardStatus(yardData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTrip = async (tripData: Partial<Trip>) => {
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tripData)
      });
      if (!response.ok) throw new Error("Failed to register dispatch");
      const newTrip = await response.json();
      
      setTrips(prev => [newTrip, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookFacility = async (tripId: string, facilityType: 'toilet' | 'shower' | 'restroom' | 'meal', slotTime: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/book-facility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facilityType, slotTime })
      });
      if (!response.ok) throw new Error("Failed to book facility");
      const updatedTrip = await response.json();
      
      setTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimBooking = async (tripId: string, bookingId: string, status: 'claimed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/trips/${tripId}/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!response.ok) throw new Error("Failed to claim facility booking");
      const updatedTrip = await response.json();
      
      setTrips(prev => prev.map(t => t.id === tripId ? updatedTrip : t));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateYardConfig = async (config: Partial<YardStatus>) => {
    try {
      const response = await fetch("/api/yard", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error("Failed to update yard configuration");
      const updatedYard = await response.json();
      
      setYardStatus(updatedYard);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="app-root">
      
      {/* Simulation Navigation Banner */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 shadow-md" id="simulator-nav-banner">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Truck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs font-black tracking-widest text-slate-500 uppercase font-mono">India Yard Optimization</span>
              <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-1">
                <span>Dignity Queue System</span>
                <span className="text-2xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded uppercase font-mono">DIGNITY</span>
              </h1>
            </div>
          </div>

          {/* Role selection pills */}
          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800/80 text-xs gap-1" id="role-selector-container">
            <button 
              onClick={() => setActiveRole('driver')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition ${activeRole === 'driver' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              id="role-btn-driver"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>📱 Driver Companion App</span>
            </button>
            <button 
              onClick={() => setActiveRole('owner')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition ${activeRole === 'owner' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              id="role-btn-owner"
            >
              <User className="w-4 h-4 shrink-0" />
              <span>🏢 Truck Owner Portal</span>
            </button>
            <button 
              onClick={() => setActiveRole('manager')}
              className={`px-4 py-2 rounded-xl font-bold flex items-center space-x-2 transition ${activeRole === 'manager' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              id="role-btn-manager"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>🏭 Yard Dispatch Desk</span>
            </button>
          </div>

          {/* Quick connection state */}
          <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-full px-3.5 py-1 text-xs">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-slate-400 font-mono">API: EXPRESS SERVER ONLINE</span>
          </div>

        </div>
      </div>

      {/* Simulator Quick Explanation Info */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 p-3" id="app-explain-banner">
        <div className="max-w-7xl mx-auto flex items-start space-x-3 text-xs text-amber-200">
          <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Problem Solved:</strong> Drivers waiting 3-7 days with zero facilities, and companies blind to incoming traffic.
            Our <strong>Milaap Dignity Queue System</strong> registers trips in advance (Owner Portal), assigns virtual queue tokens with dynamic ETAs (Driver Android App), reserves hygienic facility slots (Toilet/Shower/Beds), and tracks incoming loads in real-time (Yard Dispatch Console). 
            <span className="text-amber-400 underline font-semibold ml-1.5 cursor-pointer hover:text-amber-300" onClick={() => fetchData()}>Try simulating dynamic transitions by clicking different views!</span>
          </p>
        </div>
      </div>

      {/* Main Content Pane */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6" id="app-main-pane">
        
        {isLoading && trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 space-y-4" id="main-loading-screen">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm text-slate-400 font-mono">Loading dynamic factory logs...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-900/60 p-6 rounded-2xl text-center max-w-md mx-auto space-y-3" id="main-error-screen">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-rose-300">Database Connection Failed</h3>
            <p className="text-xs text-slate-400">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl"
            >
              Retry Connection
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeRole === 'driver' && (
              <motion.div 
                key="driver"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
                id="simulator-driver-role-pane"
              >
                {/* Left Column: Mobile App Frame mockup */}
                <div className="lg:col-span-5 flex justify-center" id="driver-app-mockup-col">
                  <div className="relative">
                    {/* Device bezel frame embellishments */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-950 border border-slate-800 rounded-b-2xl z-50 flex items-center justify-center">
                      <div className="w-3 h-3 bg-slate-900 rounded-full border border-slate-800" />
                      <div className="w-12 h-1 bg-slate-800 rounded-full ml-3" />
                    </div>
                    
                    <DriverView 
                      trips={trips}
                      onUpdateTrip={handleUpdateTrip}
                      onBookFacility={handleBookFacility}
                      onClaimBooking={handleClaimBooking}
                      onRefresh={fetchData}
                      yardStatus={yardStatus || {
                        companyName: "Ultratech Cement Yard Hub",
                        totalParkingBays: 40,
                        occupiedParkingBays: 28,
                        activeGates: 2,
                        activeLoadingBays: 4,
                        avgWaitTimeHours: 14.5,
                        currentQueueCount: 8
                      }}
                    />
                  </div>
                </div>

                {/* Right Column: Driver context & simulation guide */}
                <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6" id="driver-app-simulation-details">
                  <div>
                    <h2 className="text-xl font-extrabold text-white">How Drivers Experience "Yard Mitr" Android App</h2>
                    <p className="text-xs text-slate-400 mt-1">Humble, practical, and highly empathetic solutions for roadside truck operators</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wider">1. No More Standing in roadside lines</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Instead of parking on dusty highways for 3-5 days under severe heat, drivers use our virtual sequence token. Their queue placement is calculated automatically.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wider">2. Hygienic Facilities on-demand</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        Drivers secure digital slots with alphanumeric checkout codes for toilets, showers, and air-cooled sleeping beds inside our specialized welfare hubs.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wider">3. "Yard Mitr" Smart Assistant</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        A Gemini-powered conversational agent assisting drivers in their native language (Hindi, Tamil, Telugu, Punjabi). It guides them to clean drinking water, canteens, and alerts them when their queue token moves.
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wider">4. Real-time Status Synchronization</h4>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        When a driver clicks "Report Arrived" or "Claim Facility Token", the action instantly reflects on the company's dispatch screen to optimize unloading scheduling.
                      </p>
                    </div>
                  </div>

                  {/* Guide Interactive Sandbox */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3" id="driver-sandbox-guide">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Driver Interactive Sandbox Instructions</span>
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-2 pl-4 list-decimal leading-relaxed">
                      <li>Use the profile selector in the phone mockup header to swap between <strong>Rajesh Kumar</strong> (En Route) and <strong>Dinesh Patel</strong> (In Queue).</li>
                      <li>Try clicking <strong>"Report Arrived at Yard"</strong> on Rajesh's token to see his status instantly transition to the virtual queue roster with an assigned sequence code!</li>
                      <li>Go to the <strong>Facilities tab</strong> to book an RO sleeping bed or a hot thali. Note how alphanumeric vouchers (e.g. <strong>T-402</strong>) are instantly generated.</li>
                      <li>Click <strong>"AI Assist"</strong> to chat in Hindi or English with the smart consultant! Tap presets to quickly ask about toilets or beds.</li>
                    </ul>
                  </div>

                  {/* Real Android App Installation Hub */}
                  <div className="bg-slate-950 border border-amber-500/20 rounded-2xl p-5 space-y-4" id="driver-apk-install-hub">
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                      <Smartphone className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-wider">
                          Android APK & PWA Installation Hub
                        </h3>
                        <p className="text-[10px] text-slate-500">Fully compatible with all Android devices and packages</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Method 1: Instant PWA Install */}
                      <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <div className="font-extrabold text-amber-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                          <span>Method 1: Direct Android Install (PWA)</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          We have deployed a fully responsive PWA. When opened on Android:
                        </p>
                        <ol className="list-decimal pl-4 text-slate-400 text-[11px] space-y-1 mt-1 font-mono">
                          <li>Open this app URL in <strong>Google Chrome</strong> or Edge on Android.</li>
                          <li>Tap the browser menu <strong>(three vertical dots)</strong>.</li>
                          <li>Select <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</li>
                          <li>The app instantly installs to your drawer with our custom high-contrast orange truck launcher icon!</li>
                        </ol>
                      </div>

                      {/* Method 2: Convert to Standalone APK */}
                      <div className="space-y-1.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <div className="font-extrabold text-amber-400 flex items-center space-x-1">
                          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>Method 2: Compile Standalone Native APK</span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          To build a traditional `.apk` package to distribute on WhatsApp or sideload, run this on your terminal:
                        </p>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[9px] text-slate-300 select-all overflow-x-auto whitespace-pre">
{`# 1. Install Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Package PWA into custom native Android project
bubblewrap init --manifest="\${window.location.origin}/manifest.json"

# 3. Compile standalone installable signed APK
bubblewrap build`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeRole === 'owner' && (
              <motion.div 
                key="owner"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                id="simulator-owner-role-pane"
              >
                <OwnerView 
                  trips={trips}
                  onAddTrip={handleAddTrip}
                  onRefresh={fetchData}
                />
              </motion.div>
            )}

            {activeRole === 'manager' && (
              <motion.div 
                key="manager"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                id="simulator-manager-role-pane"
              >
                <YardManagerView 
                  trips={trips}
                  yardStatus={yardStatus || {
                    companyName: "Ultratech Cement Yard Hub, Surat",
                    totalParkingBays: 40,
                    occupiedParkingBays: 28,
                    activeGates: 2,
                    activeLoadingBays: 4,
                    avgWaitTimeHours: 14.5,
                    currentQueueCount: 8
                  }}
                  onUpdateTrip={handleUpdateTrip}
                  onUpdateYardConfig={handleUpdateYardConfig}
                  onRefresh={fetchData}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}

      </main>

      {/* Humble Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-6 text-center text-xs text-slate-500 mt-12" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span>Milaap Yard Dignity Queue & Facilities System • Made for Indian logistics</span>
          </div>
          <div className="font-mono text-[10px]">
            <span>Active UTC: {new Date().toISOString()}</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
