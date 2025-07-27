const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Payment, Shop, RevenueType, sequelize } = require('../server'); // Assuming server.js exports models and sequelize instance
const { calculatePenalty, calculateTotalDue } = require('../utils/uvwieTaxCalculator');
const { generateShopPaymentReceipt } = require('../utils/receiptGenerator');

// Helper for Nigerian currency formatting
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

// Helper to update shop compliance status (simplified logic)
const updateShopCompliance = async (shopId) => {
    try {
        const shop = await Shop.findByPk(shopId);
        if (shop) {
            const pendingPayments = await Payment.count({
                where: {
                    shopId: shopId,
                    paymentStatus: { [Op.in]: ['pending', 'partially_paid'] },
                    dueDate: { [Op.lt]: new Date() } // Overdue
                }
            });

            const expiredPermits = await Permit.count({
                where: {
                    shopId: shopId,
                    expiryDate: { [Op.lt]: new Date() } // Expired
                }
            });

            let newComplianceStatus = 'Compliant';
            if (pendingPayments > 0) {
                newComplianceStatus = 'Overdue Payments';
            }
            if (expiredPermits > 0) {
                newComplianceStatus = 'Expired Permits';
            }
            if (pendingPayments > 0 && expiredPermits > 0) {
                newComplianceStatus = 'Non-Compliant';
            }

            await shop.update({ complianceStatus: newComplianceStatus });
            console.log(`Shop ${shopId} compliance updated to: ${newComplianceStatus}`);
        }
    } catch (error) {
        console.error(`Error updating compliance for shop ${shopId}:`, error);
    }
};

// GET /api/payments - List all payments with filters
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, status, startDate, endDate, businessType, ward } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    const shopWhere = {};

    if (status) {
        where.paymentStatus = status;
    }
    if (startDate && endDate) {
        where.paymentDate = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    if (businessType) {
        shopWhere.businessType = businessType;
    }
    if (ward) {
        shopWhere.ward = ward;
    }

    try {
        const { count, rows: payments } = await Payment.findAndCountAll({
            where,
            include: [
                { model: Shop, as: 'Shop', where: shopWhere },
                { model: RevenueType, as: 'RevenueType' }
            ],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['paymentDate', 'DESC']]
        });

        res.json({
            totalItems: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            payments: payments.map(p => ({
                ...p.toJSON(),
                amountDueFormatted: formatCurrency(p.amountDue),
                amountPaidFormatted: formatCurrency(p.amountPaid),
                penaltyAmountFormatted: formatCurrency(p.penaltyAmount || 0)
            }))
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ message: 'Error fetching payments', error: error.message });
    }
});

// POST /api/payments - Record new payment
router.post('/', async (req, res) => {
    const { shopId, revenueTypeId, assessmentYear, amountDue, amountPaid, paymentMethod, collectedBy, description, dueDate } = req.body;

    if (!shopId || !revenueTypeId || !assessmentYear || !amountDue || !amountPaid || !paymentMethod || !collectedBy || !dueDate) {
        return res.status(400).json({ message: 'Missing required payment fields.' });
    }

    try {
        const shop = await Shop.findByPk(shopId);
        const revenueType = await RevenueType.findByPk(revenueTypeId);

        if (!shop) return res.status(404).json({ message: 'Shop not found.' });
        if (!revenueType) return res.status(404).json({ message: 'Revenue Type not found.' });

        const newPayment = await Payment.create({
            shopId,
            revenueTypeId,
            assessmentYear,
            amountDue,
            amountPaid,
            paymentMethod,
            collectedBy,
            description,
            dueDate,
            paymentStatus: amountPaid >= amountDue ? 'paid' : 'partially_paid'
        });

        await updateShopCompliance(shopId);

        // Auto-generate receipt
        const paymentData = {
            receiptNumber: newPayment.receiptNumber,
            paymentDate: newPayment.paymentDate,
            revenueType: revenueType.typeName,
            amountPaid: newPayment.amountPaid,
            assessmentYear: newPayment.assessmentYear,
            paymentMethod: newPayment.paymentMethod,
            collectedBy: newPayment.collectedBy,
            // Add breakdown if available
        };

        const shopData = {
            businessName: shop.businessName,
            ownerName: shop.ownerName,
            shopAddress: shop.shopAddress,
            businessType: shop.businessType,
            shopId: shop.shopId
        };

        const pdfBase64 = await generateShopPaymentReceipt(paymentData, shopData);

        res.status(201).json({
            payment: newPayment,
            receipt: pdfBase64,
            message: 'Payment recorded and receipt generated successfully.'
        });

    } catch (error) {
        console.error('Error recording new payment:', error);
        res.status(500).json({ message: 'Error recording new payment', error: error.message });
    }
});

// GET /api/payments/:id - Get payment details with shop information
router.get('/:id', async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id, {
            include: [
                { model: Shop, as: 'Shop' },
                { model: RevenueType, as: 'RevenueType' }
            ]
        });

        if (!payment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        res.json({
            ...payment.toJSON(),
            amountDueFormatted: formatCurrency(payment.amountDue),
            amountPaidFormatted: formatCurrency(payment.amountPaid),
            penaltyAmountFormatted: formatCurrency(payment.penaltyAmount || 0)
        });
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ message: 'Error fetching payment details', error: error.message });
    }
});

// PUT /api/payments/:id - Update payment (for corrections by administrators)
router.put('/:id', async (req, res) => {
    const { amountPaid, paymentStatus, description, collectedBy } = req.body;

    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        await payment.update({ amountPaid, paymentStatus, description, collectedBy });
        await updateShopCompliance(payment.shopId);

        res.json({
            ...payment.toJSON(),
            amountDueFormatted: formatCurrency(payment.amountDue),
            amountPaidFormatted: formatCurrency(payment.amountPaid),
            penaltyAmountFormatted: formatCurrency(payment.penaltyAmount || 0)
        });
    } catch (error) {
        console.error('Error updating payment:', error);
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
});

// POST /api/payments/bulk - Process multiple payments for different shops
router.post('/bulk', async (req, res) => {
    const payments = req.body.payments; // Array of payment objects

    if (!Array.isArray(payments) || payments.length === 0) {
        return res.status(400).json({ message: 'No payments provided for bulk processing.' });
    }

    const results = [];
    for (const paymentData of payments) {
        const { shopId, revenueTypeId, assessmentYear, amountDue, amountPaid, paymentMethod, collectedBy, description, dueDate } = paymentData;

        if (!shopId || !revenueTypeId || !assessmentYear || !amountDue || !amountPaid || !paymentMethod || !collectedBy || !dueDate) {
            results.push({ status: 'failed', message: 'Missing required fields for one payment.', paymentData });
            continue;
        }

        try {
            const shop = await Shop.findByPk(shopId);
            const revenueType = await RevenueType.findByPk(revenueTypeId);

            if (!shop || !revenueType) {
                results.push({ status: 'failed', message: 'Shop or Revenue Type not found for one payment.', paymentData });
                continue;
            }

            const newPayment = await Payment.create({
                shopId,
                revenueTypeId,
                assessmentYear,
                amountDue,
                amountPaid,
                paymentMethod,
                collectedBy,
                description,
                dueDate,
                paymentStatus: amountPaid >= amountDue ? 'paid' : 'partially_paid'
            });

            await updateShopCompliance(shopId);

            results.push({ status: 'success', payment: newPayment });
        } catch (error) {
            console.error('Error processing bulk payment:', error);
            results.push({ status: 'failed', message: error.message, paymentData });
        }
    }
    res.status(200).json(results);
});

// GET /api/payments/daily-summary - Get today's total collections by revenue type
router.get('/daily-summary', async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    try {
        const summary = await Payment.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalCollectedToday']
            ],
            where: {
                paymentDate: { [Op.between]: [today, tomorrow] }
            },
            include: [
                { model: RevenueType, attributes: ['typeName'] }
            ],
            group: ['RevenueType.typeId', 'RevenueType.typeName']
        });

        res.json(summary.map(s => ({
            revenueType: s.RevenueType.typeName,
            totalCollectedToday: formatCurrency(s.dataValues.totalCollectedToday)
        })));
    } catch (error) {
        console.error('Error fetching daily summary:', error);
        res.status(500).json({ message: 'Error fetching daily summary', error: error.message });
    }
});

// GET /api/payments/overdue - List overdue payments with penalty calculations
router.get('/overdue', async (req, res) => {
    try {
        const overduePayments = await Payment.findAll({
            where: {
                paymentStatus: { [Op.in]: ['pending', 'partially_paid'] },
                dueDate: { [Op.lt]: new Date() } // Due date is in the past
            },
            include: [
                { model: Shop, as: 'Shop' },
                { model: RevenueType, as: 'RevenueType' }
            ]
        });

        const paymentsWithPenalty = await Promise.all(overduePayments.map(async (payment) => {
            const penalty = calculatePenalty(payment.amountDue - payment.amountPaid, payment.dueDate);
            return {
                ...payment.toJSON(),
                penaltyAmount: penalty,
                amountDueFormatted: formatCurrency(payment.amountDue),
                amountPaidFormatted: formatCurrency(payment.amountPaid),
                penaltyAmountFormatted: formatCurrency(penalty)
            };
        }));

        res.json(paymentsWithPenalty);
    } catch (error) {
        console.error('Error fetching overdue payments:', error);
        res.status(500).json({ message: 'Error fetching overdue payments', error: error.message });
    }
});

// GET /api/payments/by-business-type - Revenue breakdown by shop business types
router.get('/by-business-type', async (req, res) => {
    try {
        const breakdown = await Payment.findAll({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalRevenue']
            ],
            include: [
                { model: Shop, as: 'Shop', attributes: ['businessType'] }
            ],
            group: ['Shop.businessType']
        });

        res.json(breakdown.map(b => ({
            businessType: b.Shop.businessType,
            totalRevenue: formatCurrency(b.dataValues.totalRevenue)
        })));
    } catch (error) {
        console.error('Error fetching revenue breakdown by business type:', error);
        res.status(500).json({ message: 'Error fetching revenue breakdown by business type', error: error.message });
    }
});

// POST /api/payments/:id/apply-penalty - Apply late payment penalty
router.post('/:id/apply-penalty', async (req, res) => {
    try {
        const payment = await Payment.findByPk(req.params.id);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found.' });
        }

        if (payment.paymentStatus === 'paid') {
            return res.status(400).json({ message: 'Payment is already fully paid, no penalty to apply.' });
        }

        const outstandingAmount = payment.amountDue - payment.amountPaid;
        if (outstandingAmount <= 0) {
             return res.status(400).json({ message: 'No outstanding amount to apply penalty to.' });
        }

        const penalty = calculatePenalty(outstandingAmount, payment.dueDate);
        const newAmountDue = payment.amountDue + penalty;

        await payment.update({
            penaltyAmount: (payment.penaltyAmount || 0) + penalty, // Add to existing penalty
            amountDue: newAmountDue // Update total amount due
        });

        await updateShopCompliance(payment.shopId);

        res.json({
            message: 'Penalty applied successfully.',
            payment: {
                ...payment.toJSON(),
                amountDueFormatted: formatCurrency(payment.amountDue),
                amountPaidFormatted: formatCurrency(payment.amountPaid),
                penaltyAmountFormatted: formatCurrency(payment.penaltyAmount)
            }
        });
    } catch (error) {
        console.error('Error applying penalty:', error);
        res.status(500).json({ message: 'Error applying penalty', error: error.message });
    }
});

// GET /api/payments/receipt/:receiptNumber - Get payment receipt for reprint
router.get('/receipt/:receiptNumber', async (req, res) => {
    try {
        const { receiptNumber } = req.params;
        const payment = await Payment.findOne({ where: { receiptNumber }, include: [Shop, RevenueType] });

        if (!payment) {
            return res.status(404).json({ message: 'Receipt not found.' });
        }

        const shop = payment.Shop;
        const revenueType = payment.RevenueType;

        if (!shop || !revenueType) {
            return res.status(404).json({ message: 'Associated shop or revenue type not found for this receipt.' });
        }

        const paymentData = {
            receiptNumber: payment.receiptNumber,
            paymentId: payment.paymentId,
            paymentDate: payment.paymentDate,
            revenueType: revenueType.typeName,
            amountPaid: payment.amountPaid,
            assessmentYear: payment.assessmentYear,
            paymentMethod: payment.paymentMethod,
            collectedBy: payment.collectedBy,
            amountDue: payment.amountDue,
            penaltyAmount: payment.penaltyAmount,
            // Add breakdown if available
        };

        const shopData = {
            businessName: shop.businessName,
            ownerName: shop.ownerName,
            shopAddress: shop.shopAddress,
            businessType: shop.businessType,
            shopId: shop.shopId
        };

        const pdfBase64 = await generateShopPaymentReceipt(paymentData, shopData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${payment.receiptNumber}.pdf`);
        res.send(Buffer.from(pdfBase64.split(',')[1], 'base64'));

    } catch (error) {
        console.error('Error generating receipt for reprint:', error);
        res.status(500).json({ message: 'Error generating receipt for reprint', error: error.message });
    }
});

module.exports = router;