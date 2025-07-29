const express = require('express');
const cors = require('cors');
const db = require('./models');
const seedData = require('./seeders/initial-data');
const { RevenueType } = db;


const app = express();


// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Database connection
const sequelize = db.sequelize;

// Auto-seed database on startup
const initializeDatabase = async () => {
  try {
    await sequelize.sync(); // This will create tables if they don't exist
    console.log('Database synchronized.');

    // Check if RevenueTypes already exist before seeding
    const existingRevenueTypes = await RevenueType.count();
    if (existingRevenueTypes === 0) {
      await seedData();
      console.log('Database seeded with initial data.');
    } else {
      console.log('Revenue types already exist, skipping seeding.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Import routes
const shopRoutes = require('./routes/shops');
const paymentRoutes = require('./routes/payments');
const permitRoutes = require('./routes/permits');
const reportRoutes = require('./routes/reports');
const revenueTypeRoutes = require('./routes/revenue-types');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');

const seedRoutes = require('./routes/seed');

// Use routes
app.use('/api/shops', shopRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/revenue-types', revenueTypeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/seed', seedRoutes);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server and initialize database
app.listen(process.env.PORT || 5000, async () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
  await initializeDatabase();
});

module.exports = app;