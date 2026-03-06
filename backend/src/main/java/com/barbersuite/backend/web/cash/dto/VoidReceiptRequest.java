package com.barbersuite.backend.web.cash.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VoidReceiptRequest(@NotBlank @Size(min = 2) String reason) {
}
