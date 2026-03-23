const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const generateReconciliationPDF = async (reconciliation, user, format = 'A4') => {
    return new Promise(async (resolve, reject) => {
        const doc = new PDFDocument({
            size: format === 'TICKET' ? [226, 800] : 'A4', // 226pts approx 80mm
            margin: format === 'TICKET' ? 10 : 50
        });

        // Buffer to store PDF
        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        doc.fontSize(format === 'TICKET' ? 10 : 18).text('INDUWELL CLOUD-CASH', { align: 'center' });
        doc.moveDown();
        doc.fontSize(format === 'TICKET' ? 8 : 12).text(`ACTA DE ARQUEO #${reconciliation.id}`, { align: 'center' });
        doc.text(`Fecha: ${new Date(reconciliation.date).toLocaleString()}`, { align: 'center' });
        doc.text(`Cajero: ${user.name}`, { align: 'center' });
        doc.moveDown();

        // Content
        const colX = format === 'TICKET' ? 10 : 50;
        doc.text(`Saldo Sistema: $${reconciliation.total_system}`, colX);
        doc.text(`Conteo Físico: $${reconciliation.total_physical}`, colX);

        const diffColor = reconciliation.difference < 0 ? 'red' : (reconciliation.difference > 0 ? 'blue' : 'black');
        doc.fillColor(diffColor).text(`Diferencia: $${reconciliation.difference}`, colX).fillColor('black');

        doc.moveDown();
        doc.text('Desglose:', colX);
        const denoms = typeof reconciliation.denominations === 'string'
            ? JSON.parse(reconciliation.denominations)
            : reconciliation.denominations;

        if (denoms) {
            Object.entries(denoms).forEach(([denom, count]) => {
                if (count > 0) doc.text(`$${denom} x ${count} = $${denom * count}`, colX + 10);
            });
        }

        doc.moveDown();

        // Validation QR
        const validationUrl = `https://induwell.app/validate/reconciliation/${reconciliation.id}`; // Mock URL
        const qrDataURL = await QRCode.toDataURL(validationUrl);
        doc.image(qrDataURL, { fit: [100, 100], align: 'center' });

        doc.fontSize(8).text('Escanea para validar autenticidad', { align: 'center' });

        doc.end();
    });
};

module.exports = { generateReconciliationPDF };
