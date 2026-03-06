package com.barbersuite.backend.staffadmin;

import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ServiceNotFoundException;
import com.barbersuite.backend.web.error.StaffBarberEmailAlreadyExistsException;
import com.barbersuite.backend.web.error.StaffBarberNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import com.barbersuite.backend.web.staffadmin.dto.BarberDetailResponse;
import com.barbersuite.backend.web.staffadmin.dto.BarberListItemResponse;
import com.barbersuite.backend.web.staffadmin.dto.BarberListResponse;
import com.barbersuite.backend.web.staffadmin.dto.BranchSummary;
import com.barbersuite.backend.web.staffadmin.dto.CreateBarberRequest;
import com.barbersuite.backend.web.staffadmin.dto.PatchBarberRequest;
import com.barbersuite.backend.web.staffadmin.dto.ServiceSummary;
import java.sql.SQLException;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffAdminService {

  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String USERS_EMAIL_GLOBAL_UNIQUE_INDEX = "ux_users_email_global_lower";

  private final JdbcStaffBarbersRepository staffBarbersRepository;
  private final JdbcStaffBarberBranchesRepository staffBarberBranchesRepository;
  private final JdbcStaffBarberServicesRepository staffBarberServicesRepository;
  private final JdbcStaffBranchesRepositoryLite staffBranchesRepositoryLite;
  private final JdbcStaffServicesRepositoryLite staffServicesRepositoryLite;
  private final PasswordEncoder passwordEncoder;

  public StaffAdminService(
    JdbcStaffBarbersRepository staffBarbersRepository,
    JdbcStaffBarberBranchesRepository staffBarberBranchesRepository,
    JdbcStaffBarberServicesRepository staffBarberServicesRepository,
    JdbcStaffBranchesRepositoryLite staffBranchesRepositoryLite,
    JdbcStaffServicesRepositoryLite staffServicesRepositoryLite,
    PasswordEncoder passwordEncoder
  ) {
    this.staffBarbersRepository = staffBarbersRepository;
    this.staffBarberBranchesRepository = staffBarberBranchesRepository;
    this.staffBarberServicesRepository = staffBarberServicesRepository;
    this.staffBranchesRepositoryLite = staffBranchesRepositoryLite;
    this.staffServicesRepositoryLite = staffServicesRepositoryLite;
    this.passwordEncoder = passwordEncoder;
  }

  @Transactional(readOnly = true)
  public BarberListResponse listBarbers(Jwt jwt, String active, String query, String branchId) {
    UUID tenantId = tenantId(jwt);
    UUID branchFilter = parseOptionalUuid(branchId, "branchId");
    if (
      branchFilter != null &&
      !staffBranchesRepositoryLite.allExistForTenant(tenantId, List.of(branchFilter))
    ) {
      throw new BranchNotFoundException();
    }

    JdbcStaffBarbersRepository.StaffBarberFilter filter =
      new JdbcStaffBarbersRepository.StaffBarberFilter(
        parseOptionalBoolean(active, "active"),
        normalizeNullable(query),
        branchFilter
      );

    List<JdbcStaffBarbersRepository.StaffBarberRow> barberRows = staffBarbersRepository.listBarbers(
      tenantId,
      filter
    );
    Map<UUID, List<JdbcStaffBarberBranchesRepository.AssignedBranchRow>> branchesByBarber =
      staffBarberBranchesRepository.listBranchesForBarbers(
        tenantId,
        barberRows.stream().map(JdbcStaffBarbersRepository.StaffBarberRow::id).toList()
      );

    return new BarberListResponse(barberRows.stream()
      .map(barberRow -> new BarberListItemResponse(
        barberRow.id(),
        barberRow.fullName(),
        barberRow.email(),
        barberRow.phone(),
        barberRow.active(),
        toBranchSummaries(branchesByBarber.get(barberRow.id()))
      ))
      .toList());
  }

  @Transactional
  public BarberDetailResponse createBarber(Jwt jwt, CreateBarberRequest request) {
    UUID tenantId = tenantId(jwt);
    String fullName = normalizeFullName(request.fullName());
    String email = normalizeEmail(request.email());
    String phone = normalizeNullable(request.phone());
    List<UUID> branchIds = normalizeIds(request.branchIds());
    List<UUID> serviceIds = normalizeIds(request.serviceIds());
    boolean active = request.active() == null || request.active();

    if (!staffBranchesRepositoryLite.allExistForTenant(tenantId, branchIds)) {
      throw new BranchNotFoundException();
    }
    if (!staffServicesRepositoryLite.allExistForTenant(tenantId, serviceIds)) {
      throw new ServiceNotFoundException();
    }
    if (staffBarbersRepository.emailExistsGlobal(email)) {
      throw new StaffBarberEmailAlreadyExistsException();
    }

    UUID barberId = UUID.randomUUID();
    try {
      staffBarbersRepository.insertUser(
        tenantId,
        barberId,
        fullName,
        email,
        phone,
        passwordEncoder.encode(request.password()),
        active
      );
      staffBarbersRepository.insertBarberRole(tenantId, barberId);
      staffBarberBranchesRepository.replaceBranches(tenantId, barberId, branchIds);
      staffBarberServicesRepository.replaceServices(tenantId, barberId, serviceIds);
    } catch (DataIntegrityViolationException exception) {
      if (isEmailConflict(exception)) {
        throw new StaffBarberEmailAlreadyExistsException();
      }
      throw exception;
    }

    return getBarberByTenantAndId(tenantId, barberId);
  }

  @Transactional(readOnly = true)
  public BarberDetailResponse getBarber(Jwt jwt, UUID barberId) {
    return getBarberByTenantAndId(tenantId(jwt), barberId);
  }

  @Transactional
  public BarberDetailResponse patchBarber(Jwt jwt, UUID barberId, PatchBarberRequest request) {
    if (
      request.fullName() == null &&
      request.phone() == null &&
      request.active() == null &&
      request.branchIds() == null &&
      request.serviceIds() == null &&
      request.password() == null
    ) {
      throw new ValidationErrorException("At least one field must be provided.");
    }

    UUID tenantId = tenantId(jwt);
    JdbcStaffBarbersRepository.StaffBarberRow currentBarber = staffBarbersRepository.findBarberById(
      tenantId,
      barberId
    ).orElseThrow(StaffBarberNotFoundException::new);

    List<UUID> branchIds = request.branchIds() == null ? null : normalizeIds(request.branchIds());
    List<UUID> serviceIds = request.serviceIds() == null
      ? null
      : normalizeIds(request.serviceIds());

    if (branchIds != null && !staffBranchesRepositoryLite.allExistForTenant(tenantId, branchIds)) {
      throw new BranchNotFoundException();
    }
    if (serviceIds != null && !staffServicesRepositoryLite.allExistForTenant(tenantId, serviceIds)) {
      throw new ServiceNotFoundException();
    }

    String fullName = request.fullName() == null
      ? currentBarber.fullName()
      : normalizeFullName(request.fullName());
    String phone = request.phone() == null
      ? currentBarber.phone()
      : normalizeNullable(request.phone());
    boolean active = request.active() == null ? currentBarber.active() : request.active();
    String passwordHash = request.password() == null
      ? currentBarber.passwordHash()
      : passwordEncoder.encode(request.password());

    int rowsUpdated = staffBarbersRepository.updateUserFields(
      tenantId,
      barberId,
      fullName,
      phone,
      passwordHash,
      active
    );
    if (rowsUpdated == 0) {
      throw new StaffBarberNotFoundException();
    }

    if (branchIds != null) {
      staffBarberBranchesRepository.replaceBranches(tenantId, barberId, branchIds);
    }
    if (serviceIds != null) {
      staffBarberServicesRepository.replaceServices(tenantId, barberId, serviceIds);
    }

    return getBarberByTenantAndId(tenantId, barberId);
  }

  private BarberDetailResponse getBarberByTenantAndId(UUID tenantId, UUID barberId) {
    JdbcStaffBarbersRepository.StaffBarberRow barberRow = staffBarbersRepository.findBarberById(
      tenantId,
      barberId
    ).orElseThrow(StaffBarberNotFoundException::new);

    Map<UUID, List<JdbcStaffBarberBranchesRepository.AssignedBranchRow>> branchesByBarber =
      staffBarberBranchesRepository.listBranchesForBarbers(tenantId, List.of(barberId));
    Map<UUID, List<JdbcStaffBarberServicesRepository.AssignedServiceRow>> servicesByBarber =
      staffBarberServicesRepository.listServicesForBarbers(tenantId, List.of(barberId));

    return new BarberDetailResponse(
      barberRow.id(),
      barberRow.fullName(),
      barberRow.email(),
      barberRow.phone(),
      barberRow.active(),
      toBranchSummaries(branchesByBarber.get(barberId)),
      toServiceSummaries(servicesByBarber.get(barberId))
    );
  }

  private List<BranchSummary> toBranchSummaries(
    List<JdbcStaffBarberBranchesRepository.AssignedBranchRow> rows
  ) {
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }

    return rows.stream()
      .map(row -> new BranchSummary(row.id(), row.name(), row.code(), row.active()))
      .toList();
  }

  private List<ServiceSummary> toServiceSummaries(
    List<JdbcStaffBarberServicesRepository.AssignedServiceRow> rows
  ) {
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }

    return rows.stream()
      .map(row -> new ServiceSummary(
        row.id(),
        row.name(),
        row.price(),
        row.durationMinutes(),
        row.active()
      ))
      .toList();
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private String normalizeFullName(String rawFullName) {
    String normalizedFullName = rawFullName == null ? "" : rawFullName.trim();
    if (normalizedFullName.length() < 2) {
      throw new ValidationErrorException("fullName must contain at least 2 characters.");
    }
    return normalizedFullName;
  }

  private String normalizeEmail(String rawEmail) {
    String normalizedEmail = rawEmail == null ? "" : rawEmail.trim().toLowerCase(Locale.ROOT);
    if (normalizedEmail.isEmpty()) {
      throw new ValidationErrorException("email is required.");
    }
    return normalizedEmail;
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }

    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }

  private List<UUID> normalizeIds(List<UUID> ids) {
    if (ids == null) {
      return List.of();
    }
    return List.copyOf(new LinkedHashSet<>(ids));
  }

  private UUID parseOptionalUuid(String rawValue, String fieldName) {
    String normalizedValue = normalizeNullable(rawValue);
    if (normalizedValue == null) {
      return null;
    }

    try {
      return UUID.fromString(normalizedValue);
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid UUID.");
    }
  }

  private Boolean parseOptionalBoolean(String rawValue, String fieldName) {
    String normalizedValue = normalizeNullable(rawValue);
    if (normalizedValue == null) {
      return null;
    }

    if ("true".equalsIgnoreCase(normalizedValue)) {
      return true;
    }
    if ("false".equalsIgnoreCase(normalizedValue)) {
      return false;
    }

    throw new ValidationErrorException(fieldName + " must be true or false.");
  }

  private boolean isEmailConflict(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
      sqlException.getMessage() != null &&
      sqlException.getMessage().contains(USERS_EMAIL_GLOBAL_UNIQUE_INDEX);
  }
}
