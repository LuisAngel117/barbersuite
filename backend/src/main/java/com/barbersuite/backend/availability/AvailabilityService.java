package com.barbersuite.backend.availability;

import com.barbersuite.backend.appointments.JdbcAppointmentsReadRepository;
import com.barbersuite.backend.branches.JdbcBranchInfoRepository;
import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.services.JdbcServiceRepository;
import com.barbersuite.backend.staff.JdbcBarbersRepository;
import com.barbersuite.backend.web.availability.dto.AvailabilityBarberResponse;
import com.barbersuite.backend.web.availability.dto.AvailabilityBarbersResponse;
import com.barbersuite.backend.web.availability.dto.AvailabilityExceptionDto;
import com.barbersuite.backend.web.availability.dto.AvailabilitySlotsBarberResponse;
import com.barbersuite.backend.web.availability.dto.AvailabilitySlotsResponse;
import com.barbersuite.backend.web.availability.dto.ExceptionInterval;
import com.barbersuite.backend.web.availability.dto.PutAvailabilityRequest;
import com.barbersuite.backend.web.availability.dto.WeeklyInterval;
import com.barbersuite.backend.web.error.AppointmentOutsideAvailabilityException;
import com.barbersuite.backend.web.error.BarberNotFoundException;
import com.barbersuite.backend.web.error.BranchNotFoundException;
import com.barbersuite.backend.web.error.ServiceNotFoundException;
import com.barbersuite.backend.web.error.ValidationErrorException;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AvailabilityService {

  private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
  private static final int SLOT_SIZE_MINUTES = 15;

  private final JdbcAvailabilityRepository availabilityRepository;
  private final JdbcBarbersRepository barbersRepository;
  private final JdbcAppointmentsReadRepository appointmentsReadRepository;
  private final JdbcServiceRepository serviceRepository;
  private final JdbcBranchInfoRepository branchInfoRepository;

  public AvailabilityService(
    JdbcAvailabilityRepository availabilityRepository,
    JdbcBarbersRepository barbersRepository,
    JdbcAppointmentsReadRepository appointmentsReadRepository,
    JdbcServiceRepository serviceRepository,
    JdbcBranchInfoRepository branchInfoRepository
  ) {
    this.availabilityRepository = availabilityRepository;
    this.barbersRepository = barbersRepository;
    this.appointmentsReadRepository = appointmentsReadRepository;
    this.serviceRepository = serviceRepository;
    this.branchInfoRepository = branchInfoRepository;
  }

  @Transactional(readOnly = true)
  public AvailabilityBarbersResponse listBarbersAvailability(Jwt jwt, String barberId) {
    RequestScope scope = requestScope(jwt);
    List<JdbcBarbersRepository.BarberRow> barbers = scopedBarbers(scope, barberId);
    return new AvailabilityBarbersResponse(assembleBarbersAvailability(scope, barbers));
  }

  @Transactional
  public AvailabilityBarberResponse putBarberAvailability(
    Jwt jwt,
    UUID barberId,
    PutAvailabilityRequest request
  ) {
    RequestScope scope = requestScope(jwt);
    JdbcBarbersRepository.BarberRow barber = barbersRepository
      .findByTenantAndBranchAndUserId(scope.tenantId(), scope.branchId(), barberId)
      .orElseThrow(BarberNotFoundException::new);

    ParsedAvailability parsedAvailability = parseAvailabilityRequest(request);
    availabilityRepository.replaceWeekly(
      scope.tenantId(),
      scope.branchId(),
      barberId,
      parsedAvailability.weeklyInserts()
    );
    availabilityRepository.replaceExceptions(
      scope.tenantId(),
      scope.branchId(),
      barberId,
      parsedAvailability.exceptionInserts(),
      parsedAvailability.exceptionIntervalInserts()
    );

    return assembleBarbersAvailability(scope, List.of(barber)).get(0);
  }

  @Transactional(readOnly = true)
  public AvailabilitySlotsResponse getSlots(
    Jwt jwt,
    String date,
    String serviceId,
    String barberId
  ) {
    RequestScope scope = requestScope(jwt);
    LocalDate targetDate = parseIsoDate(date, "date");
    UUID parsedServiceId = parseUuid(serviceId, "serviceId");
    int durationMinutes = serviceRepository
      .findDurationMinutesByTenantAndId(scope.tenantId(), parsedServiceId)
      .orElseThrow(ServiceNotFoundException::new);

    List<JdbcBarbersRepository.BarberRow> barbers = scopedBarbers(scope, barberId);
    List<JdbcBarbersRepository.BarberRow> requestedBarbers = barberId == null || barberId.isBlank()
      ? barbers.stream().filter(JdbcBarbersRepository.BarberRow::active).toList()
      : barbers;

    List<AvailabilitySlotsBarberResponse> items = new ArrayList<>();
    if (requestedBarbers.isEmpty()) {
      return new AvailabilitySlotsResponse(scope.timeZone(), items);
    }

    Map<UUID, BarberAvailability> availabilityByBarber = loadAvailabilityByBarber(scope, requestedBarbers);
    DayWindows dayWindows = dayWindows(targetDate, scope.zoneId());
    int dayOfWeek = targetDate.getDayOfWeek().getValue();

    for (JdbcBarbersRepository.BarberRow barber : requestedBarbers) {
      List<TimeWindow> windows = windowsForDate(
        availabilityByBarber.getOrDefault(barber.id(), BarberAvailability.empty()),
        targetDate,
        dayOfWeek,
        barber.active()
      );
      List<String> slots = windows.isEmpty()
        ? List.of()
        : availableSlots(scope, barber.id(), targetDate, durationMinutes, windows, dayWindows);
      items.add(new AvailabilitySlotsBarberResponse(barber.id(), barber.fullName(), slots));
    }

    return new AvailabilitySlotsResponse(scope.timeZone(), items);
  }

  @Transactional(readOnly = true)
  public void assertWithinAvailability(
    UUID tenantId,
    UUID branchId,
    UUID barberId,
    Instant startAtUtc,
    Instant endAtUtc
  ) {
    RequestScope scope = requestScope(tenantId, branchId);
    JdbcBarbersRepository.BarberRow barber = barbersRepository
      .findByTenantAndBranchAndUserId(tenantId, branchId, barberId)
      .orElseThrow(BarberNotFoundException::new);
    if (!barber.active()) {
      throw new BarberNotFoundException();
    }

    LocalDateTime startLocal = LocalDateTime.ofInstant(startAtUtc, scope.zoneId());
    LocalDateTime endLocal = LocalDateTime.ofInstant(endAtUtc, scope.zoneId());
    if (!startLocal.toLocalDate().equals(endLocal.toLocalDate())) {
      throw new AppointmentOutsideAvailabilityException();
    }

    BarberAvailability availability = loadAvailabilityByBarber(scope, List.of(barber)).getOrDefault(
      barberId,
      BarberAvailability.empty()
    );
    LocalDate targetDate = startLocal.toLocalDate();
    List<TimeWindow> windows = windowsForDate(
      availability,
      targetDate,
      targetDate.getDayOfWeek().getValue(),
      barber.active()
    );

    boolean fitsWindow = windows.stream().anyMatch(window ->
      !startLocal.toLocalTime().isBefore(window.start()) &&
      !endLocal.toLocalTime().isAfter(window.end())
    );
    if (!fitsWindow) {
      throw new AppointmentOutsideAvailabilityException();
    }
  }

  private List<String> availableSlots(
    RequestScope scope,
    UUID barberId,
    LocalDate targetDate,
    int durationMinutes,
    List<TimeWindow> windows,
    DayWindows dayWindows
  ) {
    List<JdbcAppointmentsReadRepository.BusyRange> busyRanges = appointmentsReadRepository.listBusyRanges(
      scope.tenantId(),
      scope.branchId(),
      barberId,
      dayWindows.fromInclusive(),
      dayWindows.toExclusive()
    );

    List<String> slots = new ArrayList<>();
    for (TimeWindow window : windows) {
      LocalTime slotStart = window.start();
      while (!slotStart.plusMinutes(durationMinutes).isAfter(window.end())) {
        LocalDateTime slotStartLocal = LocalDateTime.of(targetDate, slotStart);
        LocalDateTime slotEndLocal = slotStartLocal.plusMinutes(durationMinutes);
        Instant slotStartUtc = slotStartLocal.atZone(scope.zoneId()).toInstant();
        Instant slotEndUtc = slotEndLocal.atZone(scope.zoneId()).toInstant();
        if (!overlapsBusyRange(slotStartUtc, slotEndUtc, busyRanges)) {
          slots.add(slotStart.format(TIME_FORMATTER));
        }
        slotStart = slotStart.plusMinutes(SLOT_SIZE_MINUTES);
      }
    }
    return slots;
  }

  private boolean overlapsBusyRange(
    Instant slotStartUtc,
    Instant slotEndUtc,
    List<JdbcAppointmentsReadRepository.BusyRange> busyRanges
  ) {
    for (JdbcAppointmentsReadRepository.BusyRange busyRange : busyRanges) {
      if (slotStartUtc.isBefore(busyRange.endAt()) && busyRange.startAt().isBefore(slotEndUtc)) {
        return true;
      }
    }
    return false;
  }

  private List<TimeWindow> windowsForDate(
    BarberAvailability availability,
    LocalDate targetDate,
    int dayOfWeek,
    boolean barberActive
  ) {
    if (!barberActive) {
      return List.of();
    }

    AvailabilityExceptionValue exception = availability.exceptionsByDate().get(targetDate);
    if (exception != null) {
      if (exception.type() == AvailabilityExceptionType.closed) {
        return List.of();
      }
      return exception.intervals();
    }

    return availability.weeklyByDay().getOrDefault(dayOfWeek, List.of());
  }

  private Map<UUID, BarberAvailability> loadAvailabilityByBarber(
    RequestScope scope,
    List<JdbcBarbersRepository.BarberRow> barbers
  ) {
    List<UUID> barberIds = barbers.stream().map(JdbcBarbersRepository.BarberRow::id).toList();
    Map<UUID, Map<Integer, List<TimeWindow>>> weeklyByBarber = new LinkedHashMap<>();
    availabilityRepository.listWeekly(scope.tenantId(), scope.branchId(), barberIds).forEach(row -> {
      weeklyByBarber
        .computeIfAbsent(row.barberId(), ignored -> new LinkedHashMap<>())
        .computeIfAbsent(row.dayOfWeek(), ignored -> new ArrayList<>())
        .add(new TimeWindow(row.startTime(), row.endTime()));
    });

    Map<UUID, AvailabilityExceptionValue> exceptionsById = new LinkedHashMap<>();
    Map<UUID, Map<LocalDate, AvailabilityExceptionValue>> exceptionsByBarber = new LinkedHashMap<>();
    List<JdbcAvailabilityRepository.AvailabilityExceptionRow> exceptionRows = availabilityRepository.listExceptions(
      scope.tenantId(),
      scope.branchId(),
      barberIds
    );
    for (JdbcAvailabilityRepository.AvailabilityExceptionRow row : exceptionRows) {
      AvailabilityExceptionValue value = new AvailabilityExceptionValue(
        row.id(),
        row.date(),
        row.type(),
        row.note(),
        new ArrayList<>()
      );
      exceptionsById.put(row.id(), value);
      exceptionsByBarber
        .computeIfAbsent(row.barberId(), ignored -> new LinkedHashMap<>())
        .put(row.date(), value);
    }

    availabilityRepository.listExceptionIntervals(
      scope.tenantId(),
      exceptionRows.stream().map(JdbcAvailabilityRepository.AvailabilityExceptionRow::id).toList()
    ).forEach(row -> {
      AvailabilityExceptionValue value = exceptionsById.get(row.exceptionId());
      if (value != null) {
        value.intervals().add(new TimeWindow(row.startTime(), row.endTime()));
      }
    });

    for (AvailabilityExceptionValue value : exceptionsById.values()) {
      value.intervals().sort(Comparator.comparing(TimeWindow::start));
    }

    Map<UUID, BarberAvailability> result = new LinkedHashMap<>();
    for (JdbcBarbersRepository.BarberRow barber : barbers) {
      result.put(barber.id(), new BarberAvailability(
        weeklyByBarber.getOrDefault(barber.id(), Map.of()),
        exceptionsByBarber.getOrDefault(barber.id(), Map.of())
      ));
    }
    return result;
  }

  private List<AvailabilityBarberResponse> assembleBarbersAvailability(
    RequestScope scope,
    List<JdbcBarbersRepository.BarberRow> barbers
  ) {
    Map<UUID, BarberAvailability> availabilityByBarber = loadAvailabilityByBarber(scope, barbers);
    List<AvailabilityBarberResponse> items = new ArrayList<>();
    for (JdbcBarbersRepository.BarberRow barber : barbers) {
      BarberAvailability availability = availabilityByBarber.getOrDefault(
        barber.id(),
        BarberAvailability.empty()
      );

      List<WeeklyInterval> weekly = availability.weeklyByDay().entrySet().stream()
        .sorted(Map.Entry.comparingByKey())
        .flatMap(entry -> entry.getValue().stream().map(window -> toWeeklyInterval(
          entry.getKey(),
          window
        )))
        .toList();

      List<AvailabilityExceptionDto> exceptions = availability.exceptionsByDate().values().stream()
        .sorted(Comparator.comparing(AvailabilityExceptionValue::date))
        .map(this::toAvailabilityExceptionDto)
        .toList();

      items.add(new AvailabilityBarberResponse(
        barber.id(),
        barber.fullName(),
        weekly,
        exceptions
      ));
    }
    return items;
  }

  private WeeklyInterval toWeeklyInterval(int dayOfWeek, TimeWindow window) {
    return new WeeklyInterval(
      dayOfWeek,
      window.start().format(TIME_FORMATTER),
      window.end().format(TIME_FORMATTER)
    );
  }

  private AvailabilityExceptionDto toAvailabilityExceptionDto(AvailabilityExceptionValue value) {
    return new AvailabilityExceptionDto(
      value.date().toString(),
      value.type().name(),
      value.note(),
      value.intervals().stream()
        .map(interval -> new ExceptionInterval(
          interval.start().format(TIME_FORMATTER),
          interval.end().format(TIME_FORMATTER)
        ))
        .toList()
    );
  }

  private ParsedAvailability parseAvailabilityRequest(PutAvailabilityRequest request) {
    List<WeeklyIntervalValue> weeklyIntervals = request.weekly().stream()
      .map(this::parseWeeklyInterval)
      .sorted(Comparator.comparingInt(WeeklyIntervalValue::dayOfWeek).thenComparing(WeeklyIntervalValue::start))
      .toList();
    validateNonOverlapping(weeklyIntervals, "weekly intervals for dayOfWeek %d must not overlap.");

    List<AvailabilityExceptionValue> exceptions = request.exceptions().stream()
      .map(this::parseAvailabilityException)
      .sorted(Comparator.comparing(AvailabilityExceptionValue::date))
      .toList();
    validateUniqueExceptionDates(exceptions);

    List<JdbcAvailabilityRepository.WeeklyAvailabilityInsert> weeklyInserts = weeklyIntervals.stream()
      .map(interval -> new JdbcAvailabilityRepository.WeeklyAvailabilityInsert(
        UUID.randomUUID(),
        interval.dayOfWeek(),
        interval.start(),
        interval.end()
      ))
      .toList();

    List<JdbcAvailabilityRepository.AvailabilityExceptionInsert> exceptionInserts = new ArrayList<>();
    List<JdbcAvailabilityRepository.ExceptionIntervalInsert> exceptionIntervalInserts = new ArrayList<>();
    for (AvailabilityExceptionValue exception : exceptions) {
      UUID exceptionId = UUID.randomUUID();
      exceptionInserts.add(new JdbcAvailabilityRepository.AvailabilityExceptionInsert(
        exceptionId,
        exception.date(),
        exception.type(),
        exception.note()
      ));
      for (TimeWindow interval : exception.intervals()) {
        exceptionIntervalInserts.add(new JdbcAvailabilityRepository.ExceptionIntervalInsert(
          UUID.randomUUID(),
          exceptionId,
          interval.start(),
          interval.end()
        ));
      }
    }

    return new ParsedAvailability(weeklyInserts, exceptionInserts, exceptionIntervalInserts);
  }

  private WeeklyIntervalValue parseWeeklyInterval(WeeklyInterval interval) {
    LocalTime start = parseTime(interval.start(), "start");
    LocalTime end = parseTime(interval.end(), "end");
    validateStartBeforeEnd(start, end);
    return new WeeklyIntervalValue(interval.dayOfWeek(), start, end);
  }

  private AvailabilityExceptionValue parseAvailabilityException(AvailabilityExceptionDto exceptionDto) {
    LocalDate date = parseIsoDate(exceptionDto.date(), "date");
    AvailabilityExceptionType type = AvailabilityExceptionType.parse(exceptionDto.type());
    List<TimeWindow> intervals = normalizeIntervals(exceptionDto.intervals());

    if (type == AvailabilityExceptionType.closed) {
      if (!intervals.isEmpty()) {
        throw new ValidationErrorException("closed exceptions must not contain intervals.");
      }
      return new AvailabilityExceptionValue(null, date, type, exceptionDto.note(), List.of());
    }

    validateTimeWindows(intervals, "override intervals for %s must not overlap.".formatted(date));
    return new AvailabilityExceptionValue(null, date, type, exceptionDto.note(), intervals);
  }

  private List<TimeWindow> normalizeIntervals(List<ExceptionInterval> intervals) {
    if (intervals == null || intervals.isEmpty()) {
      return List.of();
    }

    List<TimeWindow> normalized = intervals.stream()
      .map(interval -> {
        LocalTime start = parseTime(interval.start(), "start");
        LocalTime end = parseTime(interval.end(), "end");
        validateStartBeforeEnd(start, end);
        return new TimeWindow(start, end);
      })
      .sorted(Comparator.comparing(TimeWindow::start))
      .toList();
    return normalized;
  }

  private void validateUniqueExceptionDates(List<AvailabilityExceptionValue> exceptions) {
    LocalDate previous = null;
    for (AvailabilityExceptionValue exception : exceptions) {
      if (Objects.equals(previous, exception.date())) {
        throw new ValidationErrorException("exceptions must not repeat the same date.");
      }
      previous = exception.date();
    }
  }

  private void validateNonOverlapping(
    List<WeeklyIntervalValue> intervals,
    String messageTemplate
  ) {
    Map<Integer, List<TimeWindow>> windowsByDay = new LinkedHashMap<>();
    for (WeeklyIntervalValue interval : intervals) {
      windowsByDay
        .computeIfAbsent(interval.dayOfWeek(), ignored -> new ArrayList<>())
        .add(new TimeWindow(interval.start(), interval.end()));
    }

    for (Map.Entry<Integer, List<TimeWindow>> entry : windowsByDay.entrySet()) {
      validateTimeWindows(entry.getValue(), messageTemplate.formatted(entry.getKey()));
    }
  }

  private void validateTimeWindows(List<TimeWindow> windows, String message) {
    TimeWindow previous = null;
    for (TimeWindow window : windows) {
      if (previous != null && window.start().isBefore(previous.end())) {
        throw new ValidationErrorException(message);
      }
      previous = window;
    }
  }

  private void validateStartBeforeEnd(LocalTime start, LocalTime end) {
    if (!end.isAfter(start)) {
      throw new ValidationErrorException("start must be earlier than end.");
    }
  }

  private List<JdbcBarbersRepository.BarberRow> scopedBarbers(RequestScope scope, String barberId) {
    if (barberId == null || barberId.isBlank()) {
      return barbersRepository.listByTenantAndBranch(scope.tenantId(), scope.branchId());
    }

    UUID parsedBarberId = parseUuid(barberId, "barberId");
    return List.of(barbersRepository
      .findByTenantAndBranchAndUserId(scope.tenantId(), scope.branchId(), parsedBarberId)
      .orElseThrow(BarberNotFoundException::new));
  }

  private RequestScope requestScope(Jwt jwt) {
    return requestScope(tenantId(jwt), BranchContext.requireCurrentBranchId());
  }

  private RequestScope requestScope(UUID tenantId, UUID branchId) {
    String timeZone = branchInfoRepository.findTimeZone(tenantId, branchId)
      .orElseThrow(BranchNotFoundException::new);
    return new RequestScope(tenantId, branchId, timeZone, branchZoneId(timeZone));
  }

  private LocalDate parseIsoDate(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException(fieldName + " is required.");
    }

    try {
      return LocalDate.parse(rawValue.trim());
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid ISO date.");
    }
  }

  private LocalTime parseTime(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException(fieldName + " is required.");
    }

    try {
      return LocalTime.parse(rawValue.trim(), TIME_FORMATTER);
    } catch (DateTimeParseException exception) {
      throw new ValidationErrorException(fieldName + " must use HH:mm format.");
    }
  }

  private UUID parseUuid(String rawValue, String fieldName) {
    if (rawValue == null || rawValue.isBlank()) {
      throw new ValidationErrorException(fieldName + " is required.");
    }

    try {
      return UUID.fromString(rawValue.trim());
    } catch (IllegalArgumentException exception) {
      throw new ValidationErrorException(fieldName + " must be a valid UUID.");
    }
  }

  private ZoneId branchZoneId(String timeZone) {
    try {
      return ZoneId.of(timeZone);
    } catch (DateTimeException exception) {
      throw new IllegalStateException("Branch time zone is invalid: " + timeZone, exception);
    }
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }

  private record WeeklyIntervalValue(int dayOfWeek, LocalTime start, LocalTime end) {
  }

  private record RequestScope(UUID tenantId, UUID branchId, String timeZone, ZoneId zoneId) {
  }

  private record ParsedAvailability(
    List<JdbcAvailabilityRepository.WeeklyAvailabilityInsert> weeklyInserts,
    List<JdbcAvailabilityRepository.AvailabilityExceptionInsert> exceptionInserts,
    List<JdbcAvailabilityRepository.ExceptionIntervalInsert> exceptionIntervalInserts
  ) {
  }

  private record DayWindows(Instant fromInclusive, Instant toExclusive) {
  }

  private record TimeWindow(LocalTime start, LocalTime end) {
  }

  private static final class AvailabilityExceptionValue {

    private final UUID id;
    private final LocalDate date;
    private final AvailabilityExceptionType type;
    private final String note;
    private final List<TimeWindow> intervals;

    private AvailabilityExceptionValue(
      UUID id,
      LocalDate date,
      AvailabilityExceptionType type,
      String note,
      List<TimeWindow> intervals
    ) {
      this.id = id;
      this.date = date;
      this.type = type;
      this.note = note;
      this.intervals = intervals;
    }

    UUID id() {
      return id;
    }

    LocalDate date() {
      return date;
    }

    AvailabilityExceptionType type() {
      return type;
    }

    String note() {
      return note;
    }

    List<TimeWindow> intervals() {
      return intervals;
    }
  }

  private record BarberAvailability(
    Map<Integer, List<TimeWindow>> weeklyByDay,
    Map<LocalDate, AvailabilityExceptionValue> exceptionsByDate
  ) {

    static BarberAvailability empty() {
      return new BarberAvailability(Map.of(), Map.of());
    }
  }

  private DayWindows dayWindows(LocalDate targetDate, ZoneId zoneId) {
    return new DayWindows(
      targetDate.atStartOfDay(zoneId).toInstant(),
      targetDate.plusDays(1).atStartOfDay(zoneId).toInstant()
    );
  }
}
