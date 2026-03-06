package com.barbersuite.backend.web.reports;

import com.barbersuite.backend.reports.ReportsService;
import com.barbersuite.backend.web.branch.BranchRequired;
import com.barbersuite.backend.web.reports.dto.AppointmentsSummaryResponse;
import com.barbersuite.backend.web.reports.dto.BarbersSummaryResponse;
import com.barbersuite.backend.web.reports.dto.SalesDailyResponse;
import com.barbersuite.backend.web.reports.dto.SalesSummaryResponse;
import com.barbersuite.backend.web.reports.dto.TopServicesResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/reports")
public class ReportsController {

  private final ReportsService reportsService;

  public ReportsController(ReportsService reportsService) {
    this.reportsService = reportsService;
  }

  @GetMapping("/sales/summary")
  SalesSummaryResponse salesSummary(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to
  ) {
    return reportsService.salesSummary(jwt, from, to);
  }

  @GetMapping("/sales/daily")
  SalesDailyResponse salesDaily(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to
  ) {
    return reportsService.salesDaily(jwt, from, to);
  }

  @GetMapping("/services/top")
  TopServicesResponse topServices(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to,
    @RequestParam(required = false) Integer limit
  ) {
    return reportsService.topServices(jwt, from, to, limit);
  }

  @GetMapping("/appointments/summary")
  AppointmentsSummaryResponse appointmentsSummary(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to
  ) {
    return reportsService.appointmentsSummary(jwt, from, to);
  }

  @GetMapping("/barbers/summary")
  BarbersSummaryResponse barbersSummary(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String from,
    @RequestParam(required = false) String to
  ) {
    return reportsService.barbersSummary(jwt, from, to);
  }
}
