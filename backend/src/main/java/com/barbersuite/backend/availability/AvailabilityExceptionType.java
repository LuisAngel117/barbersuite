package com.barbersuite.backend.availability;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum AvailabilityExceptionType {
  closed,
  override;

  public static AvailabilityExceptionType parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("type must be a valid availability exception type.");
    }

    try {
      return AvailabilityExceptionType.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("type must be a valid availability exception type.");
    }
  }
}
