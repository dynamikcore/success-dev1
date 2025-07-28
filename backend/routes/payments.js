const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { Payment, Shop, RevenueType } = db;

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