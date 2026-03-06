package com.barbersuite.backend.web.branches;

import com.barbersuite.backend.branches.BranchService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/branches")
public class BranchesController {

  private final BranchService branchService;

  public BranchesController(BranchService branchService) {
    this.branchService = branchService;
  }

  @GetMapping
  List<BranchResponse> listBranches(@AuthenticationPrincipal Jwt jwt) {
    return branchService.listBranches(jwt);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  BranchResponse createBranch(
    @AuthenticationPrincipal Jwt jwt,
    @Valid @RequestBody CreateBranchRequest createBranchRequest
  ) {
    return branchService.createBranch(jwt, createBranchRequest);
  }

  @GetMapping("/{branchId}")
  BranchResponse getBranch(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID branchId) {
    return branchService.getBranch(jwt, branchId);
  }

  @PatchMapping("/{branchId}")
  BranchResponse patchBranch(
    @AuthenticationPrincipal Jwt jwt,
    @PathVariable UUID branchId,
    @Valid @RequestBody PatchBranchRequest patchBranchRequest
  ) {
    return branchService.patchBranch(jwt, branchId, patchBranchRequest);
  }
}
