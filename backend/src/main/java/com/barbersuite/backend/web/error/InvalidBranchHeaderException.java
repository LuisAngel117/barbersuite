package com.barbersuite.backend.web.error;

import com.barbersuite.backend.web.RequestHeaderNames;

public final class InvalidBranchHeaderException extends ApiBadRequestException {

  public InvalidBranchHeaderException(String rawValue) {
    super(
      "VALIDATION_ERROR",
      "Header " + RequestHeaderNames.BRANCH_ID + " must be a valid UUID."
    );
  }
}
