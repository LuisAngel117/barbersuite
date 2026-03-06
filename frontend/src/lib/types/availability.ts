export type WeeklyInterval = {
  dayOfWeek: number;
  start: string;
  end: string;
};

export type AvailabilityExceptionType = "closed" | "override";

export type AvailabilityExceptionInterval = {
  start: string;
  end: string;
};

export type AvailabilityException = {
  date: string;
  type: AvailabilityExceptionType;
  note?: string | null;
  intervals?: AvailabilityExceptionInterval[];
};

export type AvailabilityBarber = {
  barberId: string;
  barberName: string;
  weekly: WeeklyInterval[];
  exceptions: AvailabilityException[];
};

export type AvailabilityBarbersResponse = {
  items: AvailabilityBarber[];
};

export type PutAvailabilityRequest = {
  weekly: WeeklyInterval[];
  exceptions: AvailabilityException[];
};

export type AvailabilitySlotsBarber = {
  barberId: string;
  barberName: string;
  slots: string[];
};

export type AvailabilitySlotsResponse = {
  timeZone: string;
  items: AvailabilitySlotsBarber[];
};
