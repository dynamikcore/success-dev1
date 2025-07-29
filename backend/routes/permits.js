const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const db = require('../models');
const { Permit, Shop } = db;

// GET /api/permits - List all permits with pagination and filters
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, shopId, status, permitType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (shopId) where.shopId = shopId;
  if (status) where.permitStatus = status;
  if (permitType) where.permitType = { [Op.like]: `%${permitType}%` };

  try {
    const { count, rows: permits } = await Permit.findAndCountAll({
      where,
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['issueDate', 'DESC']]
    });

    // Transform data to match frontend expectations
    const transformedPermits = permits.map(permit => {
      const now = new Date();
      const expiryDate = new Date(permit.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

      let status = permit.permitStatus;
      if (status === 'Active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        status = 'Expiring Soon';
      } else if (daysUntilExpiry < 0) {
        status = 'Expired';
      }

      return {
        id: permit.permitId,
        shopName: permit.Shop ? permit.Shop.businessName : 'Unknown',
        permitType: permit.permitType,
        issueDate: permit.issueDate.toISOString().split('T')[0],
        expiryDate: permit.expiryDate.toISOString().split('T')[0],
        status: status,
        fee: parseFloat(permit.permitFee)
      };
    });

    res.json({
      totalItems: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      permits: transformedPermits
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ message: 'Error fetching permits', error: error.message });
  }
});

// POST /api/permits - Create new permit
router.post('/', async (req, res) => {
  try {
    const newPermit = await Permit.create(req.body);
    const permit = await Permit.findByPk(newPermit.permitId, {
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] }
      ]
    });
    res.status(201).json(permit);
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ message: 'Error creating permit', error: error.message });
  }
});

// POST /api/permits/renew - Renew permits
router.post('/renew', async (req, res) => {
  try {
    const { permitIds } = req.body;

    if (!permitIds || !Array.isArray(permitIds)) {
      return res.status(400).json({ message: 'Permit IDs array is required' });
    }

    const renewedPermits = [];

    for (const permitId of permitIds) {
      const permit = await Permit.findByPk(permitId);

      if (permit) {
        const newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

        await permit.update({
          expiryDate: newExpiryDate,
          permitStatus: 'Active',
          renewalDate: new Date(),
        });

        renewedPermits.push(permit);
      }
    }

    res.json({
      success: true,
      renewedPermits: renewedPermits.map(p => ({
        permitId: p.permitId,
        newExpiryDate: p.expiryDate,
        status: p.permitStatus
      }))
    });
  } catch (error) {
    console.error('Error renewing permits:', error);
    res.status(500).json({ message: 'Error renewing permits', error: error.message });
  }
});

// POST /api/permits/send-reminder - Send renewal reminders
router.post('/send-reminder', async (req, res) => {
  try {
    const { permitIds } = req.body;
    const NotificationService = require('../utils/notificationService');

    if (!permitIds || !Array.isArray(permitIds)) {
      return res.status(400).json({ message: 'Permit IDs array is required' });
    }

    const permits = await Permit.findAll({
      where: {
        permitId: permitIds
      },
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName', 'ownerPhone'] }
      ]
    });

    const sentReminders = [];

    for (const permit of permits) {
      const notification = {
        type: 'permit_renewal_reminder',
        permitId: permit.permitId,
        shopName: permit.Shop?.businessName,
        ownerPhone: permit.Shop?.ownerPhone,
        message: `Reminder: Your ${permit.permitType} permit needs renewal. Please visit the LGA office.`
      };

      await NotificationService.sendNotification(notification);
      sentReminders.push(notification);
    }

    res.json({
      success: true,
      sentReminders
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({ message: 'Error sending reminders', error: error.message });
  }
});

// GET /api/permits/expiring - Get permits expiring within specified days
router.get('/expiring', async (req, res) => {
  const { days = 30 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));

  try {
    const expiringPermits = await Permit.findAll({
      where: {
        expiryDate: {
          [Op.between]: [new Date(), futureDate],
        },
      },
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] }
      ],
      order: [['expiryDate', 'ASC']]
    });

    const transformedPermits = expiringPermits.map(permit => ({
      id: permit.permitId,
      shopName: permit.Shop ? permit.Shop.businessName : 'Unknown',
      permitType: permit.permitType,
      expiryDate: permit.expiryDate.toISOString().split('T')[0],
      daysUntilExpiry: Math.ceil((new Date(permit.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      permits: transformedPermits
    });
  } catch (error) {
    console.error('Error fetching expiring permits:', error);
    res.status(500).json({ message: 'Error fetching expiring permits', error: error.message });
  }
});

// GET /api/permits/:id - Get single permit
router.get('/:id', async (req, res) => {
  try {
    const permit = await Permit.findByPk(req.params.id, {
      include: [
        { model: Shop, attributes: ['businessName', 'ownerName'] }
      ]
    });

    if (!permit) {
      return res.status(404).json({ message: 'Permit not found.' });
    }

    res.json(permit);
  } catch (error) {
    console.error('Error fetching permit:', error);
    res.status(500).json({ message: 'Error fetching permit', error: error.message });
  }
});

module.exports = router;