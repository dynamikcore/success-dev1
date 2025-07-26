// utils/uvwieTaxCalculator.js

const { Op } = require('sequelize');
const { Shop, Payment, RevenueType } = require('../server'); // Assuming server.js exports models

// Constants for business types and their special rates
const BUSINESS_TYPES = {
    SMALL: ['kiosk', 'barber_shop', 'tailor', 'small_retail'],
    MEDIUM: ['boutique', 'supermarket', 'restaurant', 'pharmacy'],
    LARGE: ['hotel', 'bank', 'manufacturing', 'large_retail']
};

const SPECIAL_RATES = {
    restaurant: { small: 10000, medium: 25000, large: 50000 },
    pharmacy: { small: 12000, medium: 30000, large: 60000 },
    bank: { small: 15000, medium: 35000, large: 75000 }
};

/**
 * Calculates the business registration fee based on shop size and business type.
 * @param {string} shopSize - 'small', 'medium', or 'large'
 * @param {string} businessType - Specific type of business (e.g., 'restaurant', 'kiosk')
 * @returns {number} The calculated registration fee.
 */
function calculateBusinessRegistrationFee(shopSize, businessType) {
    if (!shopSize || !businessType) {
        throw new Error('Shop size and business type are required.');
    }

    let fee = 0;
    const lowerCaseBusinessType = businessType.toLowerCase();

    // Check for special rates first
    if (SPECIAL_RATES[lowerCaseBusinessType]) {
        switch (shopSize.toLowerCase()) {
            case 'small':
                fee = SPECIAL_RATES[lowerCaseBusinessType].small;
                break;
            case 'medium':
                fee = SPECIAL_RATES[lowerCaseBusinessType].medium;
                break;
            case 'large':
                fee = SPECIAL_RATES[lowerCaseBusinessType].large;
                break;
            default:
                throw new Error('Invalid shop size provided.');
        }
    } else {
        // General rates based on shop size
        switch (shopSize.toLowerCase()) {
            case 'small':
                fee = 7500; // Average for small shops
                break;
            case 'medium':
                fee = 25000; // Average for medium shops
                break;
            case 'large':
                fee = 55000; // Average for large shops
                break;
            default:
                throw new Error('Invalid shop size provided.');
        }
    }

    // Add some variability based on general business type if not special
    if (!SPECIAL_RATES[lowerCaseBusinessType]) {
        if (BUSINESS_TYPES.SMALL.includes(lowerCaseBusinessType)) {
            fee = Math.max(5000, Math.min(15000, fee));
        } else if (BUSINESS_TYPES.MEDIUM.includes(lowerCaseBusinessType)) {
            fee = Math.max(15000, Math.min(35000, fee));
        } else if (BUSINESS_TYPES.LARGE.includes(lowerCaseBusinessType)) {
            fee = Math.max(35000, Math.min(75000, fee));
        }
    }

    return fee;
}

/**
 * Calculates the annual permit fee.
 * @param {string} shopSize - 'small', 'medium', or 'large'
 * @param {string} businessType - Type of business
 * @param {string} location - Specific location/ward
 * @returns {number} The calculated annual permit fee.
 */
function calculateAnnualPermitFee(shopSize, businessType, location) {
    if (!shopSize || !businessType || !location) {
        throw new Error('Shop size, business type, and location are required.');
    }

    let fee = 0;
    const lowerCaseBusinessType = businessType.toLowerCase();

    switch (shopSize.toLowerCase()) {
        case 'small':
            fee = 10000;
            break;
        case 'medium':
            fee = 25000;
            break;
        case 'large':
            fee = 50000;
            break;
        default:
            throw new Error('Invalid shop size provided.');
    }

    // Adjust based on business type (example logic)
    if (['restaurant', 'hotel', 'bank'].includes(lowerCaseBusinessType)) {
        fee *= 1.2; // 20% higher for high-impact businesses
    }

    // Adjust based on location (example logic)
    if (['effurun', 'warri'].includes(location.toLowerCase())) { // Assuming these are prime locations
        fee *= 1.1; // 10% higher for prime locations
    }

    return Math.round(fee);
}

/**
 * Calculates the signage permit fee.
 * @param {string} signageType - 'small', 'medium', 'large', 'billboard'
 * @param {string} shopSize - 'small', 'medium', or 'large'
 * @returns {number} The calculated signage permit fee.
 */
function calculateSignagePermitFee(signageType, shopSize) {
    if (!signageType || !shopSize) {
        throw new Error('Signage type and shop size are required.');
    }

    let fee = 0;

    switch (signageType.toLowerCase()) {
        case 'small':
            fee = 2000;
            break;
        case 'medium':
            fee = 5000;
            break;
        case 'large':
            fee = 10000;
            break;
        case 'billboard':
            fee = 25000;
            break;
        default:
            throw new Error('Invalid signage type provided.');
    }

    // Adjust based on shop size (larger shops might have larger/more prominent signs)
    switch (shopSize.toLowerCase()) {
        case 'small':
            fee *= 0.9;
            break;
        case 'medium':
            // no change
            break;
        case 'large':
            fee *= 1.1;
            break;
        default:
            throw new Error('Invalid shop size provided.');
    }

    return Math.round(fee);
}

/**
 * Calculates the environmental levy.
 * @param {string} businessType - Type of business
 * @param {string} shopSize - 'small', 'medium', or 'large'
 * @returns {number} The calculated environmental levy.
 */
function calculateEnvironmentalLevy(businessType, shopSize) {
    if (!businessType || !shopSize) {
        throw new Error('Business type and shop size are required.');
    }

    let levy = 0;
    const lowerCaseBusinessType = businessType.toLowerCase();

    switch (shopSize.toLowerCase()) {
        case 'small':
            levy = 1000;
            break;
        case 'medium':
            levy = 2500;
            break;
        case 'large':
            levy = 5000;
            break;
        default:
            throw new Error('Invalid shop size provided.');
    }

    // Businesses with higher environmental impact might pay more
    if (['restaurant', 'manufacturing', 'hotel'].includes(lowerCaseBusinessType)) {
        levy *= 1.5;
    }

    return Math.round(levy);
}

/**
 * Calculates the shop premises tax.
 * @param {string} shopSize - 'small', 'medium', or 'large'
 * @param {string} ward - The ward where the shop is located
 * @param {string} businessType - Type of business
 * @returns {number} The calculated shop premises tax.
 */
function calculateShopPremisesTax(shopSize, ward, businessType) {
    if (!shopSize || !ward || !businessType) {
        throw new Error('Shop size, ward, and business type are required.');
    }

    let tax = 0;

    switch (shopSize.toLowerCase()) {
        case 'small':
            tax = 5000;
            break;
        case 'medium':
            tax = 12000;
            break;
        case 'large':
            tax = 25000;
            break;
        default:
            throw new Error('Invalid shop size provided.');
    }

    // Adjust based on ward (prime locations might have higher taxes)
    if (['effurun', 'warri'].includes(ward.toLowerCase())) {
        tax *= 1.2;
    }

    // Adjust based on business type (e.g., high-profit businesses)
    if (['bank', 'hotel', 'large_retail'].includes(businessType.toLowerCase())) {
        tax *= 1.1;
    }

    return Math.round(tax);
}

/**
 * Calculates the penalty for overdue payments.
 * @param {number} originalAmount - The original amount due.
 * @param {number} daysOverdue - The number of days the payment is overdue.
 * @returns {number} The calculated penalty amount.
 */
function calculatePenalty(originalAmount, daysOverdue) {
    if (typeof originalAmount !== 'number' || originalAmount < 0) {
        throw new Error('Original amount must be a non-negative number.');
    }
    if (typeof daysOverdue !== 'number' || daysOverdue < 0) {
        throw new Error('Days overdue must be a non-negative number.');
    }

    if (daysOverdue === 0) {
        return 0;
    }

    const initialPenaltyRate = 0.05; // 5%
    const monthlyPenaltyRate = 0.01; // 1% per month

    let penalty = originalAmount * initialPenaltyRate;

    const monthsOverdue = Math.floor(daysOverdue / 30);
    penalty += originalAmount * monthlyPenaltyRate * monthsOverdue;

    return Math.round(penalty);
}

/**
 * Calculates the total amount due for a shop for a specific assessment year.
 * This function would typically query the database for all relevant fees and outstanding payments.
 * @param {string} shopId - The ID of the shop.
 * @param {number} assessmentYear - The assessment year.
 * @returns {Promise<number>} The total amount due.
 */
async function calculateTotalDue(shopId, assessmentYear) {
    if (!shopId || !assessmentYear) {
        throw new Error('Shop ID and assessment year are required.');
    }

    try {
        const shop = await Shop.findOne({ where: { shopId } });
        if (!shop) {
            throw new Error(`Shop with ID ${shopId} not found.`);
        }

        // Get all revenue types applicable for the year (simplified for example)
        const revenueTypes = await RevenueType.findAll({ where: { isActive: true } });

        let totalDue = 0;

        // Calculate all potential fees for the shop for the year
        // This is a simplified example; in a real system, you'd have more complex logic
        // to determine which fees apply to which shop for which year.

        // Example: Business Registration Fee (might be annual or one-time, assuming annual for this calculation)
        totalDue += calculateBusinessRegistrationFee(shop.shopSizeCategory, shop.businessType);

        // Example: Annual Permit Fee
        totalDue += calculateAnnualPermitFee(shop.shopSizeCategory, shop.businessType, shop.ward);

        // Example: Environmental Levy
        totalDue += calculateEnvironmentalLevy(shop.businessType, shop.shopSizeCategory);

        // Example: Shop Premises Tax
        totalDue += calculateShopPremisesTax(shop.shopSizeCategory, shop.ward, shop.businessType);

        // Sum up all payments made by the shop for the assessment year
        const payments = await Payment.findAll({
            where: {
                shopId: shop.shopId,
                assessmentYear: assessmentYear,
                paymentStatus: { [Op.in]: ['completed', 'partially_paid'] }
            }
        });

        const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

        // Calculate outstanding amount
        let outstanding = totalDue - totalPaid;

        // Add penalties for any overdue payments for this year
        for (const payment of payments) {
            if (payment.paymentStatus === 'partially_paid' || (payment.paymentStatus === 'pending' && new Date() > new Date(payment.dueDate))) {
                const today = new Date();
                const dueDate = new Date(payment.dueDate);
                const daysOverdue = Math.max(0, Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24)));
                outstanding += calculatePenalty(payment.amountDue - payment.amountPaid, daysOverdue);
            }
        }

        return Math.round(outstanding);

    } catch (error) {
        console.error(`Error calculating total due for shop ${shopId}:`, error.message);
        throw error;
    }
}

module.exports = {
    calculateBusinessRegistrationFee,
    calculateAnnualPermitFee,
    calculateSignagePermitFee,
    calculateEnvironmentalLevy,
    calculateShopPremisesTax,
    calculatePenalty,
    calculateTotalDue
};