package com.barbersuite.backend.web.availability;

import com.barbersuite.backend.availability.AvailabilityService;
import com.barbersuite.backend.web.availability.dto.AvailabilityBarberResponse;
import com.barbersuite.backend.web.availability.dto.AvailabilityBarbersResponse;
import com.barbersuite.backend.web.availability.dto.AvailabilitySlotsResponse;
import com.barbersuite.backend.web.availability.dto.PutAvailabilityRequest;
import com.barbersuite.backend.web.branch.BranchRequired;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/availability")
public class AvailabilityController {

  private final AvailabilityService availabilityService;

  public AvailabilityController(AvailabilityService availabilityService) {
    this.availabilityService = availabilityService;
  }

  @GetMapping("/barbers")
  AvailabilityBarbersResponse barbersAvailability(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String barberId
  ) {
    return availabilityService.listBarbersAvailability(jwt, barberId);
  }

  @PutMapping("/barbers/{barberId}")
  AvailabilityBarberResponse replaceBarberAvailability(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID barberId,
    @Valid @RequestBody PutAvailabilityRequest request
  ) {
    return availabilityService.putBarberAvailability(jwt, barberId, request);
  }

  @GetMapping("/slots")
  AvailabilitySlotsResponse slots(
    @AuthenticationPrincipal Jwt jwt,
    @RequestParam(required = false) String date,
    @RequestParam(required = false) String serviceId,
    @RequestParam(required = false) String barberId
  ) {
    return availabilityService.getSlots(jwt, date, serviceId, barberId);
  }
}
