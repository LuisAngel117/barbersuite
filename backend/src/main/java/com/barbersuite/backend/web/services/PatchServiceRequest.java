package com.barbersuite.backend.web.services;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PatchServiceRequest(
  @Size(min = 2) String name,
  @Min(5) @Max(480) Integer durationMinutes,
  @DecimalMin("0.00") BigDecimal price,
  Boolean active
) {
}
