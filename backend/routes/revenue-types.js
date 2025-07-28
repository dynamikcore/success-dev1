const express = require('express');
const router = express.Router();
const db = require('../models');
const { RevenueType } = db;

// GET /api/revenue-types - Get all active revenue types
router.get('/', async (req, res) => {
  try {
    const revenueTypes = await RevenueType.findAll({
      where: { isActive: true },
      order: [['typeName', 'ASC']]
    });

    const formattedTypes = revenueTypes.map(type => ({
      id: type.typeId,
      name: type.typeName,
      description: type.description,
      amount: parseFloat(type.baseAmount),
      calculationMethod: type.calculationMethod,
      frequency: type.frequency
    }));

    res.json(formattedTypes);
  } catch (error) {
    console.error('Error fetching revenue types:', error);
    res.status(500).json({ message: 'Error fetching revenue types', error: error.message });
  }
});

// POST /api/revenue-types - Create new revenue type
router.post('/', async (req, res) => {
  try {
    const newRevenueType = await RevenueType.create(req.body);
    res.status(201).json(newRevenueType);
  } catch (error) {
    console.error('Error creating revenue type:', error);
    res.status(500).json({ message: 'Error creating revenue type', error: error.message });
  }
});

// GET /api/revenue-types/:id - Get single revenue type
router.get('/:id', async (req, res) => {
  try {
    const revenueType = await RevenueType.findByPk(req.params.id);
    if (!revenueType) {
      return res.status(404).json({ message: 'Revenue type not found' });
    }
    res.json(revenueType);
  } catch (error) {
    console.error('Error fetching revenue type:', error);
    res.status(500).json({ message: 'Error fetching revenue type', error: error.message });
  }
});

module.exports = router;
