const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Shop, Payment, RevenueType, Permit } = require('../backend/models');
const { calculateTotalDue } = require('../utils/uvwieTaxCalculator');

// Helper function to format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

// GET /api/reports/daily-collection - Daily revenue collection summary
router.get('/daily-collection', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const payments = await Payment.findAll({
            where: {
                paymentDate: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow,
                },
            },
            include: [{ model: RevenueType, attributes: ['name'] }],
        });

        const totalCollection = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const collectionByRevenueType = payments.reduce((acc, payment) => {
            const typeName = payment.RevenueType ? payment.RevenueType.name : 'Unknown';
            acc[typeName] = (acc[typeName] || 0) + payment.amount;
            return acc;
        }, {});

        res.json({
            date: today.toISOString().split('T')[0],
            totalCollection: formatCurrency(totalCollection),
            collectionByRevenueType,
            numberOfTransactions: payments.length,
        });
    } catch (error) {
        console.error('Error fetching daily collection:', error);
        res.status(500).json({ message: 'Error fetching daily collection', error: error.message });
    }
});

// GET /api/reports/monthly-summary - Monthly revenue by type and business category
router.get('/monthly-summary', async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ message: 'Year and month are required query parameters.' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const payments = await Payment.findAll({
            where: {
                paymentDate: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate,
                },
            },
            include: [
                { model: RevenueType, attributes: ['name'] },
                { model: Shop, attributes: ['businessCategory'] },
            ],
        });

        const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const revenueByRevenueType = payments.reduce((acc, payment) => {
            const typeName = payment.RevenueType ? payment.RevenueType.name : 'Unknown';
            acc[typeName] = (acc[typeName] || 0) + payment.amount;
            return acc;
        }, {});

        const revenueByBusinessCategory = payments.reduce((acc, payment) => {
            const category = payment.Shop ? payment.Shop.businessCategory : 'Unknown';
            acc[category] = (acc[category] || 0) + payment.amount;
            return acc;
        }, {});

        res.json({
            period: `${year}-${month}`,
            totalRevenue: formatCurrency(totalRevenue),
            revenueByRevenueType,
            revenueByBusinessCategory,
            numberOfTransactions: payments.length,
        });
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ message: 'Error fetching monthly summary', error: error.message });
    }
});

// GET /api/reports/shop-analytics - Shop registration and compliance analytics
router.get('/shop-analytics', async (req, res) => {
    try {
        const totalShops = await Shop.count();
        const activeShops = await Shop.count({ where: { status: 'active' } });
        const inactiveShops = await Shop.count({ where: { status: 'inactive' } });
        const compliantShops = await Shop.count({ where: { complianceStatus: 'compliant' } });
        const nonCompliantShops = await Shop.count({ where: { complianceStatus: 'non-compliant' } });

        const complianceRate = totalShops > 0 ? (compliantShops / totalShops) * 100 : 0;

        res.json({
            totalShops,
            activeShops,
            inactiveShops,
            compliantShops,
            nonCompliantShops,
            complianceRate: `${complianceRate.toFixed(2)}%`,
        });
    } catch (error) {
        console.error('Error fetching shop analytics:', error);
        res.status(500).json({ message: 'Error fetching shop analytics', error: error.message });
    }
});

// GET /api/reports/revenue-by-ward - Revenue collection breakdown by Uvwie wards
router.get('/revenue-by-ward', async (req, res) => {
    try {
        const revenueByWard = await Payment.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
                [Sequelize.col('Shop.ward'), 'ward'],
            ],
            include: [{
                model: Shop,
                attributes: [],
            }],
            group: ['Shop.ward'],
            raw: true,
        });

        const formattedRevenueByWard = revenueByWard.map(item => ({
            ward: item.ward,
            totalRevenue: formatCurrency(item.totalRevenue),
        }));

        res.json(formattedRevenueByWard);
    } catch (error) {
        console.error('Error fetching revenue by ward:', error);
        res.status(500).json({ message: 'Error fetching revenue by ward', error: error.message });
    }
});

// GET /api/reports/business-type-analysis - Revenue performance by business types
router.get('/business-type-analysis', async (req, res) => {
    try {
        const revenueByBusinessType = await Payment.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
                [Sequelize.col('Shop.businessCategory'), 'businessCategory'],
            ],
            include: [{
                model: Shop,
                attributes: [],
            }],
            group: ['Shop.businessCategory'],
            raw: true,
        });

        const formattedRevenueByBusinessType = revenueByBusinessType.map(item => ({
            businessCategory: item.businessCategory,
            totalRevenue: formatCurrency(item.totalRevenue),
        }));

        res.json(formattedRevenueByBusinessType);
    } catch (error) {
        console.error('Error fetching business type analysis:', error);
        res.status(500).json({ message: 'Error fetching business type analysis', error: error.message });
    }
});

// GET /api/reports/compliance-report - Shop compliance rates and defaulter lists
router.get('/compliance-report', async (req, res) => {
    try {
        const compliantShops = await Shop.findAll({ where: { complianceStatus: 'compliant' } });
        const nonCompliantShops = await Shop.findAll({ where: { complianceStatus: 'non-compliant' } });
        const totalShops = await Shop.count();

        const complianceRate = totalShops > 0 ? (compliantShops.length / totalShops) * 100 : 0;

        res.json({
            complianceRate: `${complianceRate.toFixed(2)}%`,
            compliantShops: compliantShops.map(shop => ({ id: shop.id, name: shop.shopName, owner: shop.ownerName, ward: shop.ward })),
            nonCompliantShops: nonCompliantShops.map(shop => ({ id: shop.id, name: shop.shopName, owner: shop.ownerName, ward: shop.ward })),
        });
    } catch (error) {
        console.error('Error fetching compliance report:', error);
        res.status(500).json({ message: 'Error fetching compliance report', error: error.message });
    }
});

// GET /api/reports/permit-status - Permit issuance and renewal statistics
router.get('/permit-status', async (req, res) => {
    try {
        const totalPermits = await Permit.count();
        const activePermits = await Permit.count({ where: { expiryDate: { [Op.gte]: new Date() } } });
        const expiredPermits = await Permit.count({ where: { expiryDate: { [Op.lt]: new Date() } } });

        const permitsByType = await Permit.findAll({
            attributes: [
                'permitType',
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
            ],
            group: ['permitType'],
            raw: true,
        });

        res.json({
            totalPermits,
            activePermits,
            expiredPermits,
            permitsByType,
        });
    } catch (error) {
        console.error('Error fetching permit status:', error);
        res.status(500).json({ message: 'Error fetching permit status', error: error.message });
    }
});

// GET /api/reports/top-contributors - Highest revenue-generating shops
router.get('/top-contributors', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const topShops = await Payment.findAll({
            attributes: [
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
                [Sequelize.col('Shop.shopName'), 'shopName'],
                [Sequelize.col('Shop.ownerName'), 'ownerName'],
                [Sequelize.col('Shop.ward'), 'ward'],
            ],
            include: [{
                model: Shop,
                attributes: [],
            }],
            group: ['Shop.id', 'Shop.shopName', 'Shop.ownerName', 'Shop.ward'],
            order: [[Sequelize.literal('totalRevenue'), 'DESC']],
            limit: parseInt(limit),
            raw: true,
        });

        const formattedTopShops = topShops.map(item => ({
            shopName: item.shopName,
            ownerName: item.ownerName,
            ward: item.ward,
            totalRevenue: formatCurrency(item.totalRevenue),
        }));

        res.json(formattedTopShops);
    } catch (error) {
        console.error('Error fetching top contributors:', error);
        res.status(500).json({ message: 'Error fetching top contributors', error: error.message });
    }
});

// GET /api/reports/collection-trends - Revenue trends over time periods
router.get('/collection-trends', async (req, res) => {
    try {
        const { period = 'monthly', year } = req.query; // period: 'daily', 'weekly', 'monthly', 'yearly'

        let groupByFormat;
        let dateExtractFn;

        switch (period) {
            case 'daily':
                groupByFormat = '%Y-%m-%d';
                dateExtractFn = Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m-%d');
                break;
            case 'weekly':
                groupByFormat = '%Y-%u'; // MySQL/PostgreSQL week format
                dateExtractFn = Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%u');
                break;
            case 'monthly':
                groupByFormat = '%Y-%m';
                dateExtractFn = Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m');
                break;
            case 'yearly':
                groupByFormat = '%Y';
                dateExtractFn = Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y');
                break;
            default:
                return res.status(400).json({ message: 'Invalid period specified. Use daily, weekly, monthly, or yearly.' });
        }

        const whereClause = {};
        if (year) {
            whereClause.paymentDate = {
                [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31T23:59:59.999`)],
            };
        }

        const trends = await Payment.findAll({
            attributes: [
                [dateExtractFn, 'period'],
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalRevenue'],
            ],
            where: whereClause,
            group: ['period'],
            order: [[Sequelize.literal('period'), 'ASC']],
            raw: true,
        });

        const formattedTrends = trends.map(item => ({
            period: item.period,
            totalRevenue: formatCurrency(item.totalRevenue),
        }));

        res.json(formattedTrends);
    } catch (error) {
        console.error('Error fetching collection trends:', error);
        res.status(500).json({ message: 'Error fetching collection trends', error: error.message });
    }
});

// POST /api/reports/custom - Generate custom reports with date ranges and filters
router.post('/custom', async (req, res) => {
    try {
        const { startDate, endDate, revenueType, businessCategory, ward, reportType } = req.body;

        const whereClause = {};
        if (startDate && endDate) {
            whereClause.paymentDate = {
                [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999')],
            };
        }

        const includeClause = [];
        if (revenueType) {
            includeClause.push({ model: RevenueType, where: { name: revenueType } });
        }
        if (businessCategory || ward) {
            const shopWhere = {};
            if (businessCategory) shopWhere.businessCategory = businessCategory;
            if (ward) shopWhere.ward = ward;
            includeClause.push({ model: Shop, where: shopWhere });
        }

        const payments = await Payment.findAll({
            where: whereClause,
            include: includeClause,
        });

        let reportData = {};

        switch (reportType) {
            case 'totalRevenue':
                reportData = {
                    totalRevenue: formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0)),
                    numberOfTransactions: payments.length,
                };
                break;
            case 'revenueByRevenueType':
                reportData = payments.reduce((acc, payment) => {
                    const typeName = payment.RevenueType ? payment.RevenueType.name : 'Unknown';
                    acc[typeName] = (acc[typeName] || 0) + payment.amount;
                    return acc;
                }, {});
                break;
            case 'revenueByShop':
                reportData = payments.reduce((acc, payment) => {
                    const shopName = payment.Shop ? payment.Shop.shopName : 'Unknown';
                    acc[shopName] = (acc[shopName] || 0) + payment.amount;
                    return acc;
                }, {});
                break;
            default:
                reportData = payments.map(p => ({
                    id: p.id,
                    amount: formatCurrency(p.amount),
                    paymentDate: p.paymentDate,
                    revenueType: p.RevenueType ? p.RevenueType.name : 'N/A',
                    shopName: p.Shop ? p.Shop.shopName : 'N/A',
                    ownerName: p.Shop ? p.Shop.ownerName : 'N/A',
                }));
                break;
        }

        res.json(reportData);
    } catch (error) {
        console.error('Error generating custom report:', error);
        res.status(500).json({ message: 'Error generating custom report', error: error.message });
    }
});

module.exports = router;