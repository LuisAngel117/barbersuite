package com.barbersuite.backend.notifications;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum EmailKind {
  appointment_confirmation,
  appointment_reminder;

  public static EmailKind parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("kind must be a valid email kind.");
    }

    try {
      return EmailKind.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("kind must be a valid email kind.");
    }
  }
}
