export type ReceiptStatus = "issued" | "voided";

export type PaymentMethod = "cash" | "card" | "transfer" | "other";

export type ReceiptItem = {
  id: string;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
};

export type Receipt = {
  id: string;
  number: string;
  status: ReceiptStatus;
  clientId?: string | null;
  appointmentId?: string | null;
  issuedAt: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  items: ReceiptItem[];
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
};

export type ReceiptPage = {
  items: Receipt[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type CreateReceiptItemRequest = {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type CreateReceiptPaymentRequest = {
  method: PaymentMethod;
  amount: number;
  reference?: string;
};

export type CreateReceiptRequest = {
  clientId?: string;
  appointmentId?: string;
  notes?: string;
  discount?: number;
  tax?: number;
  items: CreateReceiptItemRequest[];
  payments: CreateReceiptPaymentRequest[];
};

export type VoidReceiptRequest = {
  reason: string;
};
