package com.barbersuite.backend.web.notificationsconfig.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertNotificationEmailTemplateRequest(
  boolean enabled,
  @NotBlank @Size(min = 2) String subjectTemplate,
  String bodyTextTemplate,
  String bodyHtmlTemplate
) {
  @AssertTrue(message = "At least one of bodyTextTemplate or bodyHtmlTemplate is required.")
  public boolean isBodyPresent() {
    return hasText(bodyTextTemplate) || hasText(bodyHtmlTemplate);
  }

  private boolean hasText(String value) {
    return value != null && !value.isBlank();
  }
}
