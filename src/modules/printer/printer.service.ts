import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import PdfPrinter from 'pdfmake';

@Injectable()
export class PrinterService {
  private printer: PdfPrinter;

  constructor() {
    const fonts = {
      Arial: {
        normal: 'assets/fonts/arial.ttf',
        bold: 'assets/fonts/arial_narrow.ttf',
        italics: 'assets/fonts/arial_italic.ttf',
      },
    };
    this.printer = new (PdfPrinter as any)(fonts);
  }

  async createPdf(docDefinition: TDocumentDefinitions) {
    return this.printer.createPdfKitDocument(docDefinition);
  }
}
