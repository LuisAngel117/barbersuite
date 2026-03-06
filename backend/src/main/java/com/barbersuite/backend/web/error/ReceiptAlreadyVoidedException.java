package com.barbersuite.backend.web.error;

public final class ReceiptAlreadyVoidedException extends ApiConflictException {

  public ReceiptAlreadyVoidedException() {
    super("CONFLICT", "Receipt is already voided.");
  }
}
