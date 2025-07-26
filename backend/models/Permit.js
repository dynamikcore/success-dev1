const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permit = sequelize.define('Permit', {
    permitId: {
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
    hooks: {
      beforeCreate: async (permit, options) => {
        const currentYear = new Date().getFullYear();
        const prefix = 'UVW/PERMIT';
        const lastPermit = await Permit.findOne({
          order: [['permitId', 'DESC']],
          where: { permitId: { [DataTypes.Op.like]: `${prefix}/%/${currentYear}/%` } },
          paranoid: false
        });

        let nextSequence = 1;
        if (lastPermit) {
          const lastIdParts = lastPermit.permitId.split('/');
          const lastSequence = parseInt(lastIdParts[3], 10);
          if (!isNaN(lastSequence)) {
            nextSequence = lastSequence + 1;
          }
        }
        const formattedSequence = String(nextSequence).padStart(3, '0');
        permit.permitId = `${prefix}/${currentYear}/${formattedSequence}`;

        // Calculate expiryDate based on permitType (example logic)
        const issueDate = permit.issueDate || new Date();
        let expiryDate = new Date(issueDate);
        switch (permit.permitType) {
          case 'Business Operating Permit':
          case 'Environmental Clearance':
          case 'Trading License':
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Annual
            break;
          case 'Signage Permit':
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Annual
            break;
          case 'Fire Safety Certificate':
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Annual
            break;
          default:
            // Default to 1 year if type not specified or unknown
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            break;
        }
        permit.expiryDate = expiryDate;
      },
    },
    indexes: [
      { unique: true, fields: ['permitId'] },
      { fields: ['shopId'] },
      { fields: ['permitType'] },
      { fields: ['issueDate'] },
      { fields: ['expiryDate'] },
      { fields: ['renewalStatus'] },
    ],
  });

  Permit.associate = (models) => {
    Permit.belongsTo(models.Shop, { foreignKey: 'shopId' });
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