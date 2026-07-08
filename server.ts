import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { Trip, YardStatus, ChatMessage, FacilityBooking } from "./src/types";

dotenv.config();

// In-memory Database State
let trips: Trip[] = [
  {
    id: "trip-1",
    truckNumber: "MH-12-PQ-4567",
    driverName: "Rajesh Kumar",
    driverPhone: "+91 98765 43210",
    ownerName: "Sharma Logistics Ltd.",
    cargoType: "Portland Cement",
    cargoWeight: 25,
    source: "Nagpur, Maharashtra",
    destinationCompany: "Ultratech Yard Hub, Surat",
    distance: 560,
    status: "en_route",
    eta: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    facilityBookings: [
      { id: "b1", facilityType: "toilet", slotTime: "18:00", status: "booked", token: "T-882" }
    ]
  },
  {
    id: "trip-2",
    truckNumber: "HR-55-AB-9876",
    driverName: "Gurpreet Singh",
    driverPhone: "+91 91234 56789",
    ownerName: "Sher-E-Punjab Roadways",
    cargoType: "Structural Steel Bars",
    cargoWeight: 32,
    source: "Ludhiana, Punjab",
    destinationCompany: "Ultratech Yard Hub, Surat",
    distance: 1250,
    status: "delayed",
    eta: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
    facilityBookings: []
  },
  {
    id: "trip-3",
    truckNumber: "GJ-01-XY-3421",
    driverName: "Dinesh Patel",
    driverPhone: "+91 99887 76655",
    ownerName: "Gujarat Cargo Carrier",
    cargoType: "Fly Ash",
    cargoWeight: 28,
    source: "Mundra, Gujarat",
    destinationCompany: "Ultratech Yard Hub, Surat",
    distance: 420,
    status: "queued",
    eta: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // arrived 2 hours ago
    arrivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    queueNumber: 3,
    estimatedWaitTimeHours: 4.5,
    facilityBookings: [
      { id: "b2", facilityType: "toilet", slotTime: "15:30", status: "claimed", token: "T-114" },
      { id: "b3", facilityType: "shower", slotTime: "16:00", status: "claimed", token: "S-551" },
      { id: "b4", facilityType: "restroom", slotTime: "22:00", status: "booked", token: "R-309" }
    ]
  },
  {
    id: "trip-4",
    truckNumber: "KA-03-MN-5544",
    driverName: "Venkatesh Swamy",
    driverPhone: "+91 88776 65544",
    ownerName: "Deccan Freight Movers",
    cargoType: "Gypsum Powder",
    cargoWeight: 30,
    source: "Bellary, Karnataka",
    destinationCompany: "Ultratech Yard Hub, Surat",
    distance: 780,
    status: "loading",
    eta: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // arrived 5 hours ago
    arrivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    queueNumber: 1,
    estimatedWaitTimeHours: 0.5,
    facilityBookings: [
      { id: "b5", facilityType: "meal", slotTime: "13:00", status: "claimed", token: "M-402" }
    ]
  },
  {
    id: "trip-5",
    truckNumber: "UP-16-ZT-1122",
    driverName: "Satish Sharma",
    driverPhone: "+91 77665 54433",
    ownerName: "Noida Roadways Express",
    cargoType: "Aggregates",
    cargoWeight: 24,
    source: "Greater Noida, UP",
    destinationCompany: "Ultratech Yard Hub, Surat",
    distance: 1050,
    status: "completed",
    eta: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    arrivedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // Completed 1 hour ago
    facilityBookings: [
      { id: "b6", facilityType: "toilet", slotTime: "08:00", status: "claimed", token: "T-098" },
      { id: "b7", facilityType: "restroom", slotTime: "12:00", status: "claimed", token: "R-220" }
    ]
  }
];

let yardStatus: YardStatus = {
  companyName: "Ultratech Yard Hub, Surat",
  totalParkingBays: 40,
  occupiedParkingBays: 28,
  activeGates: 2,
  activeLoadingBays: 4,
  avgWaitTimeHours: 14.5,
  currentQueueCount: 8
};

// Map to store chats for each driver/trip id
let driverChats: Record<string, ChatMessage[]> = {
  "trip-1": [
    { id: "m1", sender: "assistant", text: "नमस्ते! मैं आपका यार्ड मित्र एआई असिस्टेंट हूँ। आपको अपनी यात्रा या यार्ड में सुविधाओं (बाथरूम, विश्राम गृह) के बारे में कोई प्रश्न पूछना है? (Hello! I am your Yard Mitr AI Assistant. Do you have questions about your journey or yard facilities?)", timestamp: new Date().toISOString() }
  ],
  "trip-3": [
    { id: "m2", sender: "assistant", text: "Welcome! Your virtual queue number is #3. Your estimated gate entry is in 4.5 hours. Your restroom booking (R-309) is active from 22:00.", timestamp: new Date().toISOString() }
  ]
};

// Lazy-initialize Gemini SDK Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get all trips
  app.get("/api/trips", (req, res) => {
    res.json(trips);
  });

  // Get specific trip
  app.get("/api/trips/:id", (req, res) => {
    const trip = trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  });

  // Create new trip
  app.post("/api/trips", (req, res) => {
    const { truckNumber, driverName, driverPhone, ownerName, cargoType, cargoWeight, source, destinationCompany, distance } = req.body;
    
    if (!truckNumber || !driverName || !driverPhone || !cargoType || !source) {
      return res.status(400).json({ error: "Missing required trip fields" });
    }

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      truckNumber,
      driverName,
      driverPhone,
      ownerName: ownerName || "Self Owned",
      cargoType,
      cargoWeight: Number(cargoWeight) || 20,
      source,
      destinationCompany: destinationCompany || "Ultratech Yard Hub, Surat",
      distance: Number(distance) || 450,
      status: "scheduled",
      eta: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // default 6h ETA
      facilityBookings: []
    };

    trips.unshift(newTrip);
    res.status(201).json(newTrip);
  });

  // Update trip status (e.g., driver starting journey, arriving, queue transition)
  app.patch("/api/trips/:id", (req, res) => {
    const { id } = req.params;
    const { status, eta } = req.body;
    
    const tripIndex = trips.findIndex(t => t.id === id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const currentTrip = trips[tripIndex];
    const updatedTrip = { ...currentTrip };

    if (status) {
      updatedTrip.status = status;
      if (status === "en_route" && !updatedTrip.startedAt) {
        updatedTrip.startedAt = new Date().toISOString();
      } else if (status === "arrived") {
        updatedTrip.arrivedAt = new Date().toISOString();
        updatedTrip.status = "queued"; // Auto transition arrived to virtual queue
        
        // Find next queue position
        const activeQueued = trips.filter(t => t.status === "queued" || t.status === "loading");
        updatedTrip.queueNumber = activeQueued.length + 1;
        updatedTrip.estimatedWaitTimeHours = updatedTrip.queueNumber * 1.5; // 1.5 hours per truck average
        
        // Update yard occupied status
        yardStatus.occupiedParkingBays = Math.min(yardStatus.totalParkingBays, yardStatus.occupiedParkingBays + 1);
        yardStatus.currentQueueCount += 1;
      } else if (status === "loading") {
        updatedTrip.queueNumber = 1; // Handled at active bay
        updatedTrip.estimatedWaitTimeHours = 0.5;
      } else if (status === "completed") {
        updatedTrip.completedAt = new Date().toISOString();
        updatedTrip.queueNumber = undefined;
        updatedTrip.estimatedWaitTimeHours = undefined;
        
        // Update yard status
        yardStatus.occupiedParkingBays = Math.max(0, yardStatus.occupiedParkingBays - 1);
        yardStatus.currentQueueCount = Math.max(0, yardStatus.currentQueueCount - 1);
      }
    }

    if (eta) {
      updatedTrip.eta = eta;
    }

    trips[tripIndex] = updatedTrip;
    res.json(updatedTrip);
  });

  // Book a facility for a trip
  app.post("/api/trips/:id/book-facility", (req, res) => {
    const { id } = req.params;
    const { facilityType, slotTime } = req.body;

    const tripIndex = trips.findIndex(t => t.id === id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: "Trip not found" });
    }

    if (!facilityType || !slotTime) {
      return res.status(400).json({ error: "Missing facility type or slot time" });
    }

    const prefix = facilityType.substring(0, 1).toUpperCase();
    const token = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;

    const newBooking: FacilityBooking = {
      id: `booking-${Date.now()}`,
      facilityType,
      slotTime,
      status: "booked",
      token
    };

    trips[tripIndex].facilityBookings.push(newBooking);
    res.status(201).json(trips[tripIndex]);
  });

  // Claim or cancel a facility booking
  app.patch("/api/trips/:id/bookings/:bookingId", (req, res) => {
    const { id, bookingId } = req.params;
    const { status } = req.body;

    const tripIndex = trips.findIndex(t => t.id === id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const bookings = trips[tripIndex].facilityBookings;
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    if (bookingIndex === -1) {
      return res.status(404).json({ error: "Booking not found" });
    }

    bookings[bookingIndex].status = status;
    res.json(trips[tripIndex]);
  });

  // Get yard status
  app.get("/api/yard", (req, res) => {
    res.json(yardStatus);
  });

  // Update yard configuration
  app.patch("/api/yard", (req, res) => {
    const { totalParkingBays, occupiedParkingBays, activeGates, activeLoadingBays, avgWaitTimeHours } = req.body;
    
    if (totalParkingBays !== undefined) yardStatus.totalParkingBays = totalParkingBays;
    if (occupiedParkingBays !== undefined) yardStatus.occupiedParkingBays = occupiedParkingBays;
    if (activeGates !== undefined) yardStatus.activeGates = activeGates;
    if (activeLoadingBays !== undefined) yardStatus.activeLoadingBays = activeLoadingBays;
    if (avgWaitTimeHours !== undefined) yardStatus.avgWaitTimeHours = avgWaitTimeHours;

    res.json(yardStatus);
  });

  // Get chats for a specific trip/driver
  app.get("/api/chats/:tripId", (req, res) => {
    const { tripId } = req.params;
    res.json(driverChats[tripId] || []);
  });

  // Send message & get Gemini AI response
  app.post("/api/chats/:tripId", async (req, res) => {
    const { tripId } = req.params;
    const { text, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Message text required" });
    }

    // Save user message
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "driver",
      text,
      timestamp: new Date().toISOString(),
      language: language || "English"
    };

    if (!driverChats[tripId]) {
      driverChats[tripId] = [];
    }
    driverChats[tripId].push(userMsg);

    const trip = trips.find(t => t.id === tripId);
    const queuePos = trip?.queueNumber ? `#${trip.queueNumber}` : "Not in queue yet";
    const waitTime = trip?.estimatedWaitTimeHours ? `${trip.estimatedWaitTimeHours} hours` : "N/A";
    const facilities = trip?.facilityBookings.map(b => `${b.facilityType} (${b.slotTime}, token: ${b.token}, status: ${b.status})`).join(", ") || "None";

    const systemInstruction = `
      You are "Yard Mitr" (Yard Friend), an exceptionally compassionate, helpful, and street-smart AI Assistant created to support truck drivers in India waiting in long lines at manufacturing & unloading yards.
      The driver speaking to you might be tired, frustrated, and waiting for several days on the roadside in difficult conditions.
      
      CRITICAL INFORMATION ABOUT THIS DRIVER:
      - Driver Name: ${trip?.driverName || "Driver"}
      - Truck: ${trip?.truckNumber || "N/A"}
      - Current Location Status: ${trip?.status || "Unknown"}
      - Queue Position: ${queuePos}
      - Estimated wait: ${waitTime}
      - Booked facilities on app: ${facilities}
      - Destination: ${trip?.destinationCompany || yardStatus.companyName}
      
      YARD FACILITIES AVAILABLE TO BOOK:
      - Hygienic Clean Washrooms/Toilets (Water supply checked, separate blocks for men/women)
      - Hot Showers (Sector A Rest Block)
      - Drivers Rest Shelter (Air-cooled overnight dorm sleeping berths, power charging points, clean drinking water RO)
      - Hot Meal Canteen (Authentic local food like Dal, Roti, Chawal at low subsidized rates)
      
      YOUR GUIDELINES:
      1. Always respond in a polite, highly respectful tone, acknowledging the driver's hard work ("Ustad ji" or "Bhaiya" or "Gurpreet ji" based on their name).
      2. If the user asks in Hindi, reply in clear, friendly, and easy-to-understand Hindi (using Devnagari script). If they ask in any other language, reply in that language or simple English mixed with their regional vocabulary.
      3. Give precise answers. If they complain about facilities, tell them they can book toilets, showers, and sleeping beds directly via the app tabs and get a fast token!
      4. Keep answers short, practical, and highly empathetic. Suggest rest, food, and washroom sanitation to preserve their dignity during the wait.
    `;

    try {
      const client = getGeminiClient();
      if (client) {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: text,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });

        const aiText = response.text || "Sorry, I could not generate a response. Please try again.";
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: "assistant",
          text: aiText,
          timestamp: new Date().toISOString()
        };
        driverChats[tripId].push(assistantMsg);
        return res.json({ messages: driverChats[tripId], hasKey: true });
      } else {
        // Fallback simulation when no API key is specified
        let fallbackText = "नमस्ते उस्ताद जी! मैं आपकी सेवा में हाज़िर हूँ। आपकी गाड़ी का नंबर " + (trip?.truckNumber || "N/A") + " है। ";
        if (text.toLowerCase().includes("toilet") || text.includes("बाथरूम") || text.includes("टॉयलेट") || text.includes("shauchalay")) {
          fallbackText += "यार्ड में साफ़-सुथरे शौचालय ब्लॉक सेक्टर B के पास हैं। आप ऊपर 'Facilities' बटन दबाकर टाइम स्लॉट बुक कर सकते हैं, जिससे आपको लाइन में नहीं खड़ा होना पड़ेगा। पानी की पूरी व्यवस्था है।";
        } else if (text.toLowerCase().includes("sleep") || text.includes("सोने") || text.includes("rest") || text.includes("विश्राम")) {
          fallbackText += "ड्राइवर भाइयों के लिए कूलर और पीने के पानी (RO) से लैस विश्राम गृह उपलब्ध है। आप विश्राम गृह में सोने की सीट बुक कर सकते हैं ताकि रात को सुरक्षित सो सकें।";
        } else if (text.toLowerCase().includes("queue") || text.includes("नंबर") || text.includes("लाइन") || text.includes("वेटिंग")) {
          fallbackText += `आपकी गाड़ी वर्तमान में नंबर ${queuePos} पर है। संभावित गेट एंट्री ${waitTime} में होगी। यार्ड की प्रक्रिया जारी है, कृपया सब्र रखें और आराम करें।`;
        } else {
          fallbackText += "मुझे आपकी समस्या समझ आई। यात्रा और यार्ड के संबंध में साफ़ पानी, गर्म खाना, नहाने और सोने की सारी व्यवस्था इस ऐप में उपलब्ध है। क्या मैं आपके लिए शौचालय या सोने का स्लॉट बुक करने में मदद करूँ?";
        }

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: "assistant",
          text: fallbackText + "\n\n*(Note: Gemini AI is running in offline demo mode. Configure your API key in Settings > Secrets to enable the live smart multilingual agent.)*",
          timestamp: new Date().toISOString()
        };
        driverChats[tripId].push(assistantMsg);
        return res.json({ messages: driverChats[tripId], hasKey: false });
      }
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      // Fallback response with error message
      const errorFallback: ChatMessage = {
        id: `msg-${Date.now()}-ai-error`,
        sender: "assistant",
        text: `Error connecting to Gemini: ${err.message || err}. Generating local assistance: Please use the app options to book clean washrooms or track queue position.`,
        timestamp: new Date().toISOString()
      };
      driverChats[tripId].push(errorFallback);
      res.json({ messages: driverChats[tripId], error: err.message });
    }
  });

  // AI-Powered Yard Logistics Report
  app.post("/api/gemini/report", async (req, res) => {
    const queueData = trips.filter(t => t.status === "queued" || t.status === "loading" || t.status === "delayed");
    const activeTripsSummary = queueData.map(t => {
      return `Truck: ${t.truckNumber} | Cargo: ${t.cargoType} (${t.cargoWeight} tons) | Status: ${t.status} | ETA/Arrival: ${t.eta} | Wait: ${t.estimatedWaitTimeHours || 0} hours | Driver: ${t.driverName} | Facility Bookings: ${t.facilityBookings.length}`;
    }).join("\n");

    const prompt = `
      You are an expert logistics consultant specializing in factory yard management, dispatch scheduling, and truck driver welfare in India.
      Analyze the following live yard state and generate a concise, highly strategic "Yard Efficiency & Driver Welfare Diagnostic Report" in English.
      
      YARD STATISTICS:
      - Company: ${yardStatus.companyName}
      - Total Parking Bay Capacity: ${yardStatus.totalParkingBays}
      - Occupied Parking Bays: ${yardStatus.occupiedParkingBays}
      - Active Entry/Exit Gates: ${yardStatus.activeGates}
      - Active Unloading/Loading Bays: ${yardStatus.activeLoadingBays}
      - Current Queue Size: ${yardStatus.currentQueueCount}
      - Historical Avg Wait Time: ${yardStatus.avgWaitTimeHours} hours
      
      ACTIVE TRUCK LIST DETAILS:
      ${activeTripsSummary}
      
      PROVIDE A STRUCTURED MARKDOWN REPORT ADDRESSING:
      1. **Current Bottlenecks**: Assess why drivers are waiting up to ${yardStatus.avgWaitTimeHours} hours. Look at gate entry rates, cargo types, and yard capacity.
      2. **Driver Welfare Vulnerability Index**: Drivers are waiting several days in high heat with limited resting options. Highlight that restrooms and hygienic toilets must be allocated dynamically.
      3. **Actionable Dynamic Arrival Optimization Suggestions**: Provide concrete scheduling actions. Recommend shifting specific truck arrivals (e.g. steel, fly ash) based on load-type processing speeds. Suggest parking bay allocations.
      4. **Immediate Remedial Countermeasures**: E.g., Open a temporary gate, activate secondary shifts at the bays, increase sanitation check frequency, or award priority tokens.
      
      Keep the report highly analytical, professional, and practical. Write directly in markdown.
    `;

    try {
      const client = getGeminiClient();
      if (client) {
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            temperature: 0.6
          }
        });
        return res.json({ report: response.text, hasKey: true });
      } else {
        // Simulation when no API key is specified
        const demoReport = `
# Yard Efficiency & Driver Welfare Diagnostic Report

## 1. Current Bottlenecks & Throughput Constraints
- **Gate Congestion**: Operating only ${yardStatus.activeGates} active gates for a volume of ${yardStatus.currentQueueCount} trucks currently awaiting unloading. This creates a severe choke point at the main entrance.
- **Unloading Bay Imbalance**: Different load types (e.g., Cement vs. Fly Ash) require varied unloading times. Cement requires manual unloading which is slower, while bulk raw materials are dumped faster. A lack of specialized bay separation causes general yard lockups.
- **Extended Waiting Periods**: The average historical wait of **${yardStatus.avgWaitTimeHours} hours** represents a heavy capital idle time for truck owners and immense exhaustion for drivers.

## 2. Driver Welfare Vulnerability Index (CRITICAL)
- **Extreme Overnight Fatigue**: With drivers waiting up to 3 days, sleeping in non-air-conditioned truck cabins on dusty access roads creates safety and health hazards. 
- **Sanitation Strain**: Out of the active trucks, multiple drivers are waiting without basic facilities. Encouraging virtual scheduling and booking facility time slots (e.g., Washrooms Block A) reduces on-road sanitation issues.
- **Subsidized Nutritional Deficit**: Lack of clean drinking water and hygienic food forces drivers to rely on expensive, unhygienic roadside stalls.

## 3. Dynamic Arrival Optimization Solutions (AI Recommendation)
- **Pre-Arrival Slots**: Implement a 48-hour advanced registration schedule. Trucks like **HR-55-AB-9876** carrying heavy Structural Steel should be assigned a specific morning gate-entry slot (e.g., 08:00 - 10:00 AM) to avoid peak cement congestion.
- **Staggered En-Route Adjustments**: Send delay flags to trucks that are still far away (e.g., **trip-1** en route from Nagpur), instructing them to pace their speed or rest at verified highway dhabas rather than lining up at the factory gate.

## 4. Immediate Actionable Countermeasures
1. **Activate Gate 3**: Re-allocate administrative staff to open a 3rd gate to clear the current backlog immediately.
2. **Dynamic Toilet Tokening**: Award priority queue points to drivers who pre-book clean toilet slots, keeping the roadside clean and improving driver hygiene index.
3. **Subsidized Canteen Vouchers**: Provide digital meal tokens directly to drivers during their virtual queue status so they can eat safe meals inside the yard complex.

*(Note: This report is a detailed simulation of our dynamic AI analytics engine. To activate live Gemini analysis of your live yard traffic, please configure your GEMINI_API_KEY in the Secrets panel.)*
        `;
        return res.json({ report: demoReport, hasKey: false });
      }
    } catch (err: any) {
      console.error("Gemini Report API Error:", err);
      res.status(500).json({ error: err.message || "Failed to generate report" });
    }
  });

  // Vite Middleware Setup (Development vs Production)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
