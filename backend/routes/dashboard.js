const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const { Shop, Payment, RevenueType, Permit } = require('../server');

// GET /api/dashboard/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        // Get total shops
        const totalShops = await Shop.count();

        // Get today's revenue
        const todayPayments = await Payment.findAll({
            where: {
                paymentDate: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow,
                },
            },
        });
        const todayRevenue = todayPayments.reduce((sum, payment) => sum + payment.amount, 0);

        // Get pending renewals (permits expiring in next 30 days)
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const pendingRenewals = await Permit.count({
            where: {
                expiryDate: {
                    [Op.between]: [new Date(), thirtyDaysFromNow],
                },
            },
        });

        // Get compliance rate
        const compliantShops = await Shop.count({ where: { complianceStatus: 'compliant' } });
        const complianceRate = totalShops > 0 ? Math.round((compliantShops / totalShops) * 100) : 0;

        res.json({
            totalShops,
            todayRevenue,
            pendingRenewals,
            complianceRate,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
});

module.exports = router;
