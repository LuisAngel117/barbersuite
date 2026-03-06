package com.barbersuite.backend.web.notifications.dto;

import com.barbersuite.backend.notifications.EmailKind;
import com.barbersuite.backend.notifications.EmailOutboxStatus;
import java.time.Instant;
import java.util.UUID;

public record EmailOutboxItemResponse(
  UUID id,
  EmailKind kind,
  EmailOutboxStatus status,
  String toEmail,
  String subject,
  Instant scheduledAt,
  Instant sentAt,
  int attempts,
  String lastError,
  Instant createdAt
) {
}
