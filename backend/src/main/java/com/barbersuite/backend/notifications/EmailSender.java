package com.barbersuite.backend.notifications;

import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

@Component
public class EmailSender {

  private final JavaMailSender mailSender;
  private final String fromAddress;

  public EmailSender(
    JavaMailSender mailSender,
    @Value("${notifications.email.from:noreply@barbersuite.local}") String fromAddress
  ) {
    this.mailSender = mailSender;
    this.fromAddress = fromAddress;
  }

  public void send(JdbcEmailOutboxWorkerRepository.ClaimedEmailOutboxRow row) {
    jakarta.mail.internet.MimeMessage mimeMessage = mailSender.createMimeMessage();

    try {
      MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, row.bodyHtml() != null, "UTF-8");
      helper.setFrom(fromAddress);
      helper.setTo(row.toEmail());
      helper.setSubject(row.subject());
      if (row.bodyHtml() != null) {
        helper.setText(row.bodyText() == null ? "" : row.bodyText(), row.bodyHtml());
      } else {
        helper.setText(row.bodyText(), false);
      }
    } catch (MessagingException exception) {
      throw new MailPreparationException("Unable to prepare email.", exception);
    }

    mailSender.send(mimeMessage);
  }
}
