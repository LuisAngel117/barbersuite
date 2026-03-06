package com.barbersuite.backend.auth;

import com.barbersuite.backend.config.JwtProperties;
import com.barbersuite.backend.web.auth.LoginRequest;
import com.barbersuite.backend.web.auth.LoginResponse;
import com.barbersuite.backend.web.error.InvalidCredentialsException;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final JdbcAuthUserRepository authUserRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;
  private final JwtProperties jwtProperties;

  public AuthService(
    JdbcAuthUserRepository authUserRepository,
    PasswordEncoder passwordEncoder,
    JwtTokenService jwtTokenService,
    JwtProperties jwtProperties
  ) {
    this.authUserRepository = authUserRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
    this.jwtProperties = jwtProperties;
  }

  public LoginResponse login(LoginRequest loginRequest) {
    String normalizedEmail = loginRequest.email().trim().toLowerCase(Locale.ROOT);
    AuthUser authUser = authUserRepository.findByEmail(normalizedEmail)
      .orElseThrow(InvalidCredentialsException::new);

    if (!passwordEncoder.matches(loginRequest.password(), authUser.passwordHash())) {
      throw new InvalidCredentialsException();
    }

    return new LoginResponse(
      jwtTokenService.issueToken(authUser),
      "Bearer",
      jwtProperties.accessTokenTtl().toSeconds()
    );
  }
}
