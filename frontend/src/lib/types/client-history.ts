export type ClientHistoryClient = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  active: boolean;
  createdAt: string;
};

export type ClientHistoryAppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type ClientHistoryAppointment = {
  id: string;
  status: ClientHistoryAppointmentStatus;
  startAt: string;
  endAt: string;
  barberId: string;
  barberName: string;
  serviceId: string;
  serviceName: string;
};

export type ClientHistoryReceiptStatus = "issued" | "voided";

export type ClientHistoryReceipt = {
  id: string;
  number: string;
  status: ClientHistoryReceiptStatus;
  issuedAt: string;
  total: number;
};

export type ClientHistoryStats = {
  totalVisits: number;
  noShows: number;
  totalSpend: number;
};

export type ClientHistoryResponse = {
  client: ClientHistoryClient;
  appointments: ClientHistoryAppointment[];
  receipts: ClientHistoryReceipt[];
  stats: ClientHistoryStats;
};
