package com.barbersuite.backend.web.error;

import com.barbersuite.backend.web.RequestHeaderNames;

public final class BranchRequiredException extends ApiBadRequestException {

  public BranchRequiredException() {
    super(
      "BRANCH_REQUIRED",
      "Header " + RequestHeaderNames.BRANCH_ID + " is required for this endpoint."
    );
  }
}
