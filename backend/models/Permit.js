const { Sequelize, Op } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Permit = sequelize.define('Permit', {
    permitId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      primaryKey: true,
      defaultValue: () => `PERMIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    },
    shopId: {
      type: DataTypes.STRING,
      allowNull: false,
      references: { model: 'Shops', key: 'shopId' },
    },
    permitType: {
      type: DataTypes.ENUM(
        "Business Operating Permit",
        "Signage Permit",
        "Fire Safety Certificate",
        "Environmental Clearance",
        "Trading License"
      ),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Permit type cannot be empty.' },
      },
    },
    issueDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true, // Will be calculated based on permit type
    },
    renewalStatus: {
      type: DataTypes.ENUM("Active", "Expired", "Renewed", "Cancelled"),
      allowNull: false,
      defaultValue: "Active",
    },
    permitFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    issuedBy: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Issued by cannot be empty.' },
      },
    },
    documentPath: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    indexes: [
      { unique: true, fields: ['permitId'] },
      { fields: ['shopId'] },
      { fields: ['permitType'] },
      { fields: ['issueDate'] },
      { fields: ['expiryDate'] },
      { fields: ['renewalStatus'] },
    ],
  });

  Permit.associate = (db) => {
    Permit.belongsTo(db.Shop, { foreignKey: 'shopId' });
  };



  // Method to check if permit is expired
  Permit.prototype.isExpired = function() {
    return this.expiryDate && new Date() > new Date(this.expiryDate);
  };

  // Method to calculate renewal fee (example logic)
  Permit.prototype.calculateRenewalFee = function() {
    // This is a placeholder. Real logic would depend on permit type, status, etc.
    if (this.isExpired()) {
      return parseFloat(this.permitFee) * 1.2; // 20% penalty for expired permits
    } else {
      return parseFloat(this.permitFee);
    }
  };

  return Permit;
};