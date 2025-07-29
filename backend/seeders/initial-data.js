const db = require('../models');
const { Shop, RevenueType, Payment, Permit } = db;

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    // Create revenue types
    const revenueTypes = await RevenueType.bulkCreate([
      {
        typeName: 'Business Registration Fee',
        description: 'Annual business registration fee',
        baseAmount: 15000.00,
        calculationMethod: 'Fixed',
        frequency: 'Annual'
      },
      {
        typeName: 'Shop Permit Fee',
        description: 'Shop operating permit fee',
        baseAmount: 10000.00,
        calculationMethod: 'Fixed',
        frequency: 'Annual'
      },
      {
        typeName: 'Signage Permit',
        description: 'Permit for business signage',
        baseAmount: 5000.00,
        calculationMethod: 'Fixed',
        frequency: 'Annual'
      },
      {
        typeName: 'Environmental Levy',
        description: 'Environmental impact levy',
        baseAmount: 8000.00,
        calculationMethod: 'Fixed',
        frequency: 'Annual'
      }
    ], {
    });

    console.log(`✅ Created ${revenueTypes.length} revenue types`);
    console.log('🌱 Seed data created successfully');
  } catch (error) {
    console.error('❌ Error creating seed data:', error);
    throw error;
  }
};

module.exports = seedData;

