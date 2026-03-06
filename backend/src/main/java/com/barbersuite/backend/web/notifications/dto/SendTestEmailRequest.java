package com.barbersuite.backend.web.notifications.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SendTestEmailRequest(
  @NotBlank @Email String toEmail,
  @NotBlank @Size(min = 2, max = 200) String subject,
  @Size(max = 20000) String bodyText,
  @Size(max = 20000) String bodyHtml
) {
  @AssertTrue(message = "At least one of bodyText or bodyHtml is required.")
  public boolean isBodyPresent() {
    return hasText(bodyText) || hasText(bodyHtml);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
