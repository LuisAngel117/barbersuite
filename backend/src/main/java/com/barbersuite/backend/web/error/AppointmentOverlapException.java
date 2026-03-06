package com.barbersuite.backend.web.error;

public final class AppointmentOverlapException extends ApiConflictException {

  public AppointmentOverlapException() {
    super(
      "APPOINTMENT_OVERLAP",
      "The barber already has an appointment in this time range."
    );
  }
}
