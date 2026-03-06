package com.barbersuite.backend.web.staffadmin;

import com.barbersuite.backend.staffadmin.StaffAdminService;
import com.barbersuite.backend.web.staffadmin.dto.BarberDetailResponse;
import com.barbersuite.backend.web.staffadmin.dto.BarberListResponse;
import com.barbersuite.backend.web.staffadmin.dto.CreateBarberRequest;
import com.barbersuite.backend.web.staffadmin.dto.PatchBarberRequest;
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
@RequestMapping("/api/v1/staff/barbers")
public class StaffAdminBarbersController {

  private final StaffAdminService staffAdminService;

  public StaffAdminBarbersController(StaffAdminService staffAdminService) {
    this.staffAdminService = staffAdminService;
  }

  @GetMapping
  BarberListResponse listBarbers(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String active,
    @RequestParam(required = false) String q,
    @RequestParam(required = false) String branchId
  ) {
    return staffAdminService.listBarbers(jwt, active, q, branchId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  BarberDetailResponse createBarber(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody CreateBarberRequest createBarberRequest
  ) {
    return staffAdminService.createBarber(jwt, createBarberRequest);
  }

  @GetMapping("/{barberId}")
  BarberDetailResponse getBarber(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID barberId) {
    return staffAdminService.getBarber(jwt, barberId);
  }

  @PatchMapping("/{barberId}")
  BarberDetailResponse patchBarber(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID barberId,
    @Valid @RequestBody PatchBarberRequest patchBarberRequest
  ) {
    return staffAdminService.patchBarber(jwt, barberId, patchBarberRequest);
  }
}
