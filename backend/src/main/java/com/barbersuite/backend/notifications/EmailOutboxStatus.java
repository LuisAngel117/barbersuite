package com.barbersuite.backend.notifications;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum EmailOutboxStatus {
  pending,
  sent,
  failed,
  cancelled;

  public static EmailOutboxStatus parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("status must be a valid email outbox status.");
    }

    try {
      return EmailOutboxStatus.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("status must be a valid email outbox status.");
    }
  }
}
