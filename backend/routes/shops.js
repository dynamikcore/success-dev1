const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Shop, Payment, Permit, RevenueType, sequelize } = require('../server'); // Assuming server.js exports models and sequelize instance
const { calculateTotalDue } = require('../utils/uvwieTaxCalculator');

// Helper for validation
const validateShopInput = (req, res, next) => {
    const { businessName, ownerName, ownerPhone, shopAddress, ward, businessType, shopSizeCategory } = req.body;

    if (!businessName || !ownerName || !ownerPhone || !shopAddress || !ward || !businessType || !shopSizeCategory) {
        return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    // Basic phone number validation for Nigerian format (starts with 070, 080, 081, 090, 091 and 11 digits)
    const nigerianPhoneRegex = /^(\+234|0)\d{10}$/;
    if (!nigerianPhoneRegex.test(ownerPhone)) {
        return res.status(400).json({ message: 'Invalid Nigerian phone number format.' });
    }

    // Add more specific validations for enums if necessary
    const validShopSizes = ['small', 'medium', 'large'];
    if (!validShopSizes.includes(shopSizeCategory.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid shop size category.' });
    }

    // Example: Validate businessType against a predefined list or enum
    const validBusinessTypes = ['retail', 'food', 'service', 'technology', 'pharmacy', 'bank', 'hotel', 'manufacturing']; // Extend as needed
    if (!validBusinessTypes.includes(businessType.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid business type.' });
    }

    next();
};

// GET /api/shops - List all shops with pagination, search, and filters
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, search, ward, businessType, complianceStatus } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
        where[Op.or] = [
            { businessName: { [Op.like]: `%${search}%` } },
            { ownerName: { [Op.like]: `%${search}%` } }
        ];
    }
    if (ward) {
        where.ward = { [Op.like]: `%${ward}%` };
    }
    if (businessType) {
        where.businessType = businessType;
    }
    if (complianceStatus) {
        where.complianceStatus = complianceStatus;
    }

    try {
        const { count, rows: shops } = await Shop.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['createdAt', 'DESC']]
        });
        res.json({
            totalItems: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            shops
        });
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ message: 'Error fetching shops', error: error.message });
    }
});

// POST /api/shops - Register new shop
router.post('/', validateShopInput, async (req, res) => {
    try {
        const newShop = await Shop.create(req.body);
        res.status(201).json(newShop);
    } catch (error) {
        console.error('Error registering new shop:', error);
        res.status(500).json({ message: 'Error registering new shop', error: error.message });
    }
});

// GET /api/shops/:id - Get single shop with payment history, permit status, and compliance summary
router.get('/:id', async (req, res) => {
    try {
        const shop = await Shop.findByPk(req.params.id, {
            include: [
                { model: Payment, as: 'Payments' },
                { model: Permit, as: 'Permits' }
            ]
        });

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found.' });
        }

        // Calculate compliance summary (example logic)
        let complianceSummary = 'Compliant';
        if (shop.Payments && shop.Payments.some(p => p.paymentStatus === 'pending' && new Date(p.dueDate) < new Date())) {
            complianceSummary = 'Overdue Payments';
        }
        if (shop.Permits && shop.Permits.some(p => new Date(p.expiryDate) < new Date())) {
            complianceSummary = 'Expired Permits';
        }
        if (shop.Payments && shop.Payments.some(p => p.paymentStatus === 'partially_paid')) {
            complianceSummary = 'Partially Paid';
        }

        res.json({ ...shop.toJSON(), complianceSummary });
    } catch (error) {
        console.error('Error fetching shop details:', error);
        res.status(500).json({ message: 'Error fetching shop details', error: error.message });
    }
});

// PUT /api/shops/:id - Update shop details
router.put('/:id', validateShopInput, async (req, res) => {
    try {
        const [updated] = await Shop.update(req.body, {
            where: { shopId: req.params.id }
        });
        if (updated) {
            const updatedShop = await Shop.findByPk(req.params.id);
            res.json(updatedShop);
        } else {
            res.status(404).json({ message: 'Shop not found or no changes made.' });
        }
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(500).json({ message: 'Error updating shop', error: error.message });
    }
});

// DELETE /api/shops/:id - Soft delete (set isActive to false)
router.delete('/:id', async (req, res) => {
    try {
        const [updated] = await Shop.update({ isActive: false }, {
            where: { shopId: req.params.id }
        });
        if (updated) {
            res.status(200).json({ message: 'Shop soft-deleted successfully.' });
        } else {
            res.status(404).json({ message: 'Shop not found.' });
        }
    } catch (error) {
        console.error('Error soft-deleting shop:', error);
        res.status(500).json({ message: 'Error soft-deleting shop', error: error.message });
    }
});

// GET /api/shops/:id/payments - Get all payments for a specific shop
router.get('/:id/payments', async (req, res) => {
    try {
        const payments = await Payment.findAll({
            where: { shopId: req.params.id },
            include: [RevenueType] // Include revenue type details
        });
        if (payments.length === 0) {
            return res.status(404).json({ message: 'No payments found for this shop.' });
        }
        res.json(payments);
    } catch (error) {
        console.error('Error fetching payments for shop:', error);
        res.status(500).json({ message: 'Error fetching payments for shop', error: error.message });
    }
});

// GET /api/shops/:id/permits - Get all permits for a shop
router.get('/:id/permits', async (req, res) => {
    try {
        const permits = await Permit.findAll({
            where: { shopId: req.params.id }
        });
        if (permits.length === 0) {
            return res.status(404).json({ message: 'No permits found for this shop.' });
        }
        res.json(permits);
    } catch (error) {
        console.error('Error fetching permits for shop:', error);
        res.status(500).json({ message: 'Error fetching permits for shop', error: error.message });
    }
});

// GET /api/shops/by-ward/:ward - Get shops by specific Uvwie ward
router.get('/by-ward/:ward', async (req, res) => {
    try {
        const shops = await Shop.findAll({
            where: { ward: { [Op.like]: `%${req.params.ward}%` } }
        });
        if (shops.length === 0) {
            return res.status(404).json({ message: `No shops found in ward: ${req.params.ward}` });
        }
        res.json(shops);
    } catch (error) {
        console.error('Error fetching shops by ward:', error);
        res.status(500).json({ message: 'Error fetching shops by ward', error: error.message });
    }
});

// GET /api/shops/compliance-status - Get shops grouped by compliance status
router.get('/compliance-status', async (req, res) => {
    try {
        const complianceSummary = await Shop.findAll({
            attributes: [
                'complianceStatus',
                [sequelize.fn('COUNT', sequelize.col('shopId')), 'count']
            ],
            group: ['complianceStatus']
        });
        res.json(complianceSummary);
    } catch (error) {
        console.error('Error fetching compliance status summary:', error);
        res.status(500).json({ message: 'Error fetching compliance status summary', error: error.message });
    }
});

// POST /api/shops/:id/calculate-dues - Calculate all outstanding dues for a shop
router.post('/:id/calculate-dues', async (req, res) => {
    try {
        const { assessmentYear } = req.body; // Expect assessmentYear in body
        if (!assessmentYear) {
            return res.status(400).json({ message: 'Assessment year is required.' });
        }
        const totalDue = await calculateTotalDue(req.params.id, assessmentYear);
        res.json({ shopId: req.params.id, assessmentYear, totalDue });
    } catch (error) {
        console.error('Error calculating outstanding dues:', error);
        res.status(500).json({ message: 'Error calculating outstanding dues', error: error.message });
    }
});

module.exports = router;