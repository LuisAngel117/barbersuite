package com.barbersuite.backend.services;

import com.barbersuite.backend.web.error.ServiceNameAlreadyExistsException;
import com.barbersuite.backend.web.error.ServiceNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import com.barbersuite.backend.web.services.CreateServiceRequest;
import com.barbersuite.backend.web.services.PatchServiceRequest;
import com.barbersuite.backend.web.services.ServiceResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicesService {

  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String SERVICE_NAME_UNIQUE_INDEX = "ux_services_tenant_name_ci";

  private final JdbcServiceRepository serviceRepository;

  public ServicesService(JdbcServiceRepository serviceRepository) {
    this.serviceRepository = serviceRepository;
  }

  @Transactional(readOnly = true)
  public List<ServiceResponse> listServices(Jwt jwt) {
    return serviceRepository.listByTenant(tenantId(jwt)).stream()
      .map(this::toResponse)
      .toList();
  }

  @Transactional(readOnly = true)
  public ServiceResponse getService(Jwt jwt, UUID serviceId) {
    return serviceRepository.findByTenantAndId(tenantId(jwt), serviceId)
      .map(this::toResponse)
      .orElseThrow(ServiceNotFoundException::new);
  }

  @Transactional
  public ServiceResponse createService(Jwt jwt, CreateServiceRequest createServiceRequest) {
    UUID serviceId = UUID.randomUUID();
    UUID tenantId = tenantId(jwt);

    String name = normalizeName(createServiceRequest.name());
    int durationMinutes = createServiceRequest.durationMinutes();
    BigDecimal price = normalizePrice(createServiceRequest.price());

    try {
      serviceRepository.insert(serviceId, tenantId, name, durationMinutes, price, true);
    } catch (DataIntegrityViolationException exception) {
      if (isDuplicateServiceName(exception)) {
        throw new ServiceNameAlreadyExistsException();
      }
      throw exception;
    }

    return new ServiceResponse(serviceId, name, durationMinutes, price, true);
  }

  @Transactional
  public ServiceResponse patchService(
    Jwt jwt,
    UUID serviceId,
    PatchServiceRequest patchServiceRequest
  ) {
    if (
      patchServiceRequest.name() == null &&
      patchServiceRequest.durationMinutes() == null &&
      patchServiceRequest.price() == null &&
      patchServiceRequest.active() == null
    ) {
      throw new ValidationErrorException("At least one field must be provided.");
    }

    UUID tenantId = tenantId(jwt);
    JdbcServiceRepository.ServiceRow currentService = serviceRepository.findByTenantAndId(
      tenantId,
      serviceId
    ).orElseThrow(ServiceNotFoundException::new);

    String name = patchServiceRequest.name() == null
      ? currentService.name()
      : normalizeName(patchServiceRequest.name());
    int durationMinutes = patchServiceRequest.durationMinutes() == null
      ? currentService.durationMinutes()
      : patchServiceRequest.durationMinutes();
    BigDecimal price = patchServiceRequest.price() == null
      ? currentService.price()
      : normalizePrice(patchServiceRequest.price());
    boolean active = patchServiceRequest.active() == null
      ? currentService.active()
      : patchServiceRequest.active();

    try {
      int rowsUpdated = serviceRepository.update(
        tenantId,
        serviceId,
        name,
        durationMinutes,
        price,
        active
      );
      if (rowsUpdated == 0) {
        throw new ServiceNotFoundException();
      }
    } catch (DataIntegrityViolationException exception) {
      if (isDuplicateServiceName(exception)) {
        throw new ServiceNameAlreadyExistsException();
      }
      throw exception;
    }

    return new ServiceResponse(serviceId, name, durationMinutes, price, active);
  }

  private ServiceResponse toResponse(JdbcServiceRepository.ServiceRow serviceRow) {
    return new ServiceResponse(
      serviceRow.id(),
      serviceRow.name(),
      serviceRow.durationMinutes(),
      serviceRow.price(),
      serviceRow.active()
    );
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private String normalizeName(String rawName) {
    String normalizedName = rawName == null ? "" : rawName.trim();
    if (normalizedName.length() < 2) {
      throw new ValidationErrorException("name must contain at least 2 characters.");
    }
    return normalizedName;
  }

  private BigDecimal normalizePrice(BigDecimal rawPrice) {
    if (rawPrice == null) {
      throw new ValidationErrorException("price is required.");
    }

    BigDecimal normalizedPrice = rawPrice.setScale(2, RoundingMode.HALF_UP);
    if (normalizedPrice.compareTo(BigDecimal.ZERO) < 0) {
      throw new ValidationErrorException("price must be greater than or equal to 0.");
    }
    return normalizedPrice;
  }

  private boolean isDuplicateServiceName(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
    sqlException.getMessage() != null &&
    sqlException.getMessage().contains(SERVICE_NAME_UNIQUE_INDEX);
  }
}
