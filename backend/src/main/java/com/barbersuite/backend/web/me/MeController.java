package com.barbersuite.backend.web.me;

import com.barbersuite.backend.me.MeService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class MeController {

  private final MeService meService;

  public MeController(MeService meService) {
    this.meService = meService;
  }

  @GetMapping("/me")
  MeResponse me(@AuthenticationPrincipal Jwt jwt) {
    return meService.getCurrentIdentity(jwt);
  }
}
