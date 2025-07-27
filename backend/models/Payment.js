const { Sequelize, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    paymentId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'Shops', key: 'shopId' },
    },
    revenueTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'RevenueTypes', key: 'typeId' },
    },
    assessmentYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: new Date().getFullYear(),
      validate: {
        isInt: true,
        min: 2000, // Assuming revenue collection started after 2000
      },
    },
    amountDue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true, // Can be null if not applicable or calculated later
    },
    paymentMethod: {
      type: DataTypes.ENUM("Cash", "Bank Transfer", "POS", "Online", "Cheque"),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Payment method cannot be empty.' },
      },
    },
    receiptNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: () => `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    paymentStatus: {
      type: DataTypes.ENUM("Paid", "Pending", "Overdue", "Partial"),
      allowNull: false,
      defaultValue: "Pending",
    },
    collectedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Collected by cannot be empty.' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
  }, {
    indexes: [
      { unique: true, fields: ['paymentId'] },
      { unique: true, fields: ['receiptNumber'] },
      { fields: ['shopId'] },
      { fields: ['revenueTypeId'] },
      { fields: ['paymentStatus'] },
      { fields: ['paymentDate'] },
    ],
  });

  Payment.associate = (db) => {
    Payment.belongsTo(db.Shop, { foreignKey: 'shopId' });
    Payment.belongsTo(db.RevenueType, { foreignKey: 'revenueTypeId' });
  };



  return Payment;
};