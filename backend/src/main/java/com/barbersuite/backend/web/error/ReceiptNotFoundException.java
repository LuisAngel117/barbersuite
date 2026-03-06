package com.barbersuite.backend.web.error;

public final class ReceiptNotFoundException extends ApiNotFoundException {

  public ReceiptNotFoundException() {
    super("NOT_FOUND", "Receipt was not found.");
  }
}
