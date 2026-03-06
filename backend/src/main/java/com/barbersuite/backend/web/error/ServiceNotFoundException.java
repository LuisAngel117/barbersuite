package com.barbersuite.backend.web.error;

public final class ServiceNotFoundException extends ApiNotFoundException {

  public ServiceNotFoundException() {
    super("NOT_FOUND", "The requested service does not exist for this tenant.");
  }
}
