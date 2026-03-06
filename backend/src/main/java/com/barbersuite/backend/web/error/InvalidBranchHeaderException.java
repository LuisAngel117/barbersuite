package com.barbersuite.backend.web.error;

import com.barbersuite.backend.web.RequestHeaderNames;

public final class InvalidBranchHeaderException extends ApiBadRequestException {

  public InvalidBranchHeaderException(String rawValue) {
    super(
      "INVALID_BRANCH_ID",
      "Header " + RequestHeaderNames.BRANCH_ID + " must be a valid UUID: " + rawValue
    );
  }
}
