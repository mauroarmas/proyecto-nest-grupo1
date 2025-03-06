import type { StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';
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
};

export const generatePDF = async (
  chartBuffer: Buffer,
): Promise<TDocumentDefinitions> => {
  const chartBase64 = chartBuffer.toString('base64');
  const chartImage = `data:image/png;base64,${chartBase64}`;

  return {
    defaultStyle: {
      fontSize: 10,
      font: 'Arial',
      characterSpacing: -0.7,
      color: '#43484C',
    },
    pageSize: 'A4',
    pageMargins: [30, 25],
    content: [
      {
        text: 'Reporte de Compras',
        style: 'header',
        margin: [0, 0, 0, 20],
      },
      {
        text: 'La siguiente gráfica muestra el monto total de compras por fecha:',
        style: 'subheader',
        margin: [0, 0, 0, 10],
      },
      {
        image: chartImage,
        width: 500,
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
    ],
    styles: styles,
  };
};
export const generatePDFincomes = async (
  chartBuffer: Buffer,
  salesData: { date: string; total: number }[],
): Promise<TDocumentDefinitions> => {
  const chartBase64 = chartBuffer.toString('base64');
  const chartImage = `data:image/png;base64,${chartBase64}`;

  const totalAmount = salesData.reduce((sum, sale) => sum + sale.total, 0);

  return {
    defaultStyle: {
      fontSize: 10,
      font: 'Arial',
      characterSpacing: -0.7,
      color: '#43484C',
    },
    pageSize: 'A4',
    pageMargins: [30, 25],
    content: [
      {
        text: 'Reporte de Ingresos',
        style: 'header',
        margin: [0, 0, 0, 20],
      },
      {
        text: 'La siguiente tabla muestra el monto total de compras por fecha:',
        style: 'subheader',
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ['33%', '33%', '33%'],
          body: [
            [
              { text: 'Fecha', style: 'tableHeader' },
              { text: 'Monto ($)', style: 'tableHeader', alignment: 'right' },
              { text: 'Total ($)', style: 'tableHeader', alignment: 'right' },
            ],
            ...salesData.map(({ date, total }) => [
              { text: date, alignment: 'left' },
              { text: `$${total.toFixed(2)}`, alignment: 'right' },
              {},
            ]),
            [
              {},
              {
                text: 'Total General',
                style: 'totalHeader',
                alignment: 'rigth',
              },
              {
                text: `$${totalAmount.toFixed(2)}`,
                bold: true,
                alignment: 'right',
                style: 'totalHeader',
              },
            ],
          ],
        },
        layout: 'lightHorizontalLines',
        margin: [0, 10, 0, 20],
      },
      {
        text: 'Gráfico de Ingresos:',
        style: 'subheader',
        margin: [0, 0, 0, 10],
      },
      {
        image: chartImage,
        width: 500,
        alignment: 'center',
        margin: [0, 10, 0, 20],
      },
    ],
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center' },
      subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] },
      tableHeader: { bold: true, fillColor: '#EEEEEE' },
      totalHeader: { bold: true, fillColor: '#DDDDDD' },
    },
  };
};
