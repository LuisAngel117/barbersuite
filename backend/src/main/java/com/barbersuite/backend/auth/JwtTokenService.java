package com.barbersuite.backend.auth;

import com.barbersuite.backend.config.JwtProperties;
import java.time.Instant;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

@Service
public class JwtTokenService {

  private final JwtEncoder jwtEncoder;
  private final JwtProperties jwtProperties;

  public JwtTokenService(JwtEncoder jwtEncoder, JwtProperties jwtProperties) {
    this.jwtEncoder = jwtEncoder;
    this.jwtProperties = jwtProperties;
  }

  public String issueToken(AuthUser authUser) {
    Instant issuedAt = Instant.now();
    Instant expiresAt = issuedAt.plus(jwtProperties.accessTokenTtl());

    JwtClaimsSet claimsSet = JwtClaimsSet.builder()
      .issuer(jwtProperties.issuer())
      .subject(authUser.userId().toString())
      .issuedAt(issuedAt)
      .expiresAt(expiresAt)
      .claim("tenantId", authUser.tenantId().toString())
      .claim("userId", authUser.userId().toString())
      .claim("roles", authUser.roles())
      .build();

    JwsHeader jwsHeader = JwsHeader.with(MacAlgorithm.HS256).build();
    return jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claimsSet)).getTokenValue();
  }
}
