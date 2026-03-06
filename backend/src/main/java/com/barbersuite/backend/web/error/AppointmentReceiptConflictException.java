package com.barbersuite.backend.web.error;

public final class AppointmentReceiptConflictException extends ApiConflictException {

  public AppointmentReceiptConflictException() {
    super("CONFLICT", "Appointment already has an issued receipt.");
  }
}
