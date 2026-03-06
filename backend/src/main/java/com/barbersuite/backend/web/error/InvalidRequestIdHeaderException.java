package com.barbersuite.backend.web.error;

import com.barbersuite.backend.web.RequestHeaderNames;

public final class InvalidRequestIdHeaderException extends ApiBadRequestException {

  public InvalidRequestIdHeaderException() {
    super(
      "VALIDATION_ERROR",
      "Header " + RequestHeaderNames.REQUEST_ID + " must be non-empty and at most 100 characters."
    );
  }
}
