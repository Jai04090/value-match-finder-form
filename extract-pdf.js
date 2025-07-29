const fs = require('fs');
const path = require('path');

// Simple text extraction - we'll read the PDF as binary and look for text patterns
async function extractTextFromPDF(pdfPath) {
  try {
    const buffer = fs.readFileSync(pdfPath);
    
    // Convert buffer to string and look for common patterns
    const text = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
    
    console.log('PDF Content (first 10KB):');
    console.log('='.repeat(50));
    console.log(text);
    console.log('='.repeat(50));
    
    // Also try to find transaction-like patterns
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log('\nPotential transaction lines:');
    lines.forEach((line, index) => {
      if (line.match(/\d{1,2}[\/\-]\d{1,2}/) || line.match(/\$\d+\.\d{2}/)) {
        console.log(`${index + 1}: ${line}`);
      }
    });
    
  } catch (error) {
    console.error('Error reading PDF:', error.message);
  }
}

// Extract text from the PDF
extractTextFromPDF('./lovable bank ex 3.pdf'); 