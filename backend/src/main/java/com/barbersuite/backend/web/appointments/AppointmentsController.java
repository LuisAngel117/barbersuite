package com.barbersuite.backend.web.appointments;

import com.barbersuite.backend.appointments.AppointmentsService;
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
@RequestMapping("/api/v1/appointments")
public class AppointmentsController {

  private final AppointmentsService appointmentsService;

  public AppointmentsController(AppointmentsService appointmentsService) {
    this.appointmentsService = appointmentsService;
  }

  @GetMapping
  AppointmentListResponse listAppointments(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String date,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(required = false) String barberId,
    @RequestParam(required = false) String status,
    @RequestParam(required = false) String q
  ) {
    return appointmentsService.listAppointments(jwt, date, from, to, barberId, status, q);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  AppointmentResponse createAppointment(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody CreateAppointmentRequest createAppointmentRequest
  ) {
    return appointmentsService.createAppointment(jwt, createAppointmentRequest);
  }

  @GetMapping("/{appointmentId}")
  AppointmentResponse getAppointment(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID appointmentId
  ) {
    return appointmentsService.getAppointment(jwt, appointmentId);
  }

  @PatchMapping("/{appointmentId}")
  AppointmentResponse patchAppointment(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID appointmentId,
    @Valid @RequestBody PatchAppointmentRequest patchAppointmentRequest
  ) {
    return appointmentsService.patchAppointment(jwt, appointmentId, patchAppointmentRequest);
  }
}
