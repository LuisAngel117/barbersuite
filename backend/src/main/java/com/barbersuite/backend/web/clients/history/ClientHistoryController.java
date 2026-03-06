package com.barbersuite.backend.web.clients.history;

import com.barbersuite.backend.clients.history.ClientHistoryService;
import com.barbersuite.backend.web.branch.BranchRequired;
import com.barbersuite.backend.web.clients.history.dto.ClientHistoryResponse;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/clients/{clientId}/history")
public class ClientHistoryController {

  private final ClientHistoryService clientHistoryService;

  public ClientHistoryController(ClientHistoryService clientHistoryService) {
    this.clientHistoryService = clientHistoryService;
  }

  @GetMapping
  ClientHistoryResponse getHistory(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID clientId,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(required = false) Integer limit
  ) {
    return clientHistoryService.getHistory(jwt, clientId, from, to, limit);
  }
}
