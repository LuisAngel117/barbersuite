package com.barbersuite.backend.web.notifications.dto;

import com.barbersuite.backend.notifications.EmailOutboxStatus;
import java.util.UUID;

public record SendTestEmailResponse(UUID outboxId, EmailOutboxStatus status) {
}
