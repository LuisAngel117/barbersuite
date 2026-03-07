package com.barbersuite.backend.web.notificationsconfig;

import com.barbersuite.backend.notifications.EmailKind;
import com.barbersuite.backend.notificationsconfig.NotificationEmailTemplatesService;
import com.barbersuite.backend.web.notificationsconfig.dto.NotificationEmailTemplateResponse;
import com.barbersuite.backend.web.notificationsconfig.dto.NotificationEmailTemplatesResponse;
import com.barbersuite.backend.web.notificationsconfig.dto.UpsertNotificationEmailTemplateRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/email/templates")
public class NotificationsEmailTemplatesController {

  private final NotificationEmailTemplatesService notificationEmailTemplatesService;

  public NotificationsEmailTemplatesController(
    NotificationEmailTemplatesService notificationEmailTemplatesService
  ) {
    this.notificationEmailTemplatesService = notificationEmailTemplatesService;
  }

  @GetMapping
  NotificationEmailTemplatesResponse listTemplates(@AuthenticationPrincipal Jwt jwt) {
    return new NotificationEmailTemplatesResponse(
      notificationEmailTemplatesService.listEffectiveTemplates(tenantId(jwt)).stream()
        .map(this::toResponse)
        .toList()
    );
  }

  @PutMapping("/{kind}")
  NotificationEmailTemplateResponse upsertTemplate(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable String kind,
    @Valid @RequestBody UpsertNotificationEmailTemplateRequest request
  ) {
    return toResponse(notificationEmailTemplatesService.upsertTemplate(
      tenantId(jwt),
      EmailKind.parse(kind),
      request.enabled(),
      request.subjectTemplate(),
      request.bodyTextTemplate(),
      request.bodyHtmlTemplate()
    ));
  }

  private NotificationEmailTemplateResponse toResponse(
    NotificationEmailTemplatesService.EffectiveNotificationEmailTemplate template
  ) {
    return new NotificationEmailTemplateResponse(
      template.id(),
      template.kind(),
      template.enabled(),
      template.subjectTemplate(),
      template.bodyTextTemplate(),
      template.bodyHtmlTemplate(),
      template.updatedAt()
    );
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }
}
