package com.barbersuite.backend.web.services;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateServiceRequest(
  @NotBlank @Size(min = 2) String name,
  @NotNull @Min(5) @Max(480) Integer durationMinutes,
  @NotNull @DecimalMin("0.00") BigDecimal price
) {
}
