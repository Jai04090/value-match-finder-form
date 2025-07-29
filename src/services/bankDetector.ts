export interface BankProfile {
  name: string;
  patterns: RegExp[];
  dateFormats: string[];
  transactionFormats: string[];
  currency: string;
  features: string[];
}

export class BankDetector {
  private static readonly bankProfiles: Record<string, BankProfile> = {
    wellsFargo: {
      name: 'Wells Fargo',
      patterns: [
        /wells\s*fargo/i,
        /business\s*bank\s*statement/i,
        /business\s*choice\s*checking/i
      ],
      dateFormats: ['MM/DD/YYYY', 'MM/DD'],
      transactionFormats: ['tabular', 'narrative'],
      currency: 'USD',
      features: ['running_balance', 'check_numbers', 'atm_withdrawals']
    },
    bankOfAmerica: {
      name: 'Bank of America',
      patterns: [
        /bank\s*of\s*america/i,
        /bofa/i,
        /b\s*of\s*a/i
      ],
      dateFormats: ['MM/DD/YYYY', 'YYYY-MM-DD'],
      transactionFormats: ['tabular', 'csv'],
      currency: 'USD',
      features: ['merchant_codes', 'location_data']
    },
    chase: {
      name: 'Chase',
      patterns: [
        /jp\s*morgan\s*chase/i,
        /chase\s*bank/i,
        /chase/i
      ],
      dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY'],
      transactionFormats: ['tabular', 'detailed'],
      currency: 'USD',
      features: ['merchant_categories', 'reference_numbers']
    },
    citi: {
      name: 'Citibank',
      patterns: [
        /citibank/i,
        /citi/i,
        /citibusiness/i
      ],
      dateFormats: ['DD/MM/YYYY', 'MM/DD/YYYY'],
      transactionFormats: ['narrative', 'structured'],
      currency: 'USD',
      features: ['detailed_descriptions', 'foreign_exchange']
    },
    usBank: {
      name: 'US Bank',
      patterns: [
        /u\.?s\.?\s*bank/i,
        /usbank/i,
        /us\s*bancorp/i
      ],
      dateFormats: ['MM/DD/YYYY'],
      transactionFormats: ['simple', 'tabular'],
      currency: 'USD',
      features: ['basic_categories']
    },
    generic: {
      name: 'Generic Bank',
      patterns: [
        /bank\s*statement/i,
        /account\s*statement/i,
        /transaction\s*history/i
      ],
      dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'],
      transactionFormats: ['auto_detect'],
      currency: 'USD',
      features: ['adaptive_parsing']
    }
  };

  static detectBank(text: string): BankProfile {
    console.log('🏦 Detecting bank from statement...');
    
    const textSample = text.substring(0, 2000).toLowerCase();
    
    for (const [key, profile] of Object.entries(this.bankProfiles)) {
      if (key === 'generic') continue; // Skip generic for primary detection
      
      const isMatch = profile.patterns.some(pattern => pattern.test(textSample));
      if (isMatch) {
        console.log(`🏦 Detected bank: ${profile.name}`);
        return profile;
      }
    }
    
    console.log('🏦 No specific bank detected, using generic profile');
    return this.bankProfiles.generic;
  }

  static getAllBankProfiles(): Record<string, BankProfile> {
    return { ...this.bankProfiles };
  }

  static addCustomBankProfile(key: string, profile: BankProfile): void {
    this.bankProfiles[key] = profile;
  }
}