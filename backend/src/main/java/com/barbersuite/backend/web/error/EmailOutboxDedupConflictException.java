package com.barbersuite.backend.web.error;

public final class EmailOutboxDedupConflictException extends ApiConflictException {

  public EmailOutboxDedupConflictException() {
    super("CONFLICT", "An identical email is already pending in the outbox.");
  }
}
