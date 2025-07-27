export class PIIRedactor {
  private static readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    ssn: /\b\d{3}-?\d{2}-?\d{4}\b/g,
    phone: /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
    address: /\b\d+\s+[A-Za-z0-9\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Place|Pl)\b/gi
  };

  private static readonly replacements = {
    email: '[REDACTED_EMAIL]',
    creditCard: '[REDACTED_CARD]',
    ssn: '[REDACTED_SSN]',
    phone: '[REDACTED_PHONE]',
    address: '[REDACTED_ADDRESS]'
  };

  static redactPII(text: string): string {
    let redactedText = text;

    // Apply each pattern replacement
    Object.entries(this.patterns).forEach(([key, pattern]) => {
      const replacement = this.replacements[key as keyof typeof this.replacements];
      redactedText = redactedText.replace(pattern, replacement);
    });

    return redactedText;
  }

  static detectPII(text: string): { type: string; matches: string[] }[] {
    const detectedPII: { type: string; matches: string[] }[] = [];

    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        detectedPII.push({
          type,
          matches: [...new Set(matches)] // Remove duplicates
        });
      }
    });

    return detectedPII;
  }
}