package com.barbersuite.backend.cash;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum ReceiptStatus {
  issued,
  voided;

  public static ReceiptStatus parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("status must be a valid receipt status.");
    }

    try {
      return ReceiptStatus.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("status must be a valid receipt status.");
    }
  }
}
