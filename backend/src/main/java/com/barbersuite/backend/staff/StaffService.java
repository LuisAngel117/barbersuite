package com.barbersuite.backend.staff;

import com.barbersuite.backend.context.BranchContext;
import com.barbersuite.backend.web.staff.BarberItem;
import com.barbersuite.backend.web.staff.BarbersResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StaffService {

  private final JdbcBarbersRepository barbersRepository;

  public StaffService(JdbcBarbersRepository barbersRepository) {
    this.barbersRepository = barbersRepository;
  }

  @Transactional(readOnly = true)
  public BarbersResponse listBarbers(Jwt jwt) {
    UUID tenantId = tenantId(jwt);
    UUID branchId = BranchContext.requireCurrentBranchId();
    List<BarberItem> items = barbersRepository.listByTenantAndBranch(tenantId, branchId).stream()
      .map(barberRow -> new BarberItem(barberRow.id(), barberRow.fullName(), barberRow.active()))
      .toList();
    return new BarbersResponse(items);
  }

  private UUID tenantId(Jwt jwt) {
    String claimValue = jwt.getClaimAsString("tenantId");
    if (claimValue == null || claimValue.isBlank()) {
      throw new IllegalStateException("Missing JWT claim: tenantId");
    }
    return UUID.fromString(claimValue);
  }
}
