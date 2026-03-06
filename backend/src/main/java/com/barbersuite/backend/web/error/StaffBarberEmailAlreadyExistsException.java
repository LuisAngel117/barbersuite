package com.barbersuite.backend.web.error;

public final class StaffBarberEmailAlreadyExistsException extends ApiConflictException {

  public StaffBarberEmailAlreadyExistsException() {
    super("CONFLICT", "Barber email already exists.");
  }
}
