package com.barbersuite.backend.web.error;

public final class BranchNotFoundException extends ApiNotFoundException {

  public BranchNotFoundException() {
    super("NOT_FOUND", "The requested branch does not exist for this tenant.");
  }
}
