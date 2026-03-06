package com.barbersuite.backend.web.error;

public final class BranchForbiddenException extends ApiForbiddenException {

  public BranchForbiddenException() {
    super(
      "BRANCH_FORBIDDEN",
      "The authenticated user does not have access to the requested branch."
    );
  }
}
