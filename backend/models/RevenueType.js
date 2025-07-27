const { Sequelize, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const RevenueType = sequelize.define('RevenueType', {
    typeId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `REV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    typeName: {
      type: DataTypes.ENUM(
        "Business Registration Fee",
        "Annual Business Permit",
        "Signage Permit",
        "Shop Premises Tax",
        "Environmental Levy",
        "Fire Safety Certificate",
        "Market Levy",
        "Trading License"
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Revenue type name cannot be empty.' },
      },
    },
    baseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    calculationMethod: {
      type: DataTypes.ENUM("Fixed", "SizeBased", "PercentageOfRevenue"),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Calculation method cannot be empty.' },
      },
    },
    frequency: {
      type: DataTypes.ENUM("Annual", "Monthly", "OneTime", "Quarterly"),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Frequency cannot be empty.' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    minimumAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    maximumAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
  }, {
    hooks: {
    },
    indexes: [
      { unique: true, fields: ['typeId'] },
      { fields: ['typeName'] },
      { fields: ['calculationMethod'] },
      { fields: ['frequency'] },
      { fields: ['isActive'] },
    ],
  });

  // Method for calculating actual fees
  RevenueType.calculateFee = async (revenueTypeId, shopSizeCategory, businessType, shopRevenue = 0) => {
    const revenueType = await RevenueType.findByPk(revenueTypeId);
    if (!revenueType) {
      throw new Error('Revenue type not found.');
    }

    let calculatedAmount = parseFloat(revenueType.baseAmount);

    switch (revenueType.calculationMethod) {
      case 'Fixed':
        // Amount is fixed, no further calculation needed based on shop properties
        break;
      case 'SizeBased':
        // Example logic for size-based calculation (can be expanded)
        if (shopSizeCategory === 'Small') {
          calculatedAmount *= 1.0; // No change or small multiplier
        } else if (shopSizeCategory === 'Medium') {
          calculatedAmount *= 1.5; // Medium multiplier
        } else if (shopSizeCategory === 'Large') {
          calculatedAmount *= 2.0; // Large multiplier
        }
        break;
      case 'PercentageOfRevenue':
        // Example: 5% of shop revenue
        calculatedAmount = shopRevenue * (calculatedAmount / 100); // baseAmount is treated as percentage
        break;
      default:
        break;
    }

    // Apply minimum and maximum constraints
    if (calculatedAmount < revenueType.minimumAmount) {
      calculatedAmount = parseFloat(revenueType.minimumAmount);
    }
    if (revenueType.maximumAmount && calculatedAmount > revenueType.maximumAmount) {
      calculatedAmount = parseFloat(revenueType.maximumAmount);
    }

    return calculatedAmount.toFixed(2); // Return as a string with 2 decimal places
  };

  RevenueType.associate = (db) => {
    RevenueType.hasMany(db.Payment, { foreignKey: 'revenueTypeId' });
  };



  return RevenueType;
};