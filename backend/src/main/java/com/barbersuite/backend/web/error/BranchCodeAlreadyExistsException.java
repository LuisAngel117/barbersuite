package com.barbersuite.backend.web.error;

public final class BranchCodeAlreadyExistsException extends ApiConflictException {

  public BranchCodeAlreadyExistsException() {
    super("CONFLICT", "Branch code already exists for this tenant.");
  }
}
