const express = require('express');
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const defineShopModel = require('./models/Shop');
const defineRevenueTypeModel = require('./models/RevenueType');
const definePaymentModel = require('./models/Payment');
const definePermitModel = require('./models/Permit');

const { calculateBusinessRegistrationFee, calculateAnnualPermitFee, calculateSignagePermitFee, calculateEnvironmentalLevy, calculateShopPremisesTax, calculatePenalty, calculateTotalDue } = require('./utils/uvwieTaxCalculator');
const { generateShopPaymentReceipt } = require('./utils/receiptGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json()); // Body parser for JSON

// Database connection using Sequelize (SQLite)
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite' // This will create a sqlite file in the project root
});

// Define models
const Shop = defineShopModel(sequelize);
const RevenueType = defineRevenueTypeModel(sequelize);
const Payment = definePaymentModel(sequelize);
const Permit = definePermitModel(sequelize);

// Establish associations
Shop.associate(sequelize.models);
RevenueType.associate(sequelize.models);
Payment.associate(sequelize.models);
Permit.associate(sequelize.models);

// Import routes
const shopRoutes = require('./routes/shops');

// Use routes
app.use('/api/shops', shopRoutes);


const paymentRoutes = require('./routes/payments');

app.use('/api/payments', paymentRoutes);

const permitRoutes = require('./routes/permits');
app.use('/api/permits', permitRoutes);

const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

app.get('/api/revenue-types', (req, res) => {
  res.send('Revenue Types API endpoint');
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Database sync and server start
sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Database synced successfully.');
        // Example: Create a dummy shop if none exists
        // This is for demonstration and can be removed in production
        Shop.count().then(count => {
          if (count === 0) {
            Shop.create({
              businessName: 'Uvwie Local Shop',
              ownerName: 'John Doe',
              ownerPhone: '08012345678',
              ownerEmail: 'john.doe@example.com',
              shopAddress: '123 Main Street, Effurun',
              ward: 'Ward 1',
              businessType: 'Retail',
              shopSizeCategory: 'Medium',
              complianceStatus: 'New'
            }).then(() => console.log('Dummy shop created.')).catch(err => console.error('Failed to create dummy shop:', err));
          }
        });

        // Example: Create a dummy revenue type if none exists
        RevenueType.count().then(count => {
          if (count === 0) {
            RevenueType.create({
              typeName: 'Business Registration Fee',
              baseAmount: 5000.00,
              calculationMethod: 'Fixed',
              frequency: 'OneTime',
              description: 'Initial fee for business registration',
              minimumAmount: 5000.00
            }).then(() => console.log('Dummy revenue type created.')).catch(err => console.error('Failed to create dummy revenue type:', err));
          }
        });

        // Example: Create a dummy payment if none exists
        Payment.count().then(count => {
          if (count === 0) {
            // Ensure a shop and revenue type exist before creating a payment
            Shop.findOne().then(shop => {
              RevenueType.findOne().then(revenueType => {
                if (shop && revenueType) {
                  Payment.create({
                    shopId: shop.shopId,
                    revenueTypeId: revenueType.typeId,
                    assessmentYear: new Date().getFullYear(),
                    amountDue: 5000.00,
                    amountPaid: 5000.00,
                    paymentMethod: 'Cash',
                    collectedBy: 'Admin Staff',
                    paymentStatus: 'Paid'
                  }).then(() => console.log('Dummy payment created.')).catch(err => console.error('Failed to create dummy payment:', err));
                } else {
                  console.log('Cannot create dummy payment: Shop or RevenueType not found.');
                }
              }).catch(err => console.error('Error finding RevenueType:', err));
            }).catch(err => console.error('Error finding Shop:', err));
          }
        });

        // Example: Create a dummy permit if none exists
        Permit.count().then(count => {
          if (count === 0) {
            Shop.findOne().then(shop => {
              if (shop) {
                Permit.create({
                  shopId: shop.shopId,
                  permitType: 'Business Operating Permit',
                  permitFee: 10000.00,
                  issuedBy: 'LGA Staff',
                  documentPath: '/path/to/document.pdf'
                }).then(() => console.log('Dummy permit created.')).catch(err => console.error('Failed to create dummy permit:', err));
              } else {
                console.log('Cannot create dummy permit: Shop not found.');
              }
            }).catch(err => console.error('Error finding Shop:', err));
          }
        });
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });