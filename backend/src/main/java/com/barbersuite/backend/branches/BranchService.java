package com.barbersuite.backend.branches;

import com.barbersuite.backend.web.branches.BranchResponse;
import com.barbersuite.backend.web.branches.CreateBranchRequest;
import com.barbersuite.backend.web.branches.PatchBranchRequest;
import com.barbersuite.backend.web.error.BranchCodeAlreadyExistsException;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.InvalidTimeZoneException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BranchService {

  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String BRANCH_CODE_UNIQUE_CONSTRAINT = "uq_branches_tenant_code";

  private final JdbcBranchRepository branchRepository;

  public BranchService(JdbcBranchRepository branchRepository) {
    this.branchRepository = branchRepository;
  }

  @Transactional(readOnly = true)
  public List<BranchResponse> listBranches(Jwt jwt) {
    UUID tenantId = tenantId(jwt);
    return branchRepository.listByTenant(tenantId).stream()
      .map(this::toResponse)
      .toList();
  }

  @Transactional(readOnly = true)
  public BranchResponse getBranch(Jwt jwt, UUID branchId) {
    return branchRepository.findByTenantAndId(tenantId(jwt), branchId)
      .map(this::toResponse)
      .orElseThrow(BranchNotFoundException::new);
  }

  @Transactional
  public BranchResponse createBranch(Jwt jwt, CreateBranchRequest createBranchRequest) {
    UUID tenantId = tenantId(jwt);
    UUID userId = userId(jwt);
    UUID branchId = UUID.randomUUID();

    String name = normalizeName(createBranchRequest.name());
    String code = normalizeCode(createBranchRequest.code());
    String timeZone = validateTimeZone(createBranchRequest.timeZone());

    try {
      branchRepository.insert(tenantId, branchId, name, code, timeZone, true);
      branchRepository.grantUserBranchAccess(UUID.randomUUID(), tenantId, userId, branchId);
    } catch (DataIntegrityViolationException exception) {
      if (isDuplicateBranchCode(exception)) {
        throw new BranchCodeAlreadyExistsException();
      }
      throw exception;
    }

    return new BranchResponse(branchId, name, code, timeZone, true);
  }

  @Transactional
  public BranchResponse patchBranch(Jwt jwt, UUID branchId, PatchBranchRequest patchBranchRequest) {
    if (
      patchBranchRequest.name() == null &&
      patchBranchRequest.timeZone() == null &&
      patchBranchRequest.active() == null
    ) {
      throw new ValidationErrorException("At least one field must be provided.");
    }

    UUID tenantId = tenantId(jwt);
    JdbcBranchRepository.BranchRow currentBranch = branchRepository.findByTenantAndId(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);

    String name = patchBranchRequest.name() == null
      ? currentBranch.name()
      : normalizeName(patchBranchRequest.name());
    String timeZone = patchBranchRequest.timeZone() == null
      ? currentBranch.timeZone()
      : validateTimeZone(patchBranchRequest.timeZone());
    boolean active = patchBranchRequest.active() == null
      ? currentBranch.active()
      : patchBranchRequest.active();

    int rowsUpdated = branchRepository.update(tenantId, branchId, name, timeZone, active);
    if (rowsUpdated == 0) {
      throw new BranchNotFoundException();
    }

    return new BranchResponse(branchId, name, currentBranch.code(), timeZone, active);
  }

  private BranchResponse toResponse(JdbcBranchRepository.BranchRow branchRow) {
    return new BranchResponse(
      branchRow.id(),
      branchRow.name(),
      branchRow.code(),
      branchRow.timeZone(),
      branchRow.active()
    );
  }

  private UUID tenantId(Jwt jwt) {
    return uuidClaim(jwt, "tenantId");
  }

  private UUID userId(Jwt jwt) {
    return uuidClaim(jwt, "userId");
  }

  private UUID uuidClaim(Jwt jwt, String claimName) {
    String claimValue = jwt.getClaimAsString(claimName);
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: " + claimName);
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

  private String normalizeCode(String rawCode) {
    return rawCode.trim().toUpperCase(Locale.ROOT);
  }

  private String validateTimeZone(String rawTimeZone) {
    String normalizedTimeZone = rawTimeZone.trim();
    try {
      ZoneId.of(normalizedTimeZone);
      return normalizedTimeZone;
    } catch (DateTimeException exception) {
      throw new InvalidTimeZoneException();
    }
  }

  private boolean isDuplicateBranchCode(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
    sqlException.getMessage() != null &&
    sqlException.getMessage().contains(BRANCH_CODE_UNIQUE_CONSTRAINT);
  }
}
