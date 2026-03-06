package com.barbersuite.backend.web.error;

public final class AppointmentNotFoundException extends ApiNotFoundException {

  public AppointmentNotFoundException() {
    super("NOT_FOUND", "Appointment was not found for the current branch.");
  }
}
