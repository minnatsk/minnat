export type TripStatus = 'scheduled' | 'en_route' | 'delayed' | 'arrived' | 'queued' | 'loading' | 'completed';

export interface Trip {
  id: string;
  truckNumber: string;
  driverName: string;
  driverPhone: string;
  ownerName: string;
  cargoType: string;
  cargoWeight: number; // tons
  source: string;
  destinationCompany: string;
  distance: number; // km
  status: TripStatus;
  eta: string; // ISO string
  startedAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  queueNumber?: number;
  estimatedWaitTimeHours?: number;
  facilityBookings: FacilityBooking[];
}

export interface FacilityBooking {
  id: string;
  facilityType: 'toilet' | 'shower' | 'restroom' | 'meal';
  slotTime: string;
  status: 'booked' | 'claimed' | 'cancelled';
  token: string;
}

export interface YardStatus {
  companyName: string;
  totalParkingBays: number;
  occupiedParkingBays: number;
  activeGates: number;
  activeLoadingBays: number;
  avgWaitTimeHours: number;
  currentQueueCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'driver' | 'assistant';
  text: string;
  timestamp: string;
  language?: string;
}

export interface FleetStats {
  totalTrucks: number;
  enRouteCount: number;
  queuedCount: number;
  avgWaitTimeHours: number;
  totalDetentionCharges: number; // in INR
}
