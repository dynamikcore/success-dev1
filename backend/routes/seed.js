const express = require('express');
const router = express.Router();
const seedData = require('../seeders/initial-data');

// POST /api/seed - Manually trigger seeding
router.post('/', async (req, res) => {
  try {
    await seedData();
    res.json({
      success: true,
      message: 'Database seeded successfully with initial revenue types'
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});

module.exports = router;