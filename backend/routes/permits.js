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

    res.json({
      totalItems: count,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      permits
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