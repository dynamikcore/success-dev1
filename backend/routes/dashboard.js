const express = require('express');
const router = express.Router();
const { Op, Sequelize } = require('sequelize');
const db = require('../models');
const { Shop, Payment, RevenueType, Permit } = db;

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
        const todayRevenue = todayPayments.reduce((sum, payment) => sum + (payment.amountPaid || payment.amount || 0), 0);

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

        // Get compliance rate (assuming shops have a complianceStatus field)
        const compliantShops = await Shop.count({
            where: {
                complianceStatus: 'compliant'
            }
        });
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

// GET /api/dashboard/charts - Dashboard chart data
router.get('/charts', async (req, res) => {
    try {
        // Revenue trend for last 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const revenueByMonth = await Payment.findAll({
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('paymentDate'), '%Y-%m'), 'month'],
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            where: {
                paymentDate: {
                    [Op.gte]: sixMonthsAgo
                }
            },
            group: ['month'],
            order: [['month', 'ASC']],
            raw: true
        }).catch(() => []); // Return empty array on error

        // Business type distribution
        const businessTypes = await Shop.findAll({
            attributes: [
                'businessType',
                [Sequelize.fn('COUNT', Sequelize.col('shopId')), 'count']
            ],
            group: ['businessType'],
            raw: true
        }).catch(() => []); // Return empty array on error

        // Revenue by ward
        const wardRevenue = await Payment.findAll({
            attributes: [
                [Sequelize.col('Shop.ward'), 'ward'],
                [Sequelize.fn('SUM', Sequelize.col('Payment.amount')), 'total']
            ],
            include: [{
                model: Shop,
                attributes: [],
                required: true // Inner join to ensure shop exists
            }],
            group: ['Shop.ward'],
            raw: true
        }).catch(() => []); // Return empty array on error

        // Format data for Chart.js
        const revenueChart = {
            labels: revenueByMonth.length > 0 ? revenueByMonth.map(item => {
                const date = new Date(item.month + '-01');
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }) : ['No Data'],
            datasets: [{
                label: 'Revenue (₦)',
                data: revenueByMonth.length > 0 ? revenueByMonth.map(item => parseFloat(item.total || 0)) : [0],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1
            }]
        };

        const businessTypeChart = {
            labels: businessTypes.length > 0 ? businessTypes.map(item => item.businessType || 'Unknown') : ['No Data'],
            datasets: [{
                data: businessTypes.length > 0 ? businessTypes.map(item => parseInt(item.count || 0)) : [0],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(199, 199, 199, 0.8)',
                    'rgba(83, 102, 255, 0.8)',
                    'rgba(255, 99, 255, 0.8)',
                    'rgba(99, 255, 132, 0.8)'
                ]
            }]
        };

        const wardRevenueChart = {
            labels: wardRevenue.length > 0 ? wardRevenue.map(item => item.ward || 'Unknown') : ['No Data'],
            datasets: [{
                label: 'Revenue (₦)',
                data: wardRevenue.length > 0 ? wardRevenue.map(item => parseFloat(item.total || 0)) : [0],
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        };

        res.json({
            revenueChart,
            businessTypeChart,
            wardRevenueChart
        });
    } catch (error) {
        console.error('Error fetching dashboard charts:', error);
        // Return empty chart data instead of error
        res.json({
            revenueChart: {
                labels: ['No Data'],
                datasets: [{ label: 'Revenue (₦)', data: [0], borderColor: 'rgb(75, 192, 192)', backgroundColor: 'rgba(75, 192, 192, 0.2)' }]
            },
            businessTypeChart: {
                labels: ['No Data'],
                datasets: [{ data: [0], backgroundColor: ['rgba(255, 99, 132, 0.8)'] }]
            },
            wardRevenueChart: {
                labels: ['No Data'],
                datasets: [{ label: 'Revenue (₦)', data: [0], backgroundColor: 'rgba(54, 162, 235, 0.8)' }]
            }
        });
    }
});

module.exports = router;