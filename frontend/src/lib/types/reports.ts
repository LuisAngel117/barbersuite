export type SalesSummary = {
  from: string;
  to: string;
  currency: string;
  receiptsCount: number;
  grossSales: number;
  voidedCount: number;
  avgTicket: number;
  taxTotal: number;
  discountTotal: number;
};

export type SalesDailyItem = {
  date: string;
  receiptsCount: number;
  grossSales: number;
  taxTotal: number;
  discountTotal: number;
};

export type SalesDaily = {
  currency: string;
  items: SalesDailyItem[];
};

export type TopServiceItem = {
  serviceId: string;
  serviceName: string;
  quantity: number;
  revenue: number;
};

export type TopServices = {
  currency: string;
  items: TopServiceItem[];
};

export type AppointmentsSummary = {
  from: string;
  to: string;
  scheduledCount: number;
  checkedInCount: number;
  completedCount: number;
  cancelledCount: number;
  noShowCount: number;
  bookedMinutes: number;
};

export type BarberSummaryItem = {
  barberId: string;
  barberName: string;
  appointmentsCount: number;
  completedCount: number;
  noShowCount: number;
  bookedMinutes: number;
};

export type BarbersSummary = {
  items: BarberSummaryItem[];
};
