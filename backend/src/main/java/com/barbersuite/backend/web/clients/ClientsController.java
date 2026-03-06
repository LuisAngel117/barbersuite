package com.barbersuite.backend.web.clients;

import com.barbersuite.backend.clients.ClientsService;
import com.barbersuite.backend.web.branch.BranchRequired;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/clients")
public class ClientsController {

  private final ClientsService clientsService;

  public ClientsController(ClientsService clientsService) {
    this.clientsService = clientsService;
  }

  @GetMapping
  ClientPage listClients(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String q,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
  ) {
    return clientsService.listClients(jwt, q, page, size);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  ClientResponse createClient(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody CreateClientRequest createClientRequest
  ) {
    return clientsService.createClient(jwt, createClientRequest);
  }

  @GetMapping("/{clientId}")
  ClientResponse getClient(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID clientId) {
    return clientsService.getClient(jwt, clientId);
  }

  @PatchMapping("/{clientId}")
  ClientResponse patchClient(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID clientId,
    @Valid @RequestBody PatchClientRequest patchClientRequest
  ) {
    return clientsService.patchClient(jwt, clientId, patchClientRequest);
  }
}
