export type StaffBranchSummary = {
  id: string;
  name: string;
  code: string;
  active: boolean;
};

export type StaffServiceSummary = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  active: boolean;
};

export type BarberListItem = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  active: boolean;
  branches: StaffBranchSummary[];
};

export type BarberListResponse = {
  items: BarberListItem[];
};

export type BarberDetail = BarberListItem & {
  services: StaffServiceSummary[];
};

export type CreateBarberRequest = {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  branchIds: string[];
  serviceIds?: string[];
  active?: boolean;
};

export type PatchBarberRequest = {
  fullName?: string;
  phone?: string;
  active?: boolean;
  branchIds?: string[];
  serviceIds?: string[];
  password?: string;
};
