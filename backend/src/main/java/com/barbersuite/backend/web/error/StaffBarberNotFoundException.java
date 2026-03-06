package com.barbersuite.backend.web.error;

public final class StaffBarberNotFoundException extends ApiNotFoundException {

  public StaffBarberNotFoundException() {
    super("NOT_FOUND", "The requested barber does not exist for this tenant.");
  }
}
