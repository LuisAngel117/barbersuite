package com.barbersuite.backend.web.error;

public final class ClientNotFoundException extends ApiNotFoundException {

  public ClientNotFoundException() {
    super("NOT_FOUND", "Client was not found for the current branch.");
  }
}
