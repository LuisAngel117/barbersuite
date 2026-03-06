package com.barbersuite.backend.web.notifications;

import com.barbersuite.backend.notifications.NotificationsService;
import com.barbersuite.backend.web.notifications.dto.EmailOutboxPageResponse;
import com.barbersuite.backend.web.notifications.dto.SendTestEmailRequest;
import com.barbersuite.backend.web.notifications.dto.SendTestEmailResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications/email")
public class NotificationsEmailController {

  private final NotificationsService notificationsService;

  public NotificationsEmailController(NotificationsService notificationsService) {
    this.notificationsService = notificationsService;
  }

  @PostMapping("/test")
  @ResponseStatus(HttpStatus.ACCEPTED)
  SendTestEmailResponse enqueueTestEmail(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody SendTestEmailRequest sendTestEmailRequest
  ) {
    return notificationsService.enqueueTestEmail(jwt, sendTestEmailRequest);
  }

  @GetMapping("/outbox")
  EmailOutboxPageResponse listOutbox(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String kind,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return notificationsService.listOutbox(jwt, status, kind, from, to, page, size);
  }
}
