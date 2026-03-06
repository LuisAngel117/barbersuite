package com.barbersuite.backend.config;

import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.http.HttpMethod.GET;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.nimbusds.jose.proc.SecurityContext;
import com.barbersuite.backend.observability.RequestIdFilter;
import com.barbersuite.backend.security.TenantContextFilter;
import com.barbersuite.backend.security.ProblemAccessDeniedHandler;
import com.barbersuite.backend.security.ProblemAuthenticationEntryPoint;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.security.autoconfigure.actuate.web.servlet.EndpointRequest;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfiguration {

  @Bean
  SecurityFilterChain securityFilterChain(
    HttpSecurity http,
    Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter,
    RequestIdFilter requestIdFilter,
    TenantContextFilter tenantContextFilter
  ) throws Exception {
    com.fasterxml.jackson.databind.ObjectMapper objectMapper =
      new com.fasterxml.jackson.databind.ObjectMapper();

    http
      .csrf(AbstractHttpConfigurer::disable)
      .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(authorize -> authorize
        .requestMatchers(EndpointRequest.to("health", "prometheus")).permitAll()
        .requestMatchers(POST, "/api/v1/auth/login").permitAll()
        .requestMatchers(POST, "/api/v1/tenants/signup").permitAll()
        .requestMatchers(GET, "/api/v1/health", "/api/v1/health/**").permitAll()
        .requestMatchers("/api/v1/notifications/email/**").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers(GET, "/api/v1/reports/**").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers("/api/v1/staff/**").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers(GET, "/api/v1/receipts", "/api/v1/receipts/**")
          .hasAnyRole("ADMIN", "MANAGER", "RECEPTION")
        .requestMatchers(POST, "/api/v1/receipts/*/void").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers(POST, "/api/v1/receipts").hasAnyRole("ADMIN", "MANAGER", "RECEPTION")
        .requestMatchers(GET, "/api/v1/barbers").authenticated()
        .requestMatchers(GET, "/api/v1/appointments", "/api/v1/appointments/**").authenticated()
        .requestMatchers(POST, "/api/v1/appointments").hasAnyRole("ADMIN", "MANAGER", "RECEPTION")
        .requestMatchers(PATCH, "/api/v1/appointments/**")
          .hasAnyRole("ADMIN", "MANAGER", "RECEPTION")
        .requestMatchers("/api/v1/branches", "/api/v1/branches/**").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers(GET, "/api/v1/clients", "/api/v1/clients/**").authenticated()
        .requestMatchers(POST, "/api/v1/clients").authenticated()
        .requestMatchers(PATCH, "/api/v1/clients/**").hasAnyRole("ADMIN", "MANAGER", "RECEPTION")
        .requestMatchers(POST, "/api/v1/services").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers(PATCH, "/api/v1/services/**").hasAnyRole("ADMIN", "MANAGER")
        .requestMatchers("/error").permitAll()
        .anyRequest().authenticated()
      )
      .exceptionHandling(exceptionHandling -> exceptionHandling
        .authenticationEntryPoint(new ProblemAuthenticationEntryPoint(objectMapper))
        .accessDeniedHandler(new ProblemAccessDeniedHandler(objectMapper))
      )
      .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(
        jwtAuthenticationConverter
      )))
      .addFilterBefore(requestIdFilter, BearerTokenAuthenticationFilter.class)
      .addFilterAfter(tenantContextFilter, BearerTokenAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  TenantContextFilter tenantContextFilter() {
    return new TenantContextFilter();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  SecretKey jwtSecretKey(JwtProperties jwtProperties) {
    return new SecretKeySpec(
      jwtProperties.secret().getBytes(StandardCharsets.UTF_8),
      "HmacSHA256"
    );
  }

  @Bean
  JwtEncoder jwtEncoder(SecretKey jwtSecretKey) {
    return new NimbusJwtEncoder(new ImmutableSecret<SecurityContext>(jwtSecretKey));
  }

  @Bean
  JwtDecoder jwtDecoder(SecretKey jwtSecretKey) {
    return NimbusJwtDecoder.withSecretKey(jwtSecretKey)
      .macAlgorithm(MacAlgorithm.HS256)
      .build();
  }

  @Bean
  Converter<Jwt, ? extends AbstractAuthenticationToken> jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter grantedAuthoritiesConverter =
      new JwtGrantedAuthoritiesConverter();
    grantedAuthoritiesConverter.setAuthoritiesClaimName("roles");
    grantedAuthoritiesConverter.setAuthorityPrefix("ROLE_");

    JwtAuthenticationConverter jwtAuthenticationConverter = new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(grantedAuthoritiesConverter);
    return jwtAuthenticationConverter;
  }
}
