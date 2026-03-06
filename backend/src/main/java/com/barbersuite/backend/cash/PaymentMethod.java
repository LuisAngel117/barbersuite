package com.barbersuite.backend.cash;

import com.barbersuite.backend.web.error.ValidationErrorException;

public enum PaymentMethod {
  cash,
  card,
  transfer,
  other;

  public static PaymentMethod parse(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException("method must be a valid payment method.");
    }

    try {
      return PaymentMethod.valueOf(rawValue.trim().toLowerCase());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException("method must be a valid payment method.");
    }
  }
}
