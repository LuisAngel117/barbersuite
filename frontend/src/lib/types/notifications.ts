import type { NotificationEmailTemplateKind } from "@/lib/types/notification-templates";

export type EmailOutboxStatus = "pending" | "sent" | "failed" | "cancelled";
export type EmailKind = NotificationEmailTemplateKind;

export type EmailOutboxItem = {
  id: string;
  kind: EmailKind;
  status: EmailOutboxStatus;
  toEmail: string;
  subject: string;
  scheduledAt: string;
  sentAt: string | null;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

export type EmailOutboxPage = {
  items: EmailOutboxItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type SendTestEmailRequest = {
  toEmail: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
};

export type SendTestEmailResponse = {
  outboxId: string;
  status: "pending";
};
