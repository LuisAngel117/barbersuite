package com.barbersuite.backend.web.error;

public final class BarberNotFoundException extends ApiNotFoundException {

  public BarberNotFoundException() {
    super("NOT_FOUND", "Barber was not found for the current branch.");
  }
}
