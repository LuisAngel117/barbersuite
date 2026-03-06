package com.barbersuite.backend.web.error;

public final class InvalidTimeZoneException extends ApiBadRequestException {

  public InvalidTimeZoneException() {
    super("VALIDATION_ERROR", "timeZone must be a valid IANA time zone.");
  }
}
