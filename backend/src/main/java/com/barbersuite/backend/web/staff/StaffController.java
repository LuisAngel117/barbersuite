package com.barbersuite.backend.web.staff;

import com.barbersuite.backend.staff.StaffService;
import com.barbersuite.backend.web.branch.BranchRequired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@BranchRequired
@RequestMapping("/api/v1/barbers")
public class StaffController {

  private final StaffService staffService;

  public StaffController(StaffService staffService) {
    this.staffService = staffService;
  }

  @GetMapping
  BarbersResponse listBarbers(@AuthenticationPrincipal Jwt jwt) {
    return staffService.listBarbers(jwt);
  }
}
