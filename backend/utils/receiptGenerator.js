// utils/receiptGenerator.js

const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');

/**
 * Generates an official PDF receipt for Uvwie LGA shop payments.
 * @param {object} paymentData - Details of the payment.
 * @param {object} shopData - Details of the shop.
 * @returns {Promise<string>} Base64 encoded PDF string.
 */
async function generateShopPaymentReceipt(paymentData, shopData) {
    const doc = new jsPDF();

    // Set font and size
    doc.setFont('helvetica');
    doc.setFontSize(12);

    // Uvwie Local Government Area Official Letterhead
    doc.setFontSize(16);
    doc.text('Uvwie Local Government Area', 105, 20, null, null, 'center');
    doc.setFontSize(12);
    doc.text('Revenue Collection Department', 105, 27, null, null, 'center');
    doc.text('Effurun, Delta State, Nigeria', 105, 34, null, null, 'center');
    doc.line(20, 38, 190, 38); // Horizontal line

    doc.setFontSize(14);
    doc.text('OFFICIAL PAYMENT RECEIPT', 105, 50, null, null, 'center');

    // Payment Details
    doc.setFontSize(10);
    doc.text(`Receipt Number: ${paymentData.receiptNumber || 'N/A'}`, 20, 65);
    doc.text(`Payment Date: ${new Date(paymentData.paymentDate).toLocaleDateString()}`, 20, 72);
    doc.text(`Revenue Type: ${paymentData.revenueType || 'N/A'}`, 20, 79);
    doc.text(`Amount Paid: ₦${paymentData.amountPaid ? paymentData.amountPaid.toFixed(2) : '0.00'}`, 20, 86);
    doc.text(`Assessment Year: ${paymentData.assessmentYear || 'N/A'}`, 20, 93);
    doc.text(`Payment Method: ${paymentData.paymentMethod || 'N/A'}`, 20, 100);
    doc.text(`Collected By: ${paymentData.collectedBy || 'N/A'}`, 20, 107);

    // Shop Information
    doc.setFontSize(12);
    doc.text('Shop Information:', 20, 120);
    doc.setFontSize(10);
    doc.text(`Business Name: ${shopData.businessName || 'N/A'}`, 20, 127);
    doc.text(`Owner Name: ${shopData.ownerName || 'N/A'}`, 20, 134);
    doc.text(`Shop Address: ${shopData.shopAddress || 'N/A'}`, 20, 141);
    doc.text(`Business Type: ${shopData.businessType || 'N/A'}`, 20, 148);
    doc.text(`Shop ID: ${shopData.shopId || 'N/A'}`, 20, 155);

    // Revenue Breakdown (Example - assuming paymentData can have a breakdown)
    if (paymentData.breakdown && paymentData.breakdown.length > 0) {
        doc.setFontSize(12);
        doc.text('Revenue Breakdown:', 20, 168);
        doc.setFontSize(10);
        let y = 175;
        paymentData.breakdown.forEach(item => {
            doc.text(`- ${item.type}: ₦${item.amount.toFixed(2)}`, 25, y);
            y += 7;
        });
    }

    // Official LGA Stamps and Signature Areas
    doc.setFontSize(10);
    doc.text('_________________________', 20, 220);
    doc.text('Revenue Officer Signature', 20, 227);

    doc.text('_________________________', 130, 220);
    doc.text('Official Stamp/Seal', 130, 227);

    // QR Code with payment verification link
    const verificationLink = `https://uvwielga.gov.ng/verify-payment?receipt=${paymentData.receiptNumber}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationLink, { errorCorrectionLevel: 'H', width: 50 });
    doc.addImage(qrCodeDataUrl, 'PNG', 150, 60, 40, 40); // x, y, width, height
    doc.setFontSize(8);
    doc.text('Scan for Verification', 155, 105);

    // Terms and Conditions for shop operations
    doc.setFontSize(8);
    doc.text('Terms and Conditions:', 20, 240);
    const terms = [
        '1. This receipt serves as proof of payment for the specified revenue type.',
        '2. All payments are subject to audit by Uvwie Local Government Area.',
        '3. This receipt must be presented upon demand by authorized LGA officials.',
        '4. Non-compliance with LGA regulations may result in penalties or revocation of permits.',
        '5. For inquiries, please contact the Revenue Collection Department.',
    ];
    let yTerms = 245;
    terms.forEach(term => {
        doc.text(term, 20, yTerms);
        yTerms += 5;
    });

    // Professional government document formatting - Footer
    doc.setFontSize(8);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
    doc.text('Uvwie LGA - Committed to Transparent Revenue Collection', 105, 280, null, null, 'center');

    return doc.output('datauristring');
}

module.exports = {
    generateShopPaymentReceipt
};