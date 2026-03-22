import PDFDocument from 'pdfkit';

export const generateInvoiceBuffer = async (data: any): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- Color Palette ---
        const primaryColor = '#10b981'; // Emerald 500
        const secondaryColor = '#374151'; // Gray 700
        const lightGray = '#9ca3af'; // Gray 400
        const tableBg = '#f9fafb'; // Gray 50

        // --- Header Section ---
        doc.fillColor(primaryColor)
            .font('Helvetica-Bold')
            .fontSize(22)
            .text('EcoSpark Hub', 40, 40);

        doc.fillColor(secondaryColor)
            .font('Helvetica')
            .fontSize(9)
            .text('Empowering Sustainable Innovation', 40, 65);

        // --- Invoice Metadata (Fixing the Overlap) ---
        doc.fillColor(secondaryColor)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('INVOICE TO:', 380, 40);

        doc.font('Helvetica')
            .fontSize(9)
            .text(`#${data.orderId}`, 380, 55, { width: 180 });

        doc.font('Helvetica-Bold')
            .text('DATE:', 380, 85);

        doc.font('Helvetica')
            .text(`${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 380, 100);

        // Separator Line
        doc.moveTo(40, 130).lineTo(555, 130).stroke('#e5e7eb');

        // --- Client Info Section ---
        doc.moveDown(2);
        doc.fillColor(lightGray)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('BILLED TO', 40, 150);

        doc.fillColor('#000000')
            .font('Helvetica-Bold')
            .fontSize(12)
            .text(data.buyerName, 40, 165);

        doc.fillColor(secondaryColor)
            .font('Helvetica')
            .fontSize(10)
            .text(data.buyerEmail, 40, 180);

        // --- Modern Table Section ---
        const tableTop = 230;

        // Table Header Background
        doc.rect(40, tableTop, 515, 30).fill(tableBg);

        doc.fillColor(secondaryColor)
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('DESCRIPTION', 55, tableTop + 10);

        doc.text('CATEGORY', 300, tableTop + 10);

        doc.text('TOTAL', 480, tableTop + 10, { align: 'right', width: 60 });

        // Item Content
        const itemRowY = tableTop + 45;
        doc.fillColor('#000000')
            .font('Helvetica')
            .fontSize(10)
            .text(data.ideaTitle, 55, itemRowY, { width: 230 });

        doc.fillColor(secondaryColor)
            .text(data.categoryName, 300, itemRowY);

        doc.fillColor('#000000')
            .font('Helvetica-Bold')
            .text(`$${Number(data.amount).toFixed(2)}`, 480, itemRowY, { align: 'right', width: 60 });

        // Border below item
        doc.moveTo(40, itemRowY + 25).lineTo(555, itemRowY + 25).stroke('#f3f4f6');

        // --- Summary Section ---
        const summaryY = itemRowY + 60;

        doc.fillColor(lightGray)
            .font('Helvetica')
            .fontSize(10)
            .text('Subtotal:', 380, summaryY);
        doc.fillColor('#000000').text(`$${Number(data.amount).toFixed(2)}`, 480, summaryY, { align: 'right', width: 60 });

        // Total Box
        doc.rect(370, summaryY + 20, 185, 40).fill(primaryColor);
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(12)
            .text('TOTAL PAID', 385, summaryY + 33);
        doc.text(`$${Number(data.amount).toFixed(2)}`, 470, summaryY + 33, { align: 'right', width: 70 });

        // --- Modern Footer ---
        const footerY = 750;
        doc.moveTo(40, footerY).lineTo(555, footerY).stroke('#e5e7eb');

        doc.fillColor(lightGray)
            .font('Helvetica')
            .fontSize(8)
            .text('Thank you for being a part of EcoSpark Hub.', 40, footerY + 15, { align: 'center', width: 515 });

        doc.text('support@ecosparkhub.com  |  www.ecosparkhub.com', 40, footerY + 30, { align: 'center', width: 515 });

        doc.end();
    });
};