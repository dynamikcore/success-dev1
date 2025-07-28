module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
    paymentId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    receiptNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: () => `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'Shops',
        key: 'shopId',
      },
    },
    revenueTypeId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'RevenueTypes',
        key: 'typeId',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    amountDue: {
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
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Bank Transfer', 'POS', 'Online', 'Cheque'),
      allowNull: false,
      defaultValue: 'Cash',
    },
    paymentStatus: {
      type: DataTypes.ENUM('Completed', 'Pending', 'Failed', 'Refunded'),
      allowNull: false,
      defaultValue: 'Completed',
    },
    collectedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Collector name cannot be empty.' },
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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