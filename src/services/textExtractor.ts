import * as pdfjsLib from 'pdfjs-dist';
import Papa from 'papaparse';

// Configure PDF.js worker with multiple CDN fallbacks
const configurePDFWorker = () => {
  const version = pdfjsLib.version;
  const workerUrls = [
    `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.mjs`,
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.mjs`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.mjs`,
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`
  ];
  
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrls[0];
};

configurePDFWorker();

export class TextExtractor {
  static async extractFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Group text items by their Y coordinate to preserve line structure
        const lineGroups = new Map<number, any[]>();
        
        textContent.items.forEach((item: any) => {
          if (item.str && item.str.trim()) {
            // Round Y coordinate to group items on the same line
            const yCoord = Math.round(item.transform[5]);
            if (!lineGroups.has(yCoord)) {
              lineGroups.set(yCoord, []);
            }
            lineGroups.get(yCoord)!.push(item);
          }
        });
        
        // Sort line groups by Y coordinate (top to bottom)
        const sortedLines = Array.from(lineGroups.entries())
          .sort(([y1], [y2]) => y2 - y1); // Higher Y values come first (top of page)
        
        // Build text line by line
        const pageLines = sortedLines.map(([, items]) => {
          // Sort items within a line by X coordinate (left to right)
          const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);
          
          // Join items with appropriate spacing
          let lineText = '';
          let lastX = -1;
          
          sortedItems.forEach((item, index) => {
            const currentX = item.transform[4];
            const text = item.str.trim();
            
            if (text) {
              // Add spacing between items if there's a significant gap
              if (lastX >= 0 && currentX - lastX > 20) {
                lineText += ' ';
              }
              
              lineText += (index === 0 ? '' : ' ') + text;
              lastX = currentX + (item.width || 0);
            }
          });
          
          return lineText.trim();
        }).filter(line => line.length > 0);
        
        fullText += pageLines.join('\n') + '\n';
        
        console.log(`📄 Page ${pageNum} extracted ${pageLines.length} lines`);
        console.log('📄 Sample lines:', pageLines.slice(0, 5));
      }
      
      console.log(`📄 Total extracted text length: ${fullText.length}`);
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