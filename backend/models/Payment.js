const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    paymentId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
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
    hooks: {
      beforeCreate: async (payment, options) => {
        const currentYear = new Date().getFullYear();
        // Generate paymentId
        const paymentPrefix = 'UVW/PAY';
        const lastPayment = await Payment.findOne({
          order: [['paymentId', 'DESC']],
          where: { paymentId: { [DataTypes.Op.like]: `${paymentPrefix}/%/${currentYear}/%` } },
          paranoid: false
        });

        let nextPaymentSequence = 1;
        if (lastPayment) {
          const lastIdParts = lastPayment.paymentId.split('/');
          const lastSequence = parseInt(lastIdParts[3], 10);
          if (!isNaN(lastSequence)) {
            nextPaymentSequence = lastSequence + 1;
          }
        }
        const formattedPaymentSequence = String(nextPaymentSequence).padStart(3, '0');
        payment.paymentId = `${paymentPrefix}/${currentYear}/${formattedPaymentSequence}`;

        // Generate receiptNumber
        const receiptPrefix = 'UVW/REC';
        const lastReceipt = await Payment.findOne({
          order: [['receiptNumber', 'DESC']],
          where: { receiptNumber: { [DataTypes.Op.like]: `${receiptPrefix}/%/${currentYear}/%` } },
          paranoid: false
        });

        let nextReceiptSequence = 1;
        if (lastReceipt) {
          const lastIdParts = lastReceipt.receiptNumber.split('/');
          const lastSequence = parseInt(lastIdParts[3], 10);
          if (!isNaN(lastSequence)) {
            nextReceiptSequence = lastSequence + 1;
          }
        }
        const formattedReceiptSequence = String(nextReceiptSequence).padStart(3, '0');
        payment.receiptNumber = `${receiptPrefix}/${currentYear}/${formattedReceiptSequence}`;
      },
    },
    indexes: [
      { unique: true, fields: ['paymentId'] },
      { unique: true, fields: ['receiptNumber'] },
      { fields: ['shopId'] },
      { fields: ['revenueTypeId'] },
      { fields: ['paymentStatus'] },
      { fields: ['paymentDate'] },
    ],
  });

  Payment.associate = (models) => {
    Payment.belongsTo(models.Shop, { foreignKey: 'shopId' });
    Payment.belongsTo(models.RevenueType, { foreignKey: 'revenueTypeId' });
  };

  return Payment;
};