package com.barbersuite.backend.notificationsconfig;

import com.barbersuite.backend.notifications.EmailKind;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class NotificationEmailTemplateDefaults {

  private static final List<EmailKind> SUPPORTED_KINDS = List.of(
    EmailKind.appointment_confirmation,
    EmailKind.appointment_reminder,
    EmailKind.appointment_rescheduled,
    EmailKind.appointment_cancelled
  );

  private static final Map<EmailKind, TemplateDefinition> DEFAULTS = Map.of(
    EmailKind.appointment_confirmation,
    new TemplateDefinition(
      true,
      "Confirmacion de cita - ${branchCode}",
      appointmentBody("Tu cita fue registrada en BarberSuite."),
      null
    ),
    EmailKind.appointment_reminder,
    new TemplateDefinition(
      true,
      "Recordatorio de cita - ${branchCode}",
      appointmentBody("Te recordamos tu cita programada en BarberSuite."),
      null
    ),
    EmailKind.appointment_rescheduled,
    new TemplateDefinition(
      true,
      "Tu cita fue reprogramada - ${branchCode}",
      appointmentBody("Tu cita fue reprogramada en BarberSuite."),
      null
    ),
    EmailKind.appointment_cancelled,
    new TemplateDefinition(
      true,
      "Tu cita fue cancelada - ${branchCode}",
      appointmentBody("Tu cita fue cancelada en BarberSuite."),
      null
    )
  );

  public List<EmailKind> supportedKinds() {
    return SUPPORTED_KINDS;
  }

  public TemplateDefinition templateFor(EmailKind kind) {
    TemplateDefinition templateDefinition = DEFAULTS.get(kind);
    if (templateDefinition == null) {
      throw new IllegalArgumentException("Unsupported notification email template kind: " + kind);
    }
    return templateDefinition;
  }

  private static String appointmentBody(String openingLine) {
    return """
${greetingLine}%s
Sucursal: ${branchName} (${branchCode})
Servicio: ${serviceName}
Barbero: ${barberName}
Inicio: ${startAtLocal}
Fin: ${endAtLocal}
Zona horaria: ${branchTimeZone}
""".formatted(openingLine);
  }

  public record TemplateDefinition(
    boolean enabled,
    String subjectTemplate,
    String bodyTextTemplate,
    String bodyHtmlTemplate
  ) {
  }
}
