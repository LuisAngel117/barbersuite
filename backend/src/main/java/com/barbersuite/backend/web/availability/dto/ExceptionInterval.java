package com.barbersuite.backend.web.availability.dto;

import jakarta.validation.constraints.NotBlank;

public record ExceptionInterval(
  @NotBlank String start,
  @NotBlank String end
) {
}
