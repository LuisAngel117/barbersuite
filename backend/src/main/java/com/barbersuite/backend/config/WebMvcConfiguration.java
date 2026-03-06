package com.barbersuite.backend.config;

import com.barbersuite.backend.web.branch.BranchContextInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class WebMvcConfiguration implements WebMvcConfigurer {

  private final BranchContextInterceptor branchContextInterceptor;

  public WebMvcConfiguration(BranchContextInterceptor branchContextInterceptor) {
    this.branchContextInterceptor = branchContextInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry.addInterceptor(branchContextInterceptor);
  }
}
