import type { StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
import path from 'path';
import fs from 'fs';

const styles: StyleDictionary = {
  header: {
    fontSize: 16,
    bold: true,
    color: '#525659',
  },
  subheader: {
    fontSize: 10,
    bold: true,
    color: '#525659',
  },
  tableHeader: {
    bold: true,
    fillColor: '#eeeeee',
  },
};

export const generateBillPDF = async (
  sale,
  cart,
): Promise<TDocumentDefinitions> => {
  const imagePath = path.join(
    process.cwd(),
    'assets',
    'logoVortexSoftware.png',
  );
  const billFooter = path.join(process.cwd(), 'assets', 'billFooter.png');

  const base64Image = fs.readFileSync(imagePath, 'base64');
  const base64ImageFooter = fs.readFileSync(billFooter, 'base64');

  const saleDate = new Date(sale.date).toLocaleDateString();

  const tableBody = cart.cartLines.map((line) => [
    line.product.name,
    line.quantity,
    `$${line.product.price.toFixed(2)}`,
    `$${line.subtotal.toFixed(2)}`,
  ]);

  return {
    defaultStyle: {
      fontSize: 10,
      font: 'Arial',
      color: '#43484C',
    },
    pageSize: 'A4',
    pageMargins: [30, 25, 30, 80], 
    footer: {
      stack: [
        {
          image: `data:image/png;base64,${base64ImageFooter}`,
          width: 550,
          height: 70,
          alignment: 'center',
        }
      ],
    },
    
    content: [
      {
        image: `data:image/png;base64,${base64Image}`,
        width: 150,
        margin: [0, 10, 0, 20],
      },
      { text: 'Factura de Venta', style: 'header', margin: [0, 0, 0, 10] },
      { text: `Fecha: ${saleDate}`, style: 'subheader' },
      {
        text: `Cliente: ${cart.user.name}`,
        style: 'subheader',
        margin: [0, 0, 0, 10],
      },

      { text: 'Detalle de venta:', style: 'subheader', margin: [0, 10, 0, 5] },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Producto', style: 'tableHeader' },
              { text: 'Cantidad', style: 'tableHeader' },
              { text: 'Precio Unitario', style: 'tableHeader' },
              { text: 'Subtotal', style: 'tableHeader' },
            ],
            ...tableBody,
          ],
        },
      },

      {
        margin: [0, 10, 0, 10],
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Subtotal sin IVA:', style: 'subheader' },
              { text: `$${(cart.total / 1.21).toFixed(2)}`, alignment: 'right' },
            ],
            [
              { text: 'IVA (21%):', style: 'subheader' },
              { text: `$${(cart.total - cart.total / 1.21).toFixed(2)}`, alignment: 'right' },
            ],
            [
              { text: 'Otros impuestos:', style: 'subheader' },
              { text: `$${(cart.total * 0.02).toFixed(2)}`, alignment: 'right' },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },

      {
        text: `Total: $${cart.total.toFixed(2)}`,
        style: 'header',
        margin: [0, 10, 0, 0],
      },
    ],
    styles: {
      header: { fontSize: 12, bold: true },
      subheader: { fontSize: 10, bold: true },
      tableHeader: { fontSize: 10, bold: true, fillColor: '#eeeeee' },
    },
  };
};



