package com.barbersuite.backend.clients;

import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.clients.ClientPage;
import com.barbersuite.backend.web.clients.ClientResponse;
import com.barbersuite.backend.web.clients.CreateClientRequest;
import com.barbersuite.backend.web.clients.PatchClientRequest;
import com.barbersuite.backend.web.error.ClientNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClientsService {

  private final JdbcClientsRepository clientsRepository;

  public ClientsService(JdbcClientsRepository clientsRepository) {
    this.clientsRepository = clientsRepository;
  }

  @Transactional(readOnly = true)
  public ClientPage listClients(Jwt jwt, String query, int page, int size) {
    validatePagination(page, size);

    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    long totalItems = clientsRepository.count(tenantId, branchId, query);
    List<ClientResponse> items = clientsRepository.list(tenantId, branchId, query, page, size)
      .stream()
      .map(this::toResponse)
      .toList();

    int totalPages = totalItems == 0 ? 0 : (int) Math.ceil((double) totalItems / size);
    return new ClientPage(items, page, size, totalItems, totalPages);
  }

  @Transactional
  public ClientResponse createClient(Jwt jwt, CreateClientRequest createClientRequest) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    UUID clientId = UUID.randomUUID();

    clientsRepository.insert(
      tenantId,
      branchId,
      clientId,
      normalizeFullName(createClientRequest.fullName()),
      normalizeNullable(createClientRequest.phone()),
      normalizeNullable(createClientRequest.email()),
      normalizeNullable(createClientRequest.notes()),
      true
    );

    return clientsRepository.findById(tenantId, branchId, clientId)
      .map(this::toResponse)
      .orElseThrow(ClientNotFoundException::new);
  }

  @Transactional(readOnly = true)
  public ClientResponse getClient(Jwt jwt, UUID clientId) {
    return clientsRepository.findById(tenantId(jwt), BranchContext.requireCurrentBranchId(), clientId)
      .map(this::toResponse)
      .orElseThrow(ClientNotFoundException::new);
  }

  @Transactional
  public ClientResponse patchClient(Jwt jwt, UUID clientId, PatchClientRequest patchClientRequest) {
    if (
      patchClientRequest.fullName() == null &&
      patchClientRequest.phone() == null &&
      patchClientRequest.email() == null &&
      patchClientRequest.notes() == null &&
      patchClientRequest.active() == null
    ) {
      throw new ValidationErrorException("At least one field must be provided.");
    }

    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    JdbcClientsRepository.ClientRow currentClient = clientsRepository.findById(tenantId, branchId, clientId)
      .orElseThrow(ClientNotFoundException::new);

    String fullName = patchClientRequest.fullName() == null
      ? currentClient.fullName()
      : normalizeFullName(patchClientRequest.fullName());
    String phone = patchClientRequest.phone() == null
      ? currentClient.phone()
      : normalizeNullable(patchClientRequest.phone());
    String email = patchClientRequest.email() == null
      ? currentClient.email()
      : normalizeNullable(patchClientRequest.email());
    String notes = patchClientRequest.notes() == null
      ? currentClient.notes()
      : normalizeNullable(patchClientRequest.notes());
    boolean active = patchClientRequest.active() == null
      ? currentClient.active()
      : patchClientRequest.active();

    int rowsUpdated = clientsRepository.update(
      tenantId,
      branchId,
      clientId,
      fullName,
      phone,
      email,
      notes,
      active
    );
    if (rowsUpdated == 0) {
      throw new ClientNotFoundException();
    }

    return new ClientResponse(
      clientId,
      fullName,
      phone,
      email,
      notes,
      active,
      currentClient.createdAt()
    );
  }

  private ClientResponse toResponse(JdbcClientsRepository.ClientRow clientRow) {
    return new ClientResponse(
      clientRow.id(),
      clientRow.fullName(),
      clientRow.phone(),
      clientRow.email(),
      clientRow.notes(),
      clientRow.active(),
      clientRow.createdAt()
    );
  }

  private void validatePagination(int page, int size) {
    if (page < 0) {
      throw new ValidationErrorException("page must be greater than or equal to 0.");
    }
    if (size < 1) {
      throw new ValidationErrorException("size must be greater than or equal to 1.");
    }
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private String normalizeFullName(String rawFullName) {
    String fullName = normalizeNullable(rawFullName);
    if (fullName == null || fullName.length() < 2) {
      throw new ValidationErrorException("fullName must contain at least 2 characters.");
    }
    return fullName;
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }

    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }
}
