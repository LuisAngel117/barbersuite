package com.barbersuite.backend.web.auth;

public record LoginResponse(
  String accessToken,
  String tokenType,
  long expiresIn
) {
}
