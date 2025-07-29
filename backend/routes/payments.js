const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { Payment, Shop, RevenueType } = db;
const { generateShopPaymentReceipt } = require('../utils/receiptGenerator');

// GET /api/payments - List all payments with pagination and filters
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, shopId, status, startDate, endDate } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (shopId) where.shopId = shopId;
  if (status) where.paymentStatus = status;
  if (startDate && endDate) {
    where.paymentDate = {
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }

  try {
    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] },
        { model: RevenueType, attributes: ['typeName', 'description'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      totalItems: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments', error: error.message });
  }
});

// GET /api/payments/recent - Get recent payments
router.get('/recent', async (req, res) => {
  const { limit = 5 } = req.query;
  try {
    const payments = await Payment.findAll({
      limit: parseInt(limit),
      order: [['paymentDate', 'DESC']],
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] },
        { model: RevenueType, attributes: ['typeName'] }
      ]
    });
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching recent payments:', error);
    res.status(500).json({ message: 'Error fetching recent payments', error: error.message });
  }
});

// POST /api/payments - Create new payment
router.post('/', async (req, res) => {
  try {
    const newPayment = await Payment.create(req.body);
    const payment = await Payment.findByPk(newPayment.paymentId, {
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] },
        { model: RevenueType, attributes: ['typeName', 'description'] }
      ]
    });
    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment', error: error.message });
  }
});

// POST /api/payments/generate-receipt - Generate PDF receipt
router.post('/generate-receipt', async (req, res) => {
  try {
    const { paymentData, shopData } = req.body;

    const pdfBase64 = await generateShopPaymentReceipt(paymentData, shopData);

    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(pdfBase64.split(',')[1], 'base64');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receipt-${paymentData.receiptNumber || 'payment'}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    res.status(500).json({ message: 'Error generating PDF receipt', error: error.message });
  }
});

// GET /api/payments/:id - Get single payment
router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] },
        { model: RevenueType, attributes: ['typeName', 'description'] }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found.' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
});

module.exports = router;