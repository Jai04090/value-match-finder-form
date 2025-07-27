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

    // Post-redaction cleanup: remove trailing fragments after redacted patterns
    redactedText = this.cleanupTrailingFragments(redactedText);

    return redactedText;
  }

  private static cleanupTrailingFragments(text: string): string {
    // Remove trailing digits/text after redacted patterns
    let cleanedText = text;
    
    // Clean up patterns like "[REDACTED_PHONE] UT 81.REDACTED_ADDRESS 813"
    cleanedText = cleanedText.replace(/\[REDACTED_PHONE\]\s+[A-Z]{2}\s+\d+\.\[?REDACTED_[A-Z]+\]?\s*\d*/g, '[REDACTED_PHONE]');
    cleanedText = cleanedText.replace(/\[REDACTED_ADDRESS\]\s+\d+/g, '[REDACTED_ADDRESS]');
    cleanedText = cleanedText.replace(/\[REDACTED_EMAIL\]\s+[A-Za-z0-9\s]*\d+/g, '[REDACTED_EMAIL]');
    
    // Enhanced cleanup for address fragments like "/2 1255", ZIP codes, state codes
    cleanedText = cleanedText.replace(/\[REDACTED_ADDRESS\][\/\s]+\d+\s*\d*/g, '[REDACTED_ADDRESS]');
    cleanedText = cleanedText.replace(/\[REDACTED_ADDRESS\]\s*[A-Z]{2}[\/\s]*\d*/g, '[REDACTED_ADDRESS]');
    cleanedText = cleanedText.replace(/\[REDACTED_PHONE\][\/\s]+[A-Z]{2}[\/\s]*\d*/g, '[REDACTED_PHONE]');
    
    // Remove ZIP codes and fragments after any redacted pattern
    cleanedText = cleanedText.replace(/\[REDACTED_[A-Z]+\][\/\s]*\d{2,5}[\/\s]*\d*/g, (match) => {
      return match.match(/\[REDACTED_[A-Z]+\]/)?.[0] || match;
    });
    
    // Remove punctuation and number fragments after redacted content
    cleanedText = cleanedText.replace(/\[REDACTED_[A-Z]+\][\/,\s]*[A-Z]{1,2}[\/,\s]*\d*/g, (match) => {
      return match.match(/\[REDACTED_[A-Z]+\]/)?.[0] || match;
    });
    
    // Remove standalone digits that might be fragments
    cleanedText = cleanedText.replace(/\[REDACTED_[A-Z]+\]\s+\d{1,4}(?!\d)/g, (match) => {
      return match.replace(/\s+\d{1,4}$/, '');
    });
    
    return cleanedText;
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