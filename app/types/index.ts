// app/types/index.ts (обновленный)
export interface ObjectData {
  id: string;
  address: string;
  status: string;
  statusColor: string;
  borderColor: string;
  responsible: string;
  stages: { number: string; description: string }[];
  errorText?: string;
  isPlanned?: boolean;
  jobshiftPresent?: boolean;
  notesCount?: number;
  warnsCount?: number;
  activeJobs?: ActiveJob[];
  latitude: number;
  longitude: number;
}

export interface ActiveJob {
  id: string;
  name: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  volume?: number;
  measurement?: string;
  seq?: number;
}

export interface ApiComment {
  id: number;
  comment: string;
  created_at: string;
  type: number;
  rec_type: number;
  author?: {
    id: number;
    name: string;
    surname: string;
    patronym?: string;
  };
  docs?: string;
  fix_time?: number;
  state: number;
}

export interface ApiJobShift {
  id: number;
  comment: string;
  created_at: string;
  creator_name: string;
  new_start_date: string;
  new_end_date: string;
  old_start_date: string;
  old_end_date: string;
}

export interface ApiUser {
  id: number;
  name: string;
  surname: string;
  patronym?: string;
  role: number;
  username: string;
}

export interface ApiObjectDetails {
  id: number;
  sitename: string;
  state: number;
  foreman_name: string;
  manager_name: string;
  start_date: string;
  active_jobs: any[];
  comments: ApiComment[];
  jobshifts: ApiJobShift[];
  users: ApiUser[];
  notes_count: number;
  warns_count: number;
  jobshift_present: boolean;
  coordinates: PolygonPoint[][][];
  geo_data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}
// interface ActiveJob {
//   id: string;
//   name: string;
//   description?: string;
//   status?: string;
// }

export interface WarehouseMaterial {
  id: string;
  name: string;
  balance: number;
  used: number;
  total: number;
  history: WarehouseHistoryItem[];
  unit: string;
}

export interface WarehouseHistoryItem {
  id: string;
  date: string;
  workDescription: string;
  usedAmount: number;
  deliveryAmount: number;
}

export interface Violation {
  id: string;
  category: string;
  type: string;
  subType: string;
  deadline: string;
  comment: string;
  dateRecorded: string;
  requiresStop: boolean;
  issuedBy: string;
  presenceOf: string;
  stage: { number: string; description: string };
  isViolation: boolean;
}

export interface Inspector {
  id: string;
  name: string;
  position: string;
}

export interface ObjectDetails extends ObjectData {
  violations: Violation[];
  inspectors: Inspector[];
  workAct: string;
  workSchedule: string;
  proposedChanges: string;
  fullSchedule: string;
  warehouse: WarehouseMaterial[];
  coordinates: PolygonPoint[][][];
}

export interface DeliveryHistoryItem {
  id: string;
  date: string;
  invoiceNumber: string;
  supplierCompany: string;
  materials: {
    name: string;
    quantity: string;
    serialNumber?: string;
    document?: string;
  }[];
  packagingCondition: string;
  comment?: string;
}

export interface PolygonPoint {
  latitude: number,
  longitude: number
}
