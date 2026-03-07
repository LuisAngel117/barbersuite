package com.barbersuite.backend.notifications;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class NotificationTemplateRenderer {

  private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\$\\{([A-Za-z0-9_]+)\\}");

  public String render(String template, Map<String, String> variables) {
    if (template == null) {
      return null;
    }

    Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);
    StringBuffer output = new StringBuffer();

    while (matcher.find()) {
      String variableName = matcher.group(1);
      String replacement = variables.getOrDefault(variableName, "");
      matcher.appendReplacement(output, Matcher.quoteReplacement(replacement));
    }

    matcher.appendTail(output);
    return output.toString();
  }
}
