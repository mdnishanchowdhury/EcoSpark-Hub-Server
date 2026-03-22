import PDFDocument from 'pdfkit';

export const generateInvoiceBuffer = async (data: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        
        // ১. হেডার (Header/Logo)
        doc.fillColor('#444444').fontSize(20).text('EcoSpark Hub', 50, 50);
        doc.fontSize(10).text('Invoice: #' + data.orderId, 200, 50, { align: 'right' });
        doc.text('Date: ' + new Date().toLocaleDateString(), 200, 65, { align: 'right' });
        doc.moveDown();


        doc.text('Bill To:', 50, 120);
        doc.fontSize(12).text(data.buyerName, 50, 135);
        doc.fontSize(10).text(data.buyerEmail, 50, 150);

  
        doc.rect(50, 190, 500, 20).fill('#f0f0f0');
        doc.fillColor('#000').text('Idea Title', 60, 195);
        doc.text('Category', 300, 195);
        doc.text('Price', 480, 195);


        doc.text(data.ideaTitle, 60, 220);
        doc.text(data.categoryName, 300, 220);
        doc.text(`$${data.amount}`, 480, 220);

        doc.moveDown();
        
        doc.fontSize(10).text('Thank you for supporting innovation!', 50, 350, { align: 'center' });

        doc.end();
    });
};