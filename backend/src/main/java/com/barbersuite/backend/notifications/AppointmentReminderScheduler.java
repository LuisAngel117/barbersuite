package com.barbersuite.backend.notifications;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AppointmentReminderScheduler {

  private static final Logger log = LoggerFactory.getLogger(AppointmentReminderScheduler.class);
  private static final Duration REMINDER_WINDOW_START_OFFSET = Duration.ofHours(23);
  private static final Duration REMINDER_WINDOW_END_OFFSET = Duration.ofHours(25);

  private final JdbcAppointmentEmailContextRepository appointmentEmailContextRepository;
  private final NotificationsService notificationsService;
  private final boolean remindersEnabled;

  public AppointmentReminderScheduler(
    JdbcAppointmentEmailContextRepository appointmentEmailContextRepository,
    NotificationsService notificationsService,
    @Value("${notifications.reminders.enabled:true}") boolean remindersEnabled
  ) {
    this.appointmentEmailContextRepository = appointmentEmailContextRepository;
    this.notificationsService = notificationsService;
    this.remindersEnabled = remindersEnabled;
  }

  @Scheduled(fixedDelayString = "${notifications.reminders.delay:60000}")
  public void scheduledRun() {
    if (!remindersEnabled) {
      return;
    }
    runOnce(Instant.now());
  }

  public int runOnce(Instant now) {
    Instant windowStart = now.plus(REMINDER_WINDOW_START_OFFSET);
    Instant windowEnd = now.plus(REMINDER_WINDOW_END_OFFSET);
    List<JdbcAppointmentEmailContextRepository.ReminderCandidate> candidates =
      appointmentEmailContextRepository.listReminderCandidates(windowStart, windowEnd);

    for (JdbcAppointmentEmailContextRepository.ReminderCandidate candidate : candidates) {
      notificationsService.enqueueAppointmentReminder(
        candidate.tenantId(),
        candidate.branchId(),
        candidate.appointmentId(),
        now
      );
    }

    log.info(
      "Appointment reminder scheduler processed candidate appointments. candidates={}, windowStart={}, windowEnd={}",
      candidates.size(),
      windowStart,
      windowEnd
    );
    return candidates.size();
  }
}
