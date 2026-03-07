package com.barbersuite.backend.web.notificationsconfig.dto;

import com.barbersuite.backend.notifications.EmailKind;
import java.time.Instant;
import java.util.UUID;

public record NotificationEmailTemplateResponse(
  UUID id,
  EmailKind kind,
  boolean enabled,
  String subjectTemplate,
  String bodyTextTemplate,
  String bodyHtmlTemplate,
  Instant updatedAt
) {
}
