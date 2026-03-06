package com.barbersuite.backend.me;

import com.barbersuite.backend.web.me.MeResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class MeService {

  private final JdbcMeRepository meRepository;

  public MeService(JdbcMeRepository meRepository) {
    this.meRepository = meRepository;
  }

  public MeResponse getCurrentIdentity(Jwt jwt) {
    UUID tenantId = uuidClaim(jwt, "tenantId");
    UUID userId = uuidClaim(jwt, "userId");
    List<String> roles = rolesClaim(jwt);

    JdbcMeRepository.TenantRow tenant = meRepository.findTenantById(tenantId)
      .orElseThrow(() -> new IllegalStateException("Authenticated tenant does not exist."));
    JdbcMeRepository.UserRow user = meRepository.findUserByTenantIdAndId(tenantId, userId)
      .orElseThrow(() -> new IllegalStateException("Authenticated user does not exist."));

    List<MeResponse.BranchView> branches = meRepository.findAccessibleBranches(tenantId, userId).stream()
      .map(branch -> new MeResponse.BranchView(
        branch.id(),
        branch.name(),
        branch.code(),
        branch.timeZone(),
        branch.active()
      ))
      .toList();

    return new MeResponse(
      new MeResponse.TenantView(tenant.id(), tenant.name()),
      new MeResponse.UserView(user.id(), user.fullName(), user.email(), roles),
      branches
    );
  }

  private static UUID uuidClaim(Jwt jwt, String claimName) {
    String claimValue = jwt.getClaimAsString(claimName);
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: " + claimName);
    }
    return UUID.fromString(claimValue);
  }

  private static List<String> rolesClaim(Jwt jwt) {
    List<String> roles = jwt.getClaimAsStringList("roles");
    return roles == null ? List.of() : List.copyOf(roles);
  }
}
