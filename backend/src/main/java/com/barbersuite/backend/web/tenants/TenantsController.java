package com.barbersuite.backend.web.tenants;

import com.barbersuite.backend.tenants.SignupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tenants")
public class TenantsController {

  private final SignupService signupService;

  public TenantsController(SignupService signupService) {
    this.signupService = signupService;
  }

  @PostMapping("/signup")
  @ResponseStatus(HttpStatus.CREATED)
  SignupResponse signup(@Valid @RequestBody SignupRequest signupRequest) {
    return signupService.signup(signupRequest);
  }
}
