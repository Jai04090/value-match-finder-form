// Test script to validate parsing improvements
const sampleData = `Wells Fargo Bank Statement
Account Number: ****1234
Statement Period: 07/01/2018 - 07/31/2018

Date Description Amount
07/01/2018 Fee period - / $14.00
07/18/2018 Recurring $27759.16
07/23/2018 Stripe Transfer x $2694.84
07/23/2018 Online $470.00
07/25/2018 Online $24994.61
07/26/2018 Recurring $149.00
07/27/2018 Pennymac $3093.15

Total Deposits: $2694.84
Total Withdrawals: $56480.92`;

console.log('Testing improved parsing with sample data...');
console.log('='.repeat(50));
console.log('Original data:');
console.log(sampleData);
console.log('='.repeat(50));

// Simulate the parsing process
const lines = sampleData.split('\n');
const transactions = [];

for (const line of lines) {
  // Skip header lines
  if (line.includes('Date Description Amount') || 
      line.includes('Statement Period') || 
      line.includes('Account Number') ||
      line.includes('Total')) {
    continue;
  }
  
  // Try to parse transaction lines
  const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/);
  const amountMatch = line.match(/\$([\d,]+\.\d{2})/);
  
  if (dateMatch && amountMatch) {
    const date = dateMatch[1];
    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    
    // Extract merchant (everything between date and amount)
    const merchantStart = line.indexOf(date) + date.length;
    const merchantEnd = line.lastIndexOf('$');
    let merchant = line.substring(merchantStart, merchantEnd).trim();
    
    // Clean merchant name
    merchant = cleanMerchantName(merchant);
    
    if (merchant && amount > 0 && amount <= 50000) {
      transactions.push({
        date: normalizeDate(date, 2018),
        merchant: merchant,
        amount: amount
      });
    }
  }
}

console.log('\nParsed transactions:');
transactions.forEach((t, i) => {
  console.log(`${i + 1}. ${t.date} | ${t.merchant} | $${t.amount.toFixed(2)}`);
});

// Helper functions (simplified versions)
function cleanMerchantName(rawMerchant) {
  if (!rawMerchant || typeof rawMerchant !== 'string') return '';
  
  let merchant = rawMerchant.trim();
  
  // Remove generic terms
  const genericTerms = [
    /^Fee period\s*[\/\-]\s*$/i,
    /^Recurring\s*$/i,
    /^Online\s*$/i,
    /^Transfer\s*x\s*$/i
  ];
  
  genericTerms.forEach(pattern => {
    merchant = merchant.replace(pattern, '');
  });
  
  // Remove artifacts
  merchant = merchant.replace(/\s*Transfer\s*x\s*$/i, '');
  merchant = merchant.replace(/\s*period\s*[\/\-]\s*$/i, '');
  
  return merchant.trim();
}

function normalizeDate(dateStr, currentYear) {
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, month, day, year] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

console.log('\nExpected improvements:');
console.log('- "Fee period - /" should be rejected or cleaned');
console.log('- "Recurring" should be rejected as too generic');
console.log('- "Stripe Transfer x" should become "Stripe Transfer"');
console.log('- "Online" should be rejected as too generic');
console.log('- Large amounts should be validated');
console.log('- Pennymac should be properly categorized as Banking'); 