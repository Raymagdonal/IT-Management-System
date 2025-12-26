
export enum TaskStatus {
  PENDING = 'Pending',
  WAITING_PURCHASE = 'Waiting Purchase',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled'
}

export enum TicketType {
  REPAIR = 'Repair',
  PURCHASE = 'Purchase'
}

export enum LocationCategory {
  SHIP = 'Ship',
  PORT = 'Port',
  OFFICE = 'Office',
  SHIPYARD = 'Shipyard',
  WAT_RAJSINGKORN = 'Wat Rajsingkorn',
  GAS_STATION = 'Gas Station'
}

export interface WorkLog {
  id: string;
  date: string;
  time: string;
  staffName: string;
  location: string;
  taskDescription: string;
  status: TaskStatus;
}

export interface Ticket {
  id: string;
  type: TicketType;
  subject: string;
  details: string;
  location: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  requesterName?: string;
  requesterPosition?: string;
  companyName?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
  isVatInclusive?: boolean;
}

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  locationCategory: LocationCategory;
  locationName: string;
  position?: string;
  description?: string;
  status: 'Active' | 'Maintenance' | 'Retired' | 'Lost';
  lastChecked: string;
  staffName: string;
  imageUrl?: string;
}

export interface InspectionImage {
  id: string;
  label: string;
  url: string | null;
  status?: 'Normal' | 'Broken' | 'Lost' | 'Claiming' | 'WaitingPurchase';
  details?: string;
}

export interface ShipInspection {
  id: string;
  shipName: string;
  date: string;
  inspector: string;
  images: InspectionImage[];
}

export interface AppData {
  workLogs: WorkLog[];
  tickets: Ticket[];
  assets: Asset[];
  shipInspections: ShipInspection[];
}
