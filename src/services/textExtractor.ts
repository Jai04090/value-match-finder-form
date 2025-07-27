import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';

// Configure PDF.js worker with CDN fallback
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export class TextExtractor {
  static async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async extractFromCSV(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (result) => {
          try {
            // Convert CSV data back to text format
            const text = result.data
              .map((row: any) => {
                if (Array.isArray(row)) {
                  return row.join(',');
                }
                return Object.values(row).join(',');
              })
              .join('\n');
            
            resolve(text);
          } catch (error) {
            reject(new Error(`Failed to process CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        },
        error: (error) => {
          reject(new Error(`Failed to parse CSV: ${error.message}`));
        }
      });
    });
  }

  static async extractText(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractFromPDF(file);
    } else if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      return this.extractFromCSV(file);
    } else {
      throw new Error('Unsupported file type. Please upload a PDF or CSV file.');
    }
  }
}