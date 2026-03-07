export const NOTIFICATION_EMAIL_TEMPLATE_KINDS = [
  "appointment_confirmation",
  "appointment_reminder",
  "appointment_rescheduled",
  "appointment_cancelled",
] as const;

export type NotificationEmailTemplateKind =
  (typeof NOTIFICATION_EMAIL_TEMPLATE_KINDS)[number];

export type NotificationEmailTemplate = {
  id: string;
  kind: NotificationEmailTemplateKind;
  enabled: boolean;
  subjectTemplate: string;
  bodyTextTemplate: string | null;
  bodyHtmlTemplate: string | null;
  updatedAt: string;
};

export type NotificationEmailTemplatesResponse = {
  items: NotificationEmailTemplate[];
};

export type UpsertNotificationEmailTemplateRequest = {
  enabled: boolean;
  subjectTemplate: string;
  bodyTextTemplate?: string;
  bodyHtmlTemplate?: string;
};
