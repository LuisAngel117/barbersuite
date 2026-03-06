package com.barbersuite.backend.appointments;

import com.barbersuite.backend.availability.AvailabilityService;
import com.barbersuite.backend.branches.JdbcBranchInfoRepository;
import com.barbersuite.backend.clients.JdbcClientsRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.notifications.NotificationsService;
import com.barbersuite.backend.services.JdbcServiceRepository;
import com.barbersuite.backend.web.appointments.AppointmentListResponse;
import com.barbersuite.backend.web.appointments.AppointmentResponse;
import com.barbersuite.backend.web.appointments.CreateAppointmentRequest;
import com.barbersuite.backend.web.appointments.PatchAppointmentRequest;
import com.barbersuite.backend.web.error.AppointmentNotFoundException;
import com.barbersuite.backend.web.error.AppointmentOverlapException;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ClientNotFoundException;
import com.barbersuite.backend.web.error.ServiceNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.sql.SQLException;
import java.time.DateTimeException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AppointmentsService {

  private static final String EXCLUSION_VIOLATION_SQL_STATE = "23P01";
  private static final String OVERLAP_CONSTRAINT = "ex_appt_no_overlap";
  private static final DateTimeFormatter START_AT_LOCAL_FORMATTER =
    DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

  private final JdbcAppointmentsRepository appointmentsRepository;
  private final JdbcBranchInfoRepository branchInfoRepository;
  private final JdbcClientsRepository clientsRepository;
  private final JdbcServiceRepository serviceRepository;
  private final NotificationsService notificationsService;
  private final AvailabilityService availabilityService;

  public AppointmentsService(
    JdbcAppointmentsRepository appointmentsRepository,
    JdbcBranchInfoRepository branchInfoRepository,
    JdbcClientsRepository clientsRepository,
    JdbcServiceRepository serviceRepository,
    NotificationsService notificationsService,
    AvailabilityService availabilityService
  ) {
    this.appointmentsRepository = appointmentsRepository;
    this.branchInfoRepository = branchInfoRepository;
    this.clientsRepository = clientsRepository;
    this.serviceRepository = serviceRepository;
    this.notificationsService = notificationsService;
    this.availabilityService = availabilityService;
  }

  @Transactional(readOnly = true)
  public AppointmentListResponse listAppointments(
    Jwt jwt,
    String date,
    String from,
    String to,
    String barberId,
    String status,
    String query
  ) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    ZoneId branchZoneId = branchZoneId(tenantId, branchId);

    JdbcAppointmentsRepository.AppointmentFilter filter = new JdbcAppointmentsRepository.AppointmentFilter(
      resolveFromInclusive(date, from, branchZoneId),
      resolveToExclusive(date, from, to, branchZoneId),
      parseOptionalUuid(barberId, "barberId"),
      parseOptionalStatus(status),
      normalizeNullable(query)
    );

    if (
      filter.fromInclusive() != null &&
      filter.toExclusive() != null &&
      !filter.fromInclusive().isBefore(filter.toExclusive())
    ) {
      throw new ValidationErrorException("from must be less than or equal to to.");
    }

    List<AppointmentResponse> items = appointmentsRepository.list(tenantId, branchId, filter).stream()
      .map(this::toResponse)
      .toList();
    return new AppointmentListResponse(items);
  }

  @Transactional
  public AppointmentResponse createAppointment(Jwt jwt, CreateAppointmentRequest request) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    ZoneId branchZoneId = branchZoneId(tenantId, branchId);

    ensureClientExists(tenantId, branchId, request.clientId());
    int durationMinutes = resolveDurationMinutes(tenantId, request.serviceId(), request.durationMinutes());

    Instant startAt = parseStartAtLocal(request.startAtLocal(), branchZoneId);
    Instant endAt = startAt.plus(Duration.ofMinutes(durationMinutes));
    availabilityService.assertWithinAvailability(
      tenantId,
      branchId,
      request.barberId(),
      startAt,
      endAt
    );
    UUID appointmentId = UUID.randomUUID();

    try {
      appointmentsRepository.insert(
        tenantId,
        branchId,
        appointmentId,
        request.clientId(),
        request.barberId(),
        request.serviceId(),
        AppointmentStatus.scheduled,
        startAt,
        endAt,
        normalizeNullable(request.notes())
      );
    } catch (DataIntegrityViolationException exception) {
      if (isAppointmentOverlap(exception)) {
        throw new AppointmentOverlapException();
      }
      throw exception;
    }

    notificationsService.enqueueAppointmentConfirmation(tenantId, branchId, appointmentId);

    return appointmentsRepository.findByTenantBranchAndId(tenantId, branchId, appointmentId)
      .map(this::toResponse)
      .orElseThrow(AppointmentNotFoundException::new);
  }

  @Transactional(readOnly = true)
  public AppointmentResponse getAppointment(Jwt jwt, UUID appointmentId) {
    return appointmentsRepository.findByTenantBranchAndId(
      tenantId(jwt),
      BranchContext.requireCurrentBranchId(),
      appointmentId
    )
      .map(this::toResponse)
      .orElseThrow(AppointmentNotFoundException::new);
  }

  @Transactional
  public AppointmentResponse patchAppointment(
    Jwt jwt,
    UUID appointmentId,
    PatchAppointmentRequest request
  ) {
    if (
      request.startAtLocal() == null &&
      request.durationMinutes() == null &&
      request.status() == null &&
      request.notes() == null
    ) {
      throw new ValidationErrorException("At least one field must be provided.");
    }

    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    ZoneId branchZoneId = branchZoneId(tenantId, branchId);
    JdbcAppointmentsRepository.AppointmentRow currentAppointment = appointmentsRepository
      .findByTenantBranchAndId(tenantId, branchId, appointmentId)
      .orElseThrow(AppointmentNotFoundException::new);

    Instant startAt = request.startAtLocal() == null
      ? currentAppointment.startAt()
      : parseStartAtLocal(request.startAtLocal(), branchZoneId);
    int durationMinutes = request.durationMinutes() == null
      ? (int) Duration.between(currentAppointment.startAt(), currentAppointment.endAt()).toMinutes()
      : request.durationMinutes();
    Instant endAt = startAt.plus(Duration.ofMinutes(durationMinutes));
    AppointmentStatus status = request.status() == null
      ? currentAppointment.status()
      : AppointmentStatus.parse(request.status());
    String notes = request.notes() == null
      ? currentAppointment.notes()
      : normalizeNullable(request.notes());

    if (request.startAtLocal() != null || request.durationMinutes() != null) {
      availabilityService.assertWithinAvailability(
        tenantId,
        branchId,
        currentAppointment.barberId(),
        startAt,
        endAt
      );
    }

    try {
      int rowsUpdated = appointmentsRepository.update(
        tenantId,
        branchId,
        appointmentId,
        currentAppointment.clientId(),
        currentAppointment.barberId(),
        currentAppointment.serviceId(),
        status,
        startAt,
        endAt,
        notes
      );
      if (rowsUpdated == 0) {
        throw new AppointmentNotFoundException();
      }
    } catch (DataIntegrityViolationException exception) {
      if (isAppointmentOverlap(exception)) {
        throw new AppointmentOverlapException();
      }
      throw exception;
    }

    return appointmentsRepository.findByTenantBranchAndId(tenantId, branchId, appointmentId)
      .map(this::toResponse)
      .orElseThrow(AppointmentNotFoundException::new);
  }

  private AppointmentResponse toResponse(JdbcAppointmentsRepository.AppointmentRow appointmentRow) {
    return new AppointmentResponse(
      appointmentRow.id(),
      appointmentRow.clientId(),
      appointmentRow.barberId(),
      appointmentRow.serviceId(),
      appointmentRow.status(),
      appointmentRow.startAt(),
      appointmentRow.endAt(),
      appointmentRow.notes(),
      appointmentRow.createdAt(),
      appointmentRow.updatedAt()
    );
  }

  private ZoneId branchZoneId(UUID tenantId, UUID branchId) {
    String timeZone = branchInfoRepository.findTimeZone(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);
    try {
      return ZoneId.of(timeZone);
    } catch (DateTimeException exception) {
      throw new IllegalStateException("Branch time zone is invalid: " + timeZone, exception);
    }
  }

  private Instant parseStartAtLocal(String rawStartAtLocal, ZoneId branchZoneId) {
    try {
      LocalDateTime localDateTime = LocalDateTime.parse(
        rawStartAtLocal.trim(),
        START_AT_LOCAL_FORMATTER
      );
      return localDateTime.atZone(branchZoneId).toInstant();
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(
        "startAtLocal must match format yyyy-MM-dd'T'HH:mm."
      );
    }
  }

  private int resolveDurationMinutes(UUID tenantId, UUID serviceId, Integer requestedDurationMinutes) {
    if (requestedDurationMinutes != null) {
      serviceRepository.findByTenantAndId(tenantId, serviceId).orElseThrow(ServiceNotFoundException::new);
      return requestedDurationMinutes;
    }

    return serviceRepository.findDurationMinutesByTenantAndId(tenantId, serviceId)
      .orElseThrow(ServiceNotFoundException::new);
  }

  private void ensureClientExists(UUID tenantId, UUID branchId, UUID clientId) {
    if (!clientsRepository.existsById(tenantId, branchId, clientId)) {
      throw new ClientNotFoundException();
    }
  }

  private Instant resolveFromInclusive(String date, String from, ZoneId branchZoneId) {
    LocalDate localDate = date != null ? parseDate(date, "date") : parseNullableDate(from, "from");
    if (localDate == null) {
      return null;
    }
    return localDate.atStartOfDay(branchZoneId).toInstant();
  }

  private Instant resolveToExclusive(String date, String from, String to, ZoneId branchZoneId) {
    LocalDate localDate;
    if (date != null) {
      localDate = parseDate(date, "date");
    } else if (to != null) {
      localDate = parseDate(to, "to");
    } else {
      localDate = null;
    }

    if (localDate == null) {
      if (from != null && to == null) {
        return null;
      }
      return null;
    }
    return localDate.plusDays(1).atStartOfDay(branchZoneId).toInstant();
  }

  private LocalDate parseNullableDate(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      return null;
    }
    return parseDate(rawValue, fieldName);
  }

  private LocalDate parseDate(String rawValue, String fieldName) {
    try {
      return LocalDate.parse(rawValue.trim());
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid ISO date.");
    }
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

  private AppointmentStatus parseOptionalStatus(String rawValue) {
    String normalizedValue = normalizeNullable(rawValue);
    return normalizedValue == null ? null : AppointmentStatus.parse(normalizedValue);
  }

  private String normalizeNullable(String rawValue) {
    if (rawValue == null) {
      return null;
    }

    String normalizedValue = rawValue.trim();
    return normalizedValue.isEmpty() ? null : normalizedValue;
  }

  private boolean isAppointmentOverlap(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return EXCLUSION_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
      sqlException.getMessage() != null &&
      sqlException.getMessage().contains(OVERLAP_CONSTRAINT);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }
}
