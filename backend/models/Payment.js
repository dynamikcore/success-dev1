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
    assessmentYear: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: () => new Date().getFullYear(),
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
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM('Cash', 'Bank Transfer', 'POS', 'Cheque', 'Online'),
      allowNull: false,
      defaultValue: 'Cash',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    collectedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Collector name cannot be empty.' },
      },
    },
    receiptNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      defaultValue: () => `RCP-${Date.now()}`,
    },
    paymentStatus: {
      type: DataTypes.ENUM('Paid', 'Partially Paid', 'Pending', 'Overdue'),
      allowNull: false,
      defaultValue: 'Paid',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  });

  Payment.associate = (db) => {
    Payment.belongsTo(db.Shop, { foreignKey: 'shopId' });
    Payment.belongsTo(db.RevenueType, { foreignKey: 'revenueTypeId' });
  };

  return Payment;
};