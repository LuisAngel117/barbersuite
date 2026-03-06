package com.barbersuite.backend.web.error;

public final class AppointmentOutsideAvailabilityException extends ApiConflictException {

  public AppointmentOutsideAvailabilityException() {
    super(
      "APPOINTMENT_OUTSIDE_AVAILABILITY",
      "Appointment is outside barber availability."
    );
  }
}
