package com.barbersuite.backend.appointments;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum AppointmentStatus {
  scheduled,
  checked_in,
  completed,
  cancelled,
  no_show;

  public static AppointmentStatus parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("status must be a valid appointment status.");
    }

    try {
      return AppointmentStatus.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("status must be a valid appointment status.");
    }
  }
}
