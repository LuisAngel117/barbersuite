package com.barbersuite.backend.web.error;

public final class ReceiptConflictException extends ApiConflictException {

  public ReceiptConflictException(String message) {
    super("CONFLICT", message);
  }
}
