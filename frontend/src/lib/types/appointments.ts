export type BarberItem = {
  id: string;
  fullName: string;
  active: boolean;
};

export type BarbersResponse = {
  items: BarberItem[];
};

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  clientId: string;
  barberId: string;
  serviceId: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentsResponse = {
  items: Appointment[];
};

export type CreateAppointmentRequest = {
  clientId: string;
  barberId: string;
  serviceId: string;
  startAtLocal: string;
  durationMinutes?: number;
  notes?: string;
};

export type PatchAppointmentRequest = {
  startAtLocal?: string;
  durationMinutes?: number;
  status?: AppointmentStatus;
  notes?: string;
};
