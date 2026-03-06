package com.barbersuite.backend.tenants;

import com.barbersuite.backend.auth.AuthUser;
import com.barbersuite.backend.auth.JwtTokenService;
import com.barbersuite.backend.config.JwtProperties;
import com.barbersuite.backend.web.error.AdminEmailAlreadyExistsException;
import com.barbersuite.backend.web.error.InvalidTimeZoneException;
import java.sql.SQLException;
import com.barbersuite.backend.web.tenants.SignupRequest;
import com.barbersuite.backend.web.tenants.SignupResponse;
import java.time.DateTimeException;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignupService {

  private static final String ADMIN_ROLE = "ADMIN";
  private static final String UNIQUE_VIOLATION_SQL_STATE = "23505";
  private static final String USERS_EMAIL_GLOBAL_UNIQUE_INDEX = "ux_users_email_global_lower";

  private final JdbcSignupRepository signupRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtTokenService jwtTokenService;
  private final JwtProperties jwtProperties;

  public SignupService(
    JdbcSignupRepository signupRepository,
    PasswordEncoder passwordEncoder,
    JwtTokenService jwtTokenService,
    JwtProperties jwtProperties
  ) {
    this.signupRepository = signupRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtTokenService = jwtTokenService;
    this.jwtProperties = jwtProperties;
  }

  @Transactional
  public SignupResponse signup(SignupRequest signupRequest) {
    String normalizedEmail = signupRequest.adminEmail().trim().toLowerCase(Locale.ROOT);
    String normalizedFullName = signupRequest.adminFullName().trim();
    if (signupRepository.existsUserByEmail(normalizedEmail)) {
      throw new AdminEmailAlreadyExistsException();
    }

    String timeZone = validateTimeZone(signupRequest.timeZone());
    UUID tenantId = UUID.randomUUID();
    UUID branchId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    UUID accessId = UUID.randomUUID();

    try {
      signupRepository.insertTenant(tenantId, signupRequest.tenantName().trim());
      signupRepository.insertBranch(
        branchId,
        tenantId,
        signupRequest.branchCode().trim().toUpperCase(Locale.ROOT),
        signupRequest.branchName().trim(),
        timeZone
      );
      signupRepository.insertUser(
        userId,
        tenantId,
        normalizedFullName,
        normalizedEmail,
        passwordEncoder.encode(signupRequest.adminPassword())
      );
      signupRepository.insertUserRole(tenantId, userId, ADMIN_ROLE);
      signupRepository.insertUserBranchAccess(accessId, tenantId, userId, branchId);
    } catch (DataIntegrityViolationException exception) {
      if (isAdminEmailConflict(exception)) {
        throw new AdminEmailAlreadyExistsException();
      }
      throw exception;
    }

    String accessToken = jwtTokenService.issueToken(new AuthUser(
      tenantId,
      userId,
      normalizedEmail,
      "",
      List.of(ADMIN_ROLE)
    ));

    return new SignupResponse(
      tenantId,
      branchId,
      userId,
      accessToken,
      "Bearer",
      Math.toIntExact(jwtProperties.accessTokenTtl().toSeconds())
    );
  }

  private String validateTimeZone(String timeZone) {
    String normalizedTimeZone = timeZone.trim();
    try {
      ZoneId.of(normalizedTimeZone);
      return normalizedTimeZone;
    } catch (DateTimeException exception) {
      throw new InvalidTimeZoneException();
    }
  }

  private boolean isAdminEmailConflict(DataIntegrityViolationException exception) {
    Throwable cause = NestedExceptionUtils.getMostSpecificCause(exception);
    if (!(cause instanceof SQLException sqlException)) {
      return false;
    }

    return UNIQUE_VIOLATION_SQL_STATE.equals(sqlException.getSQLState()) &&
    sqlException.getMessage() != null &&
    sqlException.getMessage().contains(USERS_EMAIL_GLOBAL_UNIQUE_INDEX);
  }
}
