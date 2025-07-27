const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Permit, Shop, sequelize } = require('../server'); // Assuming server.js exports models and sequelize instance

// Helper to update shop compliance status (simplified logic - similar to payments.js)
const updateShopCompliance = async (shopId) => {
    try {
        const shop = await Shop.findByPk(shopId);
        if (shop) {
            const pendingPayments = await Payment.count({
                where: {
                    shopId: shopId,
                    paymentStatus: { [Op.in]: ['pending', 'partially_paid'] },
                    dueDate: { [Op.lt]: new Date() } // Overdue
                }
            });

            const expiredPermits = await Permit.count({
                where: {
                    shopId: shopId,
                    expiryDate: { [Op.lt]: new Date() } // Expired
                }
            });

            let newComplianceStatus = 'Compliant';
            if (pendingPayments > 0) {
                newComplianceStatus = 'Overdue Payments';
            }
            if (expiredPermits > 0) {
                newComplianceStatus = 'Expired Permits';
            }
            if (pendingPayments > 0 && expiredPermits > 0) {
                newComplianceStatus = 'Non-Compliant';
            }

            await shop.update({ complianceStatus: newComplianceStatus });
            console.log(`Shop ${shopId} compliance updated to: ${newComplianceStatus}`);
        }
    } catch (error) {
        console.error(`Error updating compliance for shop ${shopId}:`, error);
    }
};

// Helper for automatic expiry date calculation
const calculateExpiryDate = (issueDate, permitType) => {
    const date = new Date(issueDate);
    switch (permitType.toLowerCase()) {
        case 'business operating permit':
            date.setFullYear(date.getFullYear() + 1); // 1 year
            break;
        case 'signage permit':
            date.setFullYear(date.getFullYear() + 1); // 1 year
            break;
        case 'environmental permit':
            date.setFullYear(date.getFullYear() + 1); // 1 year
            break;
        // Add more permit types and their durations as needed
        default:
            date.setFullYear(date.getFullYear() + 1); // Default to 1 year
            break;
    }
    return date;
};

// GET /api/permits - List all permits with filters
router.get('/', async (req, res) => {
    const { page = 1, limit = 10, permitType, expiryStatus, shopId } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (permitType) {
        where.permitType = permitType;
    }
    if (shopId) {
        where.shopId = shopId;
    }

    if (expiryStatus) {
        const now = new Date();
        if (expiryStatus === 'expiring') {
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            where.expiryDate = { [Op.between]: [now, thirtyDaysFromNow] };
        } else if (expiryStatus === 'expired') {
            where.expiryDate = { [Op.lt]: now };
        } else if (expiryStatus === 'active') {
            where.expiryDate = { [Op.gte]: now };
        }
    }

    try {
        const { count, rows: permits } = await Permit.findAndCountAll({
            where,
            include: [{ model: Shop, as: 'Shop' }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['expiryDate', 'ASC']]
        });

        res.json({
            totalItems: count,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            permits
        });
    } catch (error) {
        console.error('Error fetching permits:', error);
        res.status(500).json({ message: 'Error fetching permits', error: error.message });
    }
});

// POST /api/permits - Issue new permit to shop
router.post('/', async (req, res) => {
    const { shopId, permitType, permitFee, issuedBy, documentPath } = req.body;

    if (!shopId || !permitType || !permitFee || !issuedBy) {
        return res.status(400).json({ message: 'Missing required permit fields.' });
    }

    try {
        const shop = await Shop.findByPk(shopId);
        if (!shop) {
            return res.status(404).json({ message: 'Shop not found.' });
        }

        const issueDate = new Date();
        const expiryDate = calculateExpiryDate(issueDate, permitType);

        const newPermit = await Permit.create({
            shopId,
            permitType,
            issueDate,
            expiryDate,
            permitFee,
            issuedBy,
            documentPath,
            renewalStatus: 'active'
        });

        await updateShopCompliance(shopId);

        res.status(201).json(newPermit);
    } catch (error) {
        console.error('Error issuing new permit:', error);
        res.status(500).json({ message: 'Error issuing new permit', error: error.message });
    }
});

// GET /api/permits/:id - Get permit details with shop information
router.get('/:id', async (req, res) => {
    try {
        const permit = await Permit.findByPk(req.params.id, {
            include: [{ model: Shop, as: 'Shop' }]
        });

        if (!permit) {
            return res.status(404).json({ message: 'Permit not found.' });
        }

        res.json(permit);
    } catch (error) {
        console.error('Error fetching permit details:', error);
        res.status(500).json({ message: 'Error fetching permit details', error: error.message });
    }
});

// PUT /api/permits/:id - Update permit details or extend expiry
router.put('/:id', async (req, res) => {
    const { permitType, permitFee, issuedBy, documentPath, extendByYears } = req.body;

    try {
        const permit = await Permit.findByPk(req.params.id);
        if (!permit) {
            return res.status(404).json({ message: 'Permit not found.' });
        }

        const updateData = {
            permitType: permitType || permit.permitType,
            permitFee: permitFee || permit.permitFee,
            issuedBy: issuedBy || permit.issuedBy,
            documentPath: documentPath || permit.documentPath
        };

        if (extendByYears) {
            const currentExpiry = new Date(permit.expiryDate);
            currentExpiry.setFullYear(currentExpiry.getFullYear() + parseInt(extendByYears));
            updateData.expiryDate = currentExpiry;
            updateData.renewalStatus = 'active'; // Reset status if extended
        }

        await permit.update(updateData);
        await updateShopCompliance(permit.shopId);

        res.json(permit);
    } catch (error) {
        console.error('Error updating permit:', error);
        res.status(500).json({ message: 'Error updating permit', error: error.message });
    }
});

// GET /api/permits/expiring - List permits expiring in next X days
router.get('/expiring/:days', async (req, res) => {
    const days = parseInt(req.params.days);
    if (isNaN(days) || days <= 0) {
        return res.status(400).json({ message: 'Invalid number of days specified.' });
    }

    try {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);

        const expiringPermits = await Permit.findAll({
            where: {
                expiryDate: { [Op.between]: [now, futureDate] },
                renewalStatus: { [Op.ne]: 'renewed' } // Not already renewed
            },
            include: [{ model: Shop, as: 'Shop' }],
            order: [['expiryDate', 'ASC']]
        });

        res.json(expiringPermits);
    } catch (error) {
        console.error('Error fetching expiring permits:', error);
        res.status(500).json({ message: 'Error fetching expiring permits', error: error.message });
    }
});

// GET /api/permits/expired - List expired permits requiring renewal
router.get('/expired', async (req, res) => {
    try {
        const now = new Date();
        const expiredPermits = await Permit.findAll({
            where: {
                expiryDate: { [Op.lt]: now },
                renewalStatus: { [Op.ne]: 'renewed' } // Not already renewed
            },
            include: [{ model: Shop, as: 'Shop' }],
            order: [['expiryDate', 'DESC']]
        });

        res.json(expiredPermits);
    } catch (error) {
        console.error('Error fetching expired permits:', error);
        res.status(500).json({ message: 'Error fetching expired permits', error: error.message });
    }
});

// POST /api/permits/:id/renew - Renew expired permit with new fee calculation
router.post('/:id/renew', async (req, res) => {
    const { newPermitFee, issuedBy } = req.body;

    try {
        const permit = await Permit.findByPk(req.params.id);
        if (!permit) {
            return res.status(404).json({ message: 'Permit not found.' });
        }

        // Ensure permit is expired or expiring soon before renewal
        const now = new Date();
        if (new Date(permit.expiryDate) > now && permit.renewalStatus === 'active') {
            // Optionally allow renewal before expiry, e.g., within 30 days
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(now.getDate() + 30);
            if (new Date(permit.expiryDate) > thirtyDaysFromNow) {
                return res.status(400).json({ message: 'Permit is not yet expired or expiring soon.' });
            }
        }

        const newIssueDate = new Date();
        const newExpiryDate = calculateExpiryDate(newIssueDate, permit.permitType);

        await permit.update({
            issueDate: newIssueDate,
            expiryDate: newExpiryDate,
            permitFee: newPermitFee || permit.permitFee, // Allow new fee or keep old
            issuedBy: issuedBy || permit.issuedBy,
            renewalStatus: 'renewed' // Mark as renewed
        });

        await updateShopCompliance(permit.shopId);

        res.json({
            message: 'Permit renewed successfully.',
            permit
        });
    } catch (error) {
        console.error('Error renewing permit:', error);
        res.status(500).json({ message: 'Error renewing permit', error: error.message });
    }
});

// GET /api/permits/by-type/:type - Get permits by specific type
router.get('/by-type/:type', async (req, res) => {
    try {
        const permits = await Permit.findAll({
            where: { permitType: { [Op.like]: `%${req.params.type}%` } },
            include: [{ model: Shop, as: 'Shop' }]
        });
        if (permits.length === 0) {
            return res.status(404).json({ message: `No permits found for type: ${req.params.type}` });
        }
        res.json(permits);
    } catch (error) {
        console.error('Error fetching permits by type:', error);
        res.status(500).json({ message: 'Error fetching permits by type', error: error.message });
    }
});

// POST /api/permits/bulk-renewal - Process multiple permit renewals
router.post('/bulk-renewal', async (req, res) => {
    const renewals = req.body.renewals; // Array of { permitId, newPermitFee, issuedBy } objects

    if (!Array.isArray(renewals) || renewals.length === 0) {
        return res.status(400).json({ message: 'No renewals provided for bulk processing.' });
    }

    const results = [];
    for (const renewalData of renewals) {
        const { permitId, newPermitFee, issuedBy } = renewalData;

        try {
            const permit = await Permit.findByPk(permitId);
            if (!permit) {
                results.push({ status: 'failed', message: `Permit ${permitId} not found.`, permitId });
                continue;
            }

            const now = new Date();
            if (new Date(permit.expiryDate) > now && permit.renewalStatus === 'active') {
                const thirtyDaysFromNow = new Date();
                thirtyDaysFromNow.setDate(now.getDate() + 30);
                if (new Date(permit.expiryDate) > thirtyDaysFromNow) {
                    results.push({ status: 'failed', message: `Permit ${permitId} is not yet expired or expiring soon.`, permitId });
                    continue;
                }
            }

            const newIssueDate = new Date();
            const newExpiryDate = calculateExpiryDate(newIssueDate, permit.permitType);

            await permit.update({
                issueDate: newIssueDate,
                expiryDate: newExpiryDate,
                permitFee: newPermitFee || permit.permitFee,
                issuedBy: issuedBy || permit.issuedBy,
                renewalStatus: 'renewed'
            });

            await updateShopCompliance(permit.shopId);

            results.push({ status: 'success', permitId, permit: permit.toJSON() });
        } catch (error) {
            console.error(`Error processing bulk renewal for permit ${permitId}:`, error);
            results.push({ status: 'failed', message: error.message, permitId });
        }
    }
    res.status(200).json(results);
});

module.exports = router;