const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const db = require('./models');

const { calculateBusinessRegistrationFee, calculateAnnualPermitFee, calculateSignagePermitFee, calculateEnvironmentalLevy, calculateShopPremisesTax, calculatePenalty, calculateTotalDue } = require('./utils/uvwieTaxCalculator');
const { generateShopPaymentReceipt } = require('./utils/receiptGenerator');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json()); // Body parser for JSON

// Database connection using Sequelize (SQLite)
const sequelize = db.sequelize;
const Shop = db.Shop;
const RevenueType = db.RevenueType;
const Payment = db.Payment;
const Permit = db.Permit;

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
        // Example: Create dummy data if none exists
        let createdShop = null;
        let createdRevenueType = null;

        return Shop.count()
              .then(shopCount => {
                if (shopCount === 0) {
                  console.log('Attempting to create shop with data:', {
                    businessName: 'Uvwie Local Shop',
                    ownerName: 'John Doe',
                    ownerPhone: '08012345678',
                    ownerEmail: 'john.doe@example.com',
                    shopAddress: '123 Main Street, Effurun',
                    ward: 'Ward 1',
                    businessType: 'Retail',
                    shopSizeCategory: 'Medium',
                    complianceStatus: 'New'
                  });
                  console.log('Attempting to call Shop.create...');
                  return Shop.create({
                    businessName: 'Uvwie Local Shop',
                    ownerName: 'John Doe',
                    ownerPhone: '08012345678',
                    ownerEmail: 'john.doe@example.com',
                    shopAddress: '123 Main Street, Effurun',
                    ward: 'Ward 1',
                    businessType: 'Retail',
                    shopSizeCategory: 'Medium',
                    complianceStatus: 'New'
                  })
                    .then(shop => {
                      console.log('Dummy shop created.');
                      createdShop = shop;
                      return shop; // Ensure the promise resolves with the created shop
                    })
                    .catch(err => {
                      console.error('Failed to create dummy shop:', err);
                      throw err; // Re-throw to propagate the error
                    });
                }
                return Shop.findOne().then(shop => { createdShop = shop; return shop; }); // Get existing shop
              })
              .then(() => RevenueType.count())
              .then(revenueTypeCount => {
                if (revenueTypeCount === 0) {
                  return RevenueType.create({

                    typeName: 'Business Operating Permit',
                    description: 'Annual permit for businesses to operate.',
                    baseAmount: 5000.00,
                    calculationMethod: 'Fixed',
                    frequency: 'Annual'
                  })
                    .then(revenueType => {
                      console.log('Dummy revenue type created.');
                      createdRevenueType = revenueType;
                      return revenueType; // Ensure the promise resolves with the created revenue type
                    })
                    .catch(err => {
                      console.error('Failed to create dummy revenue type:', err);
                      throw err; // Re-throw to propagate the error
                    });
                }
                return RevenueType.findOne().then(revenueType => { createdRevenueType = revenueType; return revenueType; }); // Get existing revenue type
              })
              .then(() => {
                if (createdShop && createdRevenueType) {
                  return Payment.count().then(paymentCount => {
                    if (paymentCount === 0) {
                      return Payment.create({
                        shopId: createdShop.shopId,
                        revenueTypeId: createdRevenueType.typeId,
                        assessmentYear: new Date().getFullYear(),
                        amountDue: 5000.00,
                        amountPaid: 5000.00,
                        paymentMethod: 'Cash',
                        collectedBy: 'Admin Staff',
                        paymentStatus: 'Paid'
                      })
                        .then(() => console.log('Dummy payment created.'))
                        .catch(err => {
                          console.error('Failed to create dummy payment:', err);
                          throw err; // Re-throw to propagate the error
                        });
                    }
                    return Promise.resolve();
                  });
                } else {
                  console.warn('Skipping dummy payment creation: Shop or RevenueType not found.');
                  return Promise.resolve();
                }
              })
              .then(() => {
                if (createdShop) {
                  return Permit.count().then(permitCount => {
                    if (permitCount === 0) {
                      return Permit.create({
                        shopId: createdShop.shopId,
                        permitType: 'Business Operating Permit',
                        permitFee: 10000.00,
                        issuedBy: 'LGA Staff',
                        documentPath: '/path/to/document.pdf'
                      })
                        .then(() => console.log('Dummy permit created.'))
                        .catch(err => {
                          console.error('Failed to create dummy permit:', err);
                          throw err; // Re-throw to propagate the error
                        });
                    }
                    return Promise.resolve();
                  });
                } else {
                  console.warn('Skipping dummy permit creation: Shop not found.');
                  return Promise.resolve();
                }
              })
          .catch(err => console.error('Error during dummy data creation:', err));
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });